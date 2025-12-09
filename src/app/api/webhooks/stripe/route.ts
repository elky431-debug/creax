/**
 * Webhook Stripe pour gérer les événements de paiement
 * 
 * Gère :
 * - checkout.session.completed : Paiement de livraison réussi
 * - customer.subscription.created/updated/deleted : Abonnements
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20"
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get("stripe-signature")!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Erreur signature webhook:", err.message);
      return NextResponse.json(
        { error: `Webhook signature invalide: ${err.message}` },
        { status: 400 }
      );
    }

    // Traiter les événements
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Vérifier si c'est un paiement de livraison
        if (session.metadata?.type === "delivery_payment") {
          const deliveryId = session.metadata.deliveryId;

          if (deliveryId) {
            // Mettre à jour la livraison
            await prisma.missionDelivery.update({
              where: { id: deliveryId },
              data: {
                paymentStatus: "PAID",
                status: "PAID",
                paidAt: new Date(),
                stripePaymentId: session.payment_intent as string
              }
            });

            console.log(`✅ Paiement livraison ${deliveryId} confirmé`);
          }
        }
        
        // Vérifier si c'est un abonnement
        if (session.mode === "subscription" && session.subscription) {
          const userId = session.metadata?.userId;
          
          if (userId) {
            // Récupérer les détails de l'abonnement
            const subscription = await stripe.subscriptions.retrieve(
              session.subscription as string
            );
            
            // Créer l'abonnement en base
            await prisma.subscription.upsert({
              where: { stripeSubscriptionId: subscription.id },
              create: {
                userId: userId,
                stripeSubscriptionId: subscription.id,
                stripePriceId: subscription.items.data[0].price.id,
                status: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000)
              },
              update: {
                status: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000)
              }
            });
            
            console.log(`✅ Abonnement créé pour utilisateur ${userId}`);
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Récupérer l'utilisateur par stripeCustomerId
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: subscription.customer as string }
        });

        if (user) {
          // Créer ou mettre à jour l'abonnement
          await prisma.subscription.upsert({
            where: { stripeSubscriptionId: subscription.id },
            create: {
              userId: user.id,
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0].price.id,
              status: subscription.status,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000)
            },
            update: {
              status: subscription.status,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000)
            }
          });

          console.log(`✅ Abonnement ${subscription.id} mis à jour pour ${user.email}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: "canceled" }
        });

        console.log(`❌ Abonnement ${subscription.id} annulé`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`❌ Paiement échoué: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`Événement non géré: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erreur webhook Stripe:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}



























