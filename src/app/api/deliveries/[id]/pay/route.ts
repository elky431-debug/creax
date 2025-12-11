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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20"
});

/**
 * POST - Créer une session de paiement pour une livraison
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const deliveryId = params.id;

    // Récupérer la livraison
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

    // Vérifier que c'est le créateur qui paie
    if (delivery.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Seul le créateur peut effectuer le paiement" },
        { status: 403 }
      );
    }

    // Vérifier le statut
    if (delivery.status !== "VALIDATED") {
      return NextResponse.json(
        { error: "Cette livraison doit d'abord être validée" },
        { status: 400 }
      );
    }

    if (delivery.paymentStatus === "PAID") {
      return NextResponse.json(
        { error: "Cette livraison a déjà été payée" },
        { status: 400 }
      );
    }

    const freelancerName = delivery.freelancer.profile?.displayName || "Freelance";

    // Créer la session Stripe Checkout
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
            unit_amount: delivery.amount // Montant en centimes
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/deliveries/${delivery.id}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/deliveries/${delivery.id}?payment=cancelled`
    });

    // Mettre à jour le statut de paiement
    await prisma.missionDelivery.update({
      where: { id: deliveryId },
      data: {
        paymentStatus: "PENDING",
        stripePaymentId: checkoutSession.id
      }
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Erreur création paiement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}




























