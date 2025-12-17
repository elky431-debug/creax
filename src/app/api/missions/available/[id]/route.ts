/**
 * API pour récupérer les détails d'une mission spécifique
 * 
 * GET /api/missions/available/[id]
 * 
 * Retourne les détails complets de la mission incluant :
 * - Toutes les informations de la mission
 * - Les infos du créateur
 * - Les pièces jointes et images de référence
 * - Le statut de proposition du designer connecté
 * 
 * Accessible uniquement aux utilisateurs avec rôle DESIGNER
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Vérifier l'authentification
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est un designer
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

    const missionId = params.id;

    if (!missionId) {
      return NextResponse.json(
        { error: "ID de mission manquant" },
        { status: 400 }
      );
    }

    // Récupérer la mission avec toutes les infos
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                bio: true
              }
            }
          }
        },
        attachments: {
          orderBy: { createdAt: "asc" }
        },
        proposals: {
          where: { designerId: session.user.id },
          select: { id: true, status: true }
        },
        _count: {
          select: { proposals: true }
        }
      }
    });

    if (!mission) {
      return NextResponse.json(
        { error: "Mission introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que la mission est ouverte (ou que le designer a déjà proposé)
    if (mission.status !== "OPEN" && mission.proposals.length === 0) {
      return NextResponse.json(
        { error: "Cette mission n'est plus disponible" },
        { status: 403 }
      );
    }

    // Formater la réponse
    const formattedMission = {
      id: mission.id,
      title: mission.title,
      description: mission.description,
      type: mission.type,
      deadline: mission.deadline,
      budgetRange: mission.budgetRange,
      budgetCustom: mission.budgetCustom,
      status: mission.status,
      createdAt: mission.createdAt,
      creator: {
        id: mission.creator.id,
        displayName: mission.creator.profile?.displayName || mission.creator.email,
        avatarUrl: mission.creator.profile?.avatarUrl,
        bio: mission.creator.profile?.bio
      },
      attachments: mission.attachments.map((att) => ({
        id: att.id,
        url: att.url,
        filename: att.filename,
        type: att.type
      })),
      hasProposed: mission.proposals.length > 0,
      proposalStatus: mission.proposals[0]?.status || null,
      proposalCount: mission._count.proposals
    };

    return NextResponse.json({ mission: formattedMission });
  } catch (error) {
    console.error("Erreur GET mission details:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}







































