/**
 * API pour récupérer les missions assignées à un freelance
 * 
 * GET /api/missions/assigned
 * 
 * Retourne les missions où le freelance a été sélectionné
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== "DESIGNER") {
      return NextResponse.json(
        { error: "Accès réservé aux graphistes/monteurs" },
        { status: 403 }
      );
    }

    // Récupérer les missions assignées
    const missions = await prisma.mission.findMany({
      where: {
        assignedFreelancerId: session.user.id,
        status: { in: ["IN_PROGRESS", "COMPLETED"] }
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true
              }
            }
          }
        },
        deliveries: {
          where: { freelancerId: session.user.id },
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            amount: true
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    // Formater les missions
    const formattedMissions = missions.map((mission) => ({
      id: mission.id,
      title: mission.title,
      type: mission.type,
      description: mission.description,
      status: mission.status,
      budgetCustom: mission.budgetCustom,
      deadline: mission.deadline,
      creator: {
        id: mission.creator.id,
        displayName: mission.creator.profile?.displayName || mission.creator.email,
        avatarUrl: mission.creator.profile?.avatarUrl
      },
      delivery: mission.deliveries[0] || null,
      hasDelivery: mission.deliveries.length > 0,
      createdAt: mission.createdAt,
      updatedAt: mission.updatedAt
    }));

    return NextResponse.json({ missions: formattedMissions });
  } catch (error) {
    console.error("Erreur GET missions/assigned:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
























