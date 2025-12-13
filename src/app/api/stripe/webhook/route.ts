import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// Désactiver le parsing automatique du body pour les webhooks
export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Signature manquante" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Erreur vérification webhook:", err);
    return NextResponse.json(
      { error: "Signature invalide" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      // Abonnement créé ou mis à jour
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;

        if (!userId) {
          // Essayer de trouver l'utilisateur via le customer ID
          const customer = await stripe.customers.retrieve(
            subscription.customer as string
          );
          if ("metadata" in customer && customer.metadata.userId) {
            await handleSubscriptionUpdate(
              customer.metadata.userId,
              subscription
            );
          }
        } else {
          await handleSubscriptionUpdate(userId, subscription);
        }
        break;
      }

      // Abonnement annulé
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: "canceled" }
        });
        break;
      }

      // Paiement réussi
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Paiement réussi pour la facture ${invoice.id}`);
        break;
      }

      // Paiement échoué
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Paiement échoué pour la facture ${invoice.id}`);
        // TODO: Envoyer un email à l'utilisateur
        break;
      }

      default:
        console.log(`Event non géré: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erreur traitement webhook:", error);
    return NextResponse.json(
      { error: "Erreur traitement webhook" },
      { status: 500 }
    );
  }
}

// Fonction helper pour mettre à jour l'abonnement
async function handleSubscriptionUpdate(
  userId: string,
  subscription: Stripe.Subscription
) {
  const priceId = subscription.items.data[0]?.price.id;

  // Vérifier si l'abonnement existe déjà
  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (existingSubscription) {
    // Mettre à jour
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        stripePriceId: priceId || existingSubscription.stripePriceId,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });
  } else {
    // Créer
    await prisma.subscription.create({
      data: {
        userId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId || "",
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });
  }
}


































