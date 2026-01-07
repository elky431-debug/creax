import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";

// Route admin: resynchronise la DB depuis Stripe pour les users qui ont déjà payé
// Sécurité: nécessite un secret via header `x-reconcile-secret` ou query `?secret=...`
export const runtime = "nodejs";

function isAuthorized(req: Request) {
  const secretFromHeader = req.headers.get("x-reconcile-secret");
  const { searchParams } = new URL(req.url);
  const secretFromQuery = searchParams.get("secret");
  const expected = process.env.RECONCILE_SECRET;

  if (!expected) return false;
  return secretFromHeader === expected || secretFromQuery === expected;
}

export async function POST(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req
      .json()
      .catch(
        () =>
          ({} as {
            dryRun?: boolean;
            limit?: number;
            matchByEmail?: boolean;
          })
      );
    const dryRun = body?.dryRun === true;
    const limit = typeof body?.limit === "number" ? body.limit : 500;
    const matchByEmail = body?.matchByEmail === true;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const allowedPriceIds = new Set(
      [STRIPE_PRICES.CREATOR_MONTHLY, STRIPE_PRICES.DESIGNER_MONTHLY].filter(Boolean)
    );

    const users = await prisma.user.findMany({
      where: matchByEmail ? {} : { stripeCustomerId: { not: null } },
      select: { id: true, email: true, stripeCustomerId: true }
    });

    const nowMs = Date.now();
    let scanned = 0;
    let updated = 0;
    let activeFound = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    for (const u of users.slice(0, limit)) {
      scanned += 1;

      try {
        // 1) On essaie avec stripeCustomerId si on l'a
        // 2) Sinon, optionnellement, on cherche le customer Stripe par email et on prend celui qui a une subscription active
        const customerIds: string[] = [];
        if (u.stripeCustomerId) customerIds.push(u.stripeCustomerId);

        if (customerIds.length === 0 && matchByEmail) {
          // Stripe search syntax: https://stripe.com/docs/search#search-query-language
          const email = u.email?.trim();
          if (email) {
            const customers = await stripe.customers.search({
              query: `email:'${email.replace(/'/g, "\\'")}'`,
              limit: 10
            });
            for (const c of customers.data) {
              if (typeof c.id === "string") customerIds.push(c.id);
            }
          }
        }

        if (customerIds.length === 0) continue;

        // Lister les subscriptions de chaque customer, garder la meilleure (active/trialing la plus récente)
        let bestSub: Stripe.Subscription | null = null;
        let bestPriceId = "";

        for (const customerId of customerIds) {
          const subs = await stripe.subscriptions.list({
            customer: customerId,
            status: "all",
            limit: 20
          });

          // on garde seulement les abonnements encore valides (active/trialing et période pas expirée)
          const candidates = subs.data
            .filter(
              s =>
                (s.status === "active" || s.status === "trialing") &&
                (s.current_period_end || 0) * 1000 > nowMs
            )
            .sort((a, b) => (b.current_period_end || 0) - (a.current_period_end || 0));

          const best = candidates[0];
          if (!best) continue;

          const priceId =
            typeof best.items.data[0]?.price?.id === "string"
              ? best.items.data[0].price.id
              : "";

          // On ignore les subscriptions qui ne correspondent pas à nos prices (sécurité)
          if (
            allowedPriceIds.size > 0 &&
            priceId &&
            !allowedPriceIds.has(priceId)
          ) {
            continue;
          }

          if (
            !bestSub ||
            (best.current_period_end || 0) > (bestSub.current_period_end || 0)
          ) {
            bestSub = best;
            bestPriceId = priceId;
          }
        }

        if (!bestSub) continue;

        activeFound += 1;

        if (dryRun) continue;

        // Si on a trouvé le customer via email, on sauvegarde stripeCustomerId sur le user
        if (!u.stripeCustomerId) {
          const customerIdToStore =
            typeof bestSub.customer === "string" ? bestSub.customer : null;
          if (customerIdToStore) {
            await prisma.user.update({
              where: { id: u.id },
              data: { stripeCustomerId: customerIdToStore }
            });
          }
        }

        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: bestSub.id },
          update: {
            userId: u.id,
            status: bestSub.status,
            currentPeriodEnd: new Date(
              (bestSub.current_period_end || 0) * 1000
            ),
            stripePriceId: bestPriceId
          },
          create: {
            userId: u.id,
            stripeSubscriptionId: bestSub.id,
            status: bestSub.status,
            currentPeriodEnd: new Date(
              (bestSub.current_period_end || 0) * 1000
            ),
            stripePriceId: bestPriceId
          }
        });

        updated += 1;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        errors.push({ userId: u.id, error: msg });
      }
    }

    return NextResponse.json({
      ok: true,
      dryRun,
      limit,
      matchByEmail,
      usersWithStripeCustomerId: users.length,
      scanned,
      activeFound,
      updated,
      errorsCount: errors.length,
      errors: errors.slice(0, 20)
    });
  } catch (error) {
    console.error("Erreur reconcile:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


