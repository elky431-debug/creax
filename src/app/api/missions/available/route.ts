/**
 * API pour récupérer les missions disponibles pour les graphistes/monteurs
 * 
 * GET /api/missions/available
 * 
 * Paramètres de requête :
 * - q: recherche textuelle (titre, description)
 * - type: type de mission (MINIATURE_YOUTUBE, MONTAGE_VIDEO, etc.)
 * - budget: fourchette de budget (LESS_THAN_50, BETWEEN_50_150, BETWEEN_150_300, MORE_THAN_300)
 * - sort: tri par date (recent, oldest)
 * 
 * Retourne uniquement les missions avec status = OPEN
 * Accessible uniquement aux utilisateurs avec rôle DESIGNER
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
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

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const typeFilter = searchParams.get("type") || "";
    const budgetFilter = searchParams.get("budget") || "";
    const sortOrder = searchParams.get("sort") || "recent";

    // Construire les conditions de filtrage
    const whereConditions: Prisma.MissionWhereInput = {
      status: "OPEN", // Uniquement les missions ouvertes
    };

    // Filtre par recherche textuelle
    if (query) {
      whereConditions.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } }
      ];
    }

    // Filtre par type de mission
    if (typeFilter && typeFilter !== "ALL") {
      whereConditions.type = typeFilter as any;
    }

    // Filtre par budget
    // On utilise budgetRange et budgetCustom pour filtrer
    if (budgetFilter && budgetFilter !== "ALL") {
      switch (budgetFilter) {
        case "LESS_THAN_50":
          // Budget < 50€ : LESS_THAN_20 ou BETWEEN_20_50 ou budgetCustom < 50
          whereConditions.OR = [
            ...(whereConditions.OR || []),
            { budgetRange: "LESS_THAN_20" },
            { budgetRange: "BETWEEN_20_50" },
            { budgetRange: "CUSTOM", budgetCustom: { lt: 50 } }
          ];
          break;
        case "BETWEEN_50_150":
          // Budget 50-150€
          whereConditions.OR = [
            ...(whereConditions.OR || []),
            { budgetRange: "BETWEEN_50_150" },
            { budgetRange: "CUSTOM", budgetCustom: { gte: 50, lte: 150 } }
          ];
          break;
        case "BETWEEN_150_300":
          // Budget 150-300€
          whereConditions.OR = [
            ...(whereConditions.OR || []),
            { budgetRange: "MORE_THAN_150" },
            { budgetRange: "CUSTOM", budgetCustom: { gte: 150, lte: 300 } }
          ];
          break;
        case "MORE_THAN_300":
          // Budget > 300€
          whereConditions.OR = [
            ...(whereConditions.OR || []),
            { budgetRange: "CUSTOM", budgetCustom: { gt: 300 } }
          ];
          break;
      }
    }

    // Récupérer les missions
    const missions = await prisma.mission.findMany({
      where: whereConditions,
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
        attachments: {
          where: { type: "REFERENCE" },
          take: 3 // Limiter à 3 images de référence pour l'aperçu
        },
        proposals: {
          where: { designerId: session.user.id },
          select: { id: true, status: true }
        },
        _count: {
          select: { proposals: true }
        }
      },
      orderBy: {
        createdAt: sortOrder === "oldest" ? "asc" : "desc"
      }
    });

    // Transformer les données pour le frontend
    const formattedMissions = missions.map((mission) => ({
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
        avatarUrl: mission.creator.profile?.avatarUrl
      },
      referenceImages: mission.attachments.map((att) => att.url),
      hasProposed: mission.proposals.length > 0,
      proposalStatus: mission.proposals[0]?.status || null,
      proposalCount: mission._count.proposals
    }));

    return NextResponse.json({
      missions: formattedMissions,
      total: formattedMissions.length
    });
  } catch (error) {
    console.error("Erreur GET missions/available:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}




























