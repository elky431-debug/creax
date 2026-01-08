import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

// Cette route vérifie l'abonnement en temps réel (appelée par le middleware)
export async function GET(req: NextRequest) {
  try {
    // Vérifier que c'est un appel du middleware
    const isMiddlewareCheck = req.headers.get("x-middleware-check") === "true";

    // Perf: getToken est plus léger que getServerSession (pas de construction de session complète).
    const token = await getToken({ req });
    const userId = (token as { sub?: string; id?: string } | null)?.id ?? token?.sub;

    if (!userId) {
      return NextResponse.json(
        { hasActiveSubscription: false },
        { status: 401 }
      );
    }

    // Chercher l'abonnement actif de l'utilisateur
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["active", "trialing"] },
        currentPeriodEnd: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" },
      select: {
        status: true,
        currentPeriodEnd: true
      }
    });

    const hasActiveSubscription = !!subscription;

    const res = NextResponse.json({ 
      hasActiveSubscription,
      // Ajouter des infos supplémentaires seulement si c'est pas le middleware
      ...(isMiddlewareCheck ? {} : {
        subscription: subscription ? {
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd
        } : null
      })
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error) {
    console.error("Erreur vérification abonnement:", error);
    return NextResponse.json({ hasActiveSubscription: false });
  }
}

