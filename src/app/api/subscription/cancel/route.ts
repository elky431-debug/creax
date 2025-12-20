import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// POST - Résilier l'abonnement (reste actif jusqu'à la fin de la période)
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'abonnement actif de l'utilisateur
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["active", "trialing"] }
      },
      orderBy: { createdAt: "desc" }
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Aucun abonnement actif trouvé" },
        { status: 404 }
      );
    }

    // Annuler l'abonnement sur Stripe (reste actif jusqu'à la fin de la période)
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId, 
      { cancel_at_period_end: true }
    );

    // Note: On ne change pas le statut en base - l'abonnement reste "active"
    // jusqu'à ce que Stripe envoie le webhook à la fin de la période

    return NextResponse.json({
      success: true,
      cancelAtPeriodEnd: true,
      periodEnd: updatedSubscription.current_period_end,
      message: "Abonnement résilié. Vous conservez l'accès jusqu'au " + 
        new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric"
        })
    });
  } catch (error) {
    console.error("Erreur annulation abonnement:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'annulation de l'abonnement" },
      { status: 500 }
    );
  }
}

