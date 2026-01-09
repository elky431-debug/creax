import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/deliveries/[id]/sync-now
 * Rattrapage: si le paiement est déjà PAID et que la finale est stockée,
 * on passe la livraison en FINAL_SENT (et la mission en COMPLETED).
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const deliveryId = params.id;
    const delivery = await prisma.missionDelivery.findUnique({
      where: { id: deliveryId },
      select: {
        id: true,
        creatorId: true,
        freelancerId: true,
        paymentStatus: true,
        status: true,
        finalUrl: true,
        missionId: true
      }
    });

    if (!delivery) {
      return NextResponse.json({ error: "Livraison introuvable" }, { status: 404 });
    }

    const isCreator = delivery.creatorId === session.user.id;
    const isFreelancer = delivery.freelancerId === session.user.id;
    if (!isCreator && !isFreelancer) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Rien à faire si pas payé
    if (delivery.paymentStatus !== "PAID") {
      return NextResponse.json({ ok: true, updated: false });
    }

    // Si on a déjà la finale, on peut passer en FINAL_SENT (idempotent)
    if (delivery.finalUrl && delivery.status !== "FINAL_SENT" && delivery.status !== "COMPLETED") {
      await prisma.missionDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "FINAL_SENT",
          finalExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      await prisma.mission.update({
        where: { id: delivery.missionId },
        data: { status: "COMPLETED" }
      });

      return NextResponse.json({ ok: true, updated: true });
    }

    return NextResponse.json({ ok: true, updated: false });
  } catch (error) {
    console.error("Erreur sync-now delivery:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


