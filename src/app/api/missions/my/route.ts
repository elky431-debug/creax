export const dynamic = 'force-dynamic';

/**
 * API pour récupérer les missions créées par le créateur connecté
 * 
 * GET /api/missions/my
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est un créateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== "CREATOR") {
      return NextResponse.json(
        { error: "Accès réservé aux créateurs" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    // Construire les conditions
    const whereConditions: Record<string, unknown> = {
      creatorId: session.user.id
    };

    if (status && status !== "ALL") {
      whereConditions.status = status;
    }

    const missions = await prisma.mission.findMany({
      where: whereConditions,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { proposals: true }
        }
      }
    });

    // Récupérer les infos des freelances assignés
    const freelancerIds = missions
      .map(m => m.assignedFreelancerId)
      .filter((id): id is string => id !== null);

    const freelancers = freelancerIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: freelancerIds } },
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true
              }
            }
          }
        })
      : [];

    const freelancerMap = new Map(freelancers.map(f => [f.id, f]));

    // Formatter les missions
    const formattedMissions = missions.map((mission) => {
      const freelancer = mission.assignedFreelancerId 
        ? freelancerMap.get(mission.assignedFreelancerId) 
        : null;

      return {
        id: mission.id,
        title: mission.title,
        description: mission.description,
        type: mission.type,
        status: mission.status,
        createdAt: mission.createdAt.toISOString(),
        proposalCount: mission._count.proposals,
        assignedFreelancer: freelancer ? {
          id: freelancer.id,
          displayName: freelancer.profile?.displayName || "Freelance",
          avatarUrl: freelancer.profile?.avatarUrl || null
        } : null
      };
    });

    return NextResponse.json({ missions: formattedMissions });
  } catch (error) {
    console.error("Erreur GET /api/missions/my:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}



