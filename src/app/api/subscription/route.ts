export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { stripe } from "@/lib/stripe";

// GET - Récupérer le statut de l'abonnement
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const subscription = user.subscriptions[0];
    const now = new Date();
    const isActive =
      !!subscription &&
      (subscription.status === "active" || subscription.status === "trialing") &&
      new Date(subscription.currentPeriodEnd) > now;

    // Vérifier sur Stripe si l'abonnement est programmé pour être annulé
    let cancelAtPeriodEnd = false;
    if (subscription?.stripeSubscriptionId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        );
        cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
      } catch {
        // Ignorer l'erreur si l'abonnement n'existe plus sur Stripe
      }
    }

    return NextResponse.json({
      hasSubscription: isActive,
      subscription: subscription
        ? {
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            isTrial: subscription.status === "trialing",
            cancelAtPeriodEnd
          }
        : null
    });
  } catch (error) {
    console.error("Erreur subscription GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}




























