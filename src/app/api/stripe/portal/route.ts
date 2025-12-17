import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// Créer une session du portail client Stripe pour gérer l'abonnement
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: "Aucun abonnement trouvé" },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Créer la session du portail
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/profile`
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Erreur portail Stripe:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'accès au portail" },
      { status: 500 }
    );
  }
}







































