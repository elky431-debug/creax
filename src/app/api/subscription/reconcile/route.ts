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

    const body = await req.json().catch(() => ({} as { dryRun?: boolean; limit?: number }));
    const dryRun = body?.dryRun === true;
    const limit = typeof body?.limit === "number" ? body.limit : 500;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const allowedPriceIds = new Set(
      [STRIPE_PRICES.CREATOR_MONTHLY, STRIPE_PRICES.DESIGNER_MONTHLY].filter(Boolean)
    );

    const users = await prisma.user.findMany({
      where: { stripeCustomerId: { not: null } },
      select: { id: true, stripeCustomerId: true }
    });

    const nowMs = Date.now();
    let scanned = 0;
    let updated = 0;
    let activeFound = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    for (const u of users.slice(0, limit)) {
      scanned += 1;
      const customerId = u.stripeCustomerId!;

      try {
        const subs = await stripe.subscriptions.list({
          customer: customerId,
          status: "all",
          limit: 20
        });

        // on garde seulement les abonnements encore valides (active/trialing et période pas expirée)
        const candidates = subs.data
          .filter(s => (s.status === "active" || s.status === "trialing") && (s.current_period_end || 0) * 1000 > nowMs)
          .sort((a, b) => (b.current_period_end || 0) - (a.current_period_end || 0));

        const best = candidates[0];
        if (!best) continue;

        activeFound += 1;

        const priceId =
          typeof best.items.data[0]?.price?.id === "string" ? best.items.data[0].price.id : "";

        // On ignore les subscriptions qui ne correspondent pas à nos prices (sécurité)
        if (allowedPriceIds.size > 0 && priceId && !allowedPriceIds.has(priceId)) {
          continue;
        }

        if (dryRun) continue;

        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: best.id },
          update: {
            userId: u.id,
            status: best.status,
            currentPeriodEnd: new Date((best.current_period_end || 0) * 1000),
            stripePriceId: priceId
          },
          create: {
            userId: u.id,
            stripeSubscriptionId: best.id,
            status: best.status,
            currentPeriodEnd: new Date((best.current_period_end || 0) * 1000),
            stripePriceId: priceId
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


