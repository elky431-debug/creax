import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// Désactiver le parsing automatique du body pour les webhooks
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe n'est pas configuré." },
      { status: 500 }
    );
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json(
      { error: "Signature manquante." },
      { status: 400 }
    );
  }

  const rawBody = await req.arrayBuffer();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(rawBody),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Erreur webhook Stripe", err);
    return NextResponse.json(
      { error: "Webhook invalide." },
      { status: 400 }
    );
  }

  try {
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const subscription = event.data.object as Stripe.Subscription;

      const userId = subscription.metadata.userId;
      if (!userId) {
        return NextResponse.json({ received: true });
      }

      const priceId =
        typeof subscription.items.data[0]?.price.id === "string"
          ? subscription.items.data[0].price.id
          : "";

      await prisma.subscription.upsert({
        where: {
          stripeSubscriptionId: subscription.id
        },
        update: {
          status: subscription.status,
          currentPeriodEnd: new Date(
            (subscription.current_period_end || 0) * 1000
          ),
          stripePriceId: priceId
        },
        create: {
          userId,
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodEnd: new Date(
            (subscription.current_period_end || 0) * 1000
          ),
          stripePriceId: priceId
        }
      });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      await prisma.subscription.updateMany({
        where: {
          stripeSubscriptionId: subscription.id
        },
        data: {
          status: subscription.status
        }
      });
    }
  } catch (error) {
    console.error("Erreur traitement webhook Stripe", error);
    return NextResponse.json(
      { error: "Erreur interne lors du webhook." },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}



















