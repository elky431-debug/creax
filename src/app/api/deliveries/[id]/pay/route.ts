/**
 * API pour payer une livraison via Stripe
 * 
 * POST /api/deliveries/[id]/pay - Créer une session de paiement Stripe
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// Initialiser Stripe seulement si la clé est présente
function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY non configurée");
  }
  return new Stripe(secretKey);
}

/**
 * POST - Créer une session de paiement pour une livraison
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // 2. Récupérer l'ID de la livraison
    const deliveryId = params.id;
    if (!deliveryId) {
      return NextResponse.json({ error: "ID livraison manquant" }, { status: 400 });
    }

    // 3. Récupérer la livraison depuis la base de données
    const delivery = await prisma.missionDelivery.findUnique({
      where: { id: deliveryId },
      include: {
        mission: {
          select: { id: true, title: true }
        },
        freelancer: {
          select: {
            profile: {
              select: { displayName: true }
            }
          }
        }
      }
    });

    if (!delivery) {
      return NextResponse.json({ error: "Livraison introuvable" }, { status: 404 });
    }

    // 4. Vérifier que c'est le créateur qui paie
    if (delivery.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Seul le créateur peut effectuer le paiement" },
        { status: 403 }
      );
    }

    // 5. Vérifier le statut de la livraison
    if (delivery.status !== "VALIDATED") {
      return NextResponse.json(
        { error: "Cette livraison doit d'abord être validée" },
        { status: 400 }
      );
    }

    // 6. Vérifier si déjà payé
    if (delivery.paymentStatus === "PAID") {
      return NextResponse.json(
        { error: "Cette livraison a déjà été payée" },
        { status: 400 }
      );
    }

    // 7. Vérifier le montant
    const amount = delivery.amount;
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Montant invalide" },
        { status: 400 }
      );
    }

    // 8. Récupérer l'URL de l'app
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://creix.app";
    const freelancerName = delivery.freelancer.profile?.displayName || "Freelance";

    // 9. Créer la session Stripe Checkout
    const stripe = getStripe();
    
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Mission: ${delivery.mission.title}`,
              description: `Paiement pour la livraison de ${freelancerName}`
            },
            unit_amount: amount // Montant en centimes
          },
          quantity: 1
        }
      ],
      metadata: {
        deliveryId: delivery.id,
        missionId: delivery.missionId,
        creatorId: session.user.id,
        freelancerId: delivery.freelancerId,
        type: "delivery_payment"
      },
      success_url: `${appUrl}/deliveries/${delivery.id}?payment=success`,
      cancel_url: `${appUrl}/deliveries/${delivery.id}?payment=cancelled`
    });

    // 10. Mettre à jour le statut de paiement
    await prisma.missionDelivery.update({
      where: { id: deliveryId },
      data: {
        paymentStatus: "PENDING",
        stripePaymentId: checkoutSession.id
      }
    });

    // 11. Retourner l'URL de paiement
    return NextResponse.json({ url: checkoutSession.url });

  } catch (error) {
    // Log détaillé de l'erreur
    console.error("=== ERREUR PAIEMENT LIVRAISON ===");
    console.error("Type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Message:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("Stack:", error.stack);
    }
    console.error("================================");
    
    // Retourner un message d'erreur plus spécifique si possible
    if (error instanceof Error) {
      if (error.message.includes("STRIPE_SECRET_KEY")) {
        return NextResponse.json(
          { error: "Configuration Stripe manquante" },
          { status: 500 }
        );
      }
      if (error.message.includes("Invalid API Key")) {
        return NextResponse.json(
          { error: "Clé Stripe invalide" },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
