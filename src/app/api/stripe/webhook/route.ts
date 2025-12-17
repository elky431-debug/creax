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

      // Paiement réussi pour abonnement
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Paiement réussi pour la facture ${invoice.id}`);
        break;
      }

      // Paiement échoué
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Paiement échoué pour la facture ${invoice.id}`);
        break;
      }

      // =========================================
      // PAIEMENT DE LIVRAISON (Checkout Session)
      // =========================================
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Vérifier si c'est un paiement de livraison
        if (session.metadata?.type === "delivery_payment") {
          const deliveryId = session.metadata.deliveryId;
          
          if (deliveryId) {
            // Mettre à jour le statut de la livraison
            await prisma.missionDelivery.update({
              where: { id: deliveryId },
              data: {
                paymentStatus: "PAID",
                status: "PAID",
                paidAt: new Date(),
                stripePaymentId: session.payment_intent as string
              }
            });

            // Récupérer les infos pour notification
            const delivery = await prisma.missionDelivery.findUnique({
              where: { id: deliveryId },
              include: {
                freelancer: {
                  select: {
                    id: true,
                    email: true,
                    profile: {
                      select: {
                        displayName: true,
                        iban: true,
                        bankAccountHolder: true
                      }
                    }
                  }
                },
                mission: {
                  select: { title: true }
                }
              }
            });

            console.log(`✅ Paiement livraison ${deliveryId} confirmé`);
            console.log(`   Mission: ${delivery?.mission.title}`);
            console.log(`   Freelance: ${delivery?.freelancer.profile?.displayName}`);
            console.log(`   Montant: ${(session.amount_total || 0) / 100}€`);
            
            // Log IBAN pour virement manuel (à automatiser plus tard avec Stripe Connect)
            if (delivery?.freelancer.profile?.iban) {
              console.log(`   IBAN pour virement: ${delivery.freelancer.profile.iban}`);
              console.log(`   Titulaire: ${delivery.freelancer.profile.bankAccountHolder}`);
            }
          }
        }
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







































