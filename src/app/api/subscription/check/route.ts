import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Cette route vérifie l'abonnement en temps réel (appelée par le middleware)
export async function GET(req: Request) {
  try {
    // Vérifier que c'est un appel du middleware
    const isMiddlewareCheck = req.headers.get("x-middleware-check") === "true";

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { hasActiveSubscription: false },
        { status: 401 }
      );
    }

    // Chercher l'abonnement actif de l'utilisateur
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["active", "trialing"] },
        currentPeriodEnd: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" }
    });

    const hasActiveSubscription = !!subscription;

    return NextResponse.json({ 
      hasActiveSubscription,
      // Ajouter des infos supplémentaires seulement si c'est pas le middleware
      ...(isMiddlewareCheck ? {} : {
        subscription: subscription ? {
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd
        } : null
      })
    });
  } catch (error) {
    console.error("Erreur vérification abonnement:", error);
    return NextResponse.json({ hasActiveSubscription: false });
  }
}

