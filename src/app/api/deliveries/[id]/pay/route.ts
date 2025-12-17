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

/**
 * POST - Créer une session de paiement pour une livraison
 */
export async function POST(
  req: Request,
  context: { params: { id: string } }
) {
  // Récupérer l'ID depuis les params
  const deliveryId = context.params.id;
  
  console.log("=== DEBUT PAIEMENT ===");
  console.log("Delivery ID:", deliveryId);
  
  try {
    // 1. Vérifier la clé Stripe
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    console.log("Stripe key exists:", !!stripeKey);
    console.log("Stripe key prefix:", stripeKey?.substring(0, 10));
    
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY manquante!");
      return NextResponse.json({ error: "Configuration Stripe manquante" }, { status: 500 });
    }

    // 2. Vérifier l'authentification
    const session = await getServerSession(authOptions);
    console.log("User ID:", session?.user?.id);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // 3. Vérifier l'ID
    if (!deliveryId) {
      return NextResponse.json({ error: "ID livraison manquant" }, { status: 400 });
    }

    // 4. Récupérer la livraison
    console.log("Recherche livraison...");
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

    console.log("Livraison trouvée:", !!delivery);

    if (!delivery) {
      return NextResponse.json({ error: "Livraison introuvable" }, { status: 404 });
    }

    console.log("Status:", delivery.status);
    console.log("Payment status:", delivery.paymentStatus);
    console.log("Amount:", delivery.amount);
    console.log("Creator ID:", delivery.creatorId);

    // 5. Vérifier que c'est le créateur qui paie
    if (delivery.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Seul le créateur peut effectuer le paiement" },
        { status: 403 }
      );
    }

    // 6. Vérifier le statut de la livraison
    if (delivery.status !== "VALIDATED") {
      return NextResponse.json(
        { error: `Statut invalide: ${delivery.status}. Doit être VALIDATED.` },
        { status: 400 }
      );
    }

    // 7. Vérifier si déjà payé
    if (delivery.paymentStatus === "PAID") {
      return NextResponse.json(
        { error: "Cette livraison a déjà été payée" },
        { status: 400 }
      );
    }

    // 8. Vérifier le montant
    const amount = delivery.amount;
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: `Montant invalide: ${amount}` },
        { status: 400 }
      );
    }

    // 9. Créer Stripe
    console.log("Création session Stripe...");
    const stripe = new Stripe(stripeKey);
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://creix.app";
    const freelancerName = delivery.freelancer.profile?.displayName || "Freelance";

    // 10. Créer la session Stripe Checkout
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
            unit_amount: amount
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

    console.log("Session Stripe créée:", checkoutSession.id);

    // 11. Mettre à jour le statut
    await prisma.missionDelivery.update({
      where: { id: deliveryId },
      data: {
        paymentStatus: "PENDING",
        stripePaymentId: checkoutSession.id
      }
    });

    console.log("=== PAIEMENT OK ===");
    return NextResponse.json({ url: checkoutSession.url });

  } catch (error) {
    console.error("=== ERREUR PAIEMENT ===");
    console.error("Type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Message:", error instanceof Error ? error.message : String(error));
    
    if (error instanceof Stripe.errors.StripeError) {
      console.error("Stripe Error Type:", error.type);
      console.error("Stripe Error Code:", error.code);
      return NextResponse.json(
        { error: `Erreur Stripe: ${error.message}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
