import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// Ces IDs doivent correspondre aux Price IDs Stripe configurés dans le dashboard.
const CREATOR_PRICE_ID = process.env.STRIPE_PRICE_CREATOR_MONTHLY!;
const DESIGNER_PRICE_ID = process.env.STRIPE_PRICE_DESIGNER_MONTHLY!;

export async function POST(req: Request) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe n'est pas configuré." },
        { status: 500 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const plan = body.plan;

    const priceId =
      plan === "creator"
        ? CREATOR_PRICE_ID
        : plan === "designer"
        ? DESIGNER_PRICE_ID
        : null;

    if (!priceId) {
      return NextResponse.json(
        { error: "Plan invalide." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 404 }
      );
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email
      });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId }
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.NEXTAUTH_URL}/subscribe/success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/subscribe?billing=cancelled`,
      subscription_data: {
        metadata: {
          userId: user.id,
          plan
        }
      },
      metadata: {
        userId: user.id,
        plan
      }
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Erreur checkout:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session de paiement" },
      { status: 500 }
    );
  }
}



















