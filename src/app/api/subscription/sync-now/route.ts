import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import Stripe from "stripe";

export const runtime = "nodejs";

function pickBestActiveSubscription(subs: Stripe.Subscription[], nowMs: number) {
  return subs
    .filter(
      s =>
        (s.status === "active" || s.status === "trialing") &&
        (s.current_period_end || 0) * 1000 > nowMs
    )
    .sort((a, b) => (b.current_period_end || 0) - (a.current_period_end || 0))[0];
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, stripeCustomerId: true }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const allowedPriceIds = new Set(
      [STRIPE_PRICES.CREATOR_MONTHLY, STRIPE_PRICES.DESIGNER_MONTHLY].filter(Boolean)
    );

    const nowMs = Date.now();
    const customerIds: string[] = [];

    if (user.stripeCustomerId) customerIds.push(user.stripeCustomerId);

    // Fallback: retrouver le customer Stripe par email (utile si paiement a été fait sur un autre customer)
    if (customerIds.length === 0) {
      const customers = await stripe.customers.search({
        query: `email:'${user.email.replace(/'/g, "\\'")}'`,
        limit: 10
      });
      for (const c of customers.data) {
        if (typeof c.id === "string") customerIds.push(c.id);
      }
    }

    let bestSub: Stripe.Subscription | undefined;
    let bestPriceId = "";
    let bestCustomerId: string | null = null;

    for (const customerId of customerIds) {
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 20
      });

      const candidate = pickBestActiveSubscription(subs.data, nowMs);
      if (!candidate) continue;

      const priceId =
        typeof candidate.items.data[0]?.price?.id === "string"
          ? candidate.items.data[0].price.id
          : "";

      // Si on a configuré des Price IDs, on ne considère que ces plans
      if (allowedPriceIds.size > 0 && priceId && !allowedPriceIds.has(priceId)) {
        continue;
      }

      if (
        !bestSub ||
        (candidate.current_period_end || 0) > (bestSub.current_period_end || 0)
      ) {
        bestSub = candidate;
        bestPriceId = priceId;
        bestCustomerId = customerId;
      }
    }

    if (!bestSub) {
      return NextResponse.json({ hasActiveSubscription: false });
    }

    // Enregistrer le customerId si besoin
    if (!user.stripeCustomerId && bestCustomerId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: bestCustomerId }
      });
    }

    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: bestSub.id },
      update: {
        userId: user.id,
        status: bestSub.status,
        currentPeriodEnd: new Date((bestSub.current_period_end || 0) * 1000),
        stripePriceId: bestPriceId
      },
      create: {
        userId: user.id,
        stripeSubscriptionId: bestSub.id,
        status: bestSub.status,
        currentPeriodEnd: new Date((bestSub.current_period_end || 0) * 1000),
        stripePriceId: bestPriceId
      }
    });

    return NextResponse.json({
      hasActiveSubscription: true,
      subscription: {
        status: bestSub.status,
        currentPeriodEnd: new Date((bestSub.current_period_end || 0) * 1000),
        stripePriceId: bestPriceId
      }
    });
  } catch (error) {
    console.error("Erreur sync-now:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


