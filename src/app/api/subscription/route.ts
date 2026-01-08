export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { stripe } from "@/lib/stripe";

// GET - Récupérer le statut de l'abonnement
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Important perf: on ne charge pas l'utilisateur complet.
    // On lit directement le dernier abonnement en DB.
    const subscription = await prisma.subscription.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    });

    const now = new Date();
    const isActive =
      !!subscription &&
      (subscription.status === "active" || subscription.status === "trialing") &&
      new Date(subscription.currentPeriodEnd) > now;

    // Par défaut, NE PAS appeler Stripe (trop lent).
    // On ne le fait que si explicitement demandé (ex: page profil).
    const url = new URL(req.url);
    const includeStripe = url.searchParams.get("stripe") === "1";

    let cancelAtPeriodEnd = false;
    if (includeStripe && subscription?.stripeSubscriptionId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        );
        cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
      } catch {
        // Ignorer l'erreur si l'abonnement n'existe plus sur Stripe
      }
    }

    const res = NextResponse.json({
      hasSubscription: isActive,
      subscription: subscription
        ? {
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            isTrial: subscription.status === "trialing",
            // n'est fiable que si includeStripe=1; sinon false (UI peut l'ignorer)
            cancelAtPeriodEnd
          }
        : null
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error) {
    console.error("Erreur subscription GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}




























