/**
 * API pour récupérer les propositions reçues par un créateur
 * 
 * GET /api/proposals/received
 * 
 * Paramètres de requête :
 * - status: filtrer par statut (ALL, PENDING, ACCEPTED, REJECTED)
 * - missionId: filtrer par mission spécifique
 * 
 * Retourne toutes les propositions pour les missions du créateur connecté
 * Accessible uniquement aux utilisateurs avec rôle CREATOR
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Vérifier l'authentification
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

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "";
    const missionIdFilter = searchParams.get("missionId") || "";

    // Construire les conditions de filtrage
    const whereConditions: any = {
      mission: {
        creatorId: session.user.id
      }
    };

    if (statusFilter && statusFilter !== "ALL") {
      whereConditions.status = statusFilter;
    }

    if (missionIdFilter) {
      whereConditions.missionId = missionIdFilter;
    }

    // Récupérer les propositions
    const proposals = await prisma.proposal.findMany({
      where: whereConditions,
      include: {
        mission: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            budgetRange: true,
            budgetCustom: true
          }
        },
        designer: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                bio: true,
                skills: true,
                portfolioUrl: true,
                rate: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Formater les propositions
    const formattedProposals = proposals.map((proposal) => ({
      id: proposal.id,
      message: proposal.message,
      price: proposal.price,
      status: proposal.status,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
      mission: {
        id: proposal.mission.id,
        title: proposal.mission.title,
        type: proposal.mission.type,
        status: proposal.mission.status,
        budgetRange: proposal.mission.budgetRange,
        budgetCustom: proposal.mission.budgetCustom
      },
      designer: {
        id: proposal.designer.id,
        displayName: proposal.designer.profile?.displayName || proposal.designer.email,
        avatarUrl: proposal.designer.profile?.avatarUrl,
        bio: proposal.designer.profile?.bio,
        skills: proposal.designer.profile?.skills,
        portfolioUrl: proposal.designer.profile?.portfolioUrl,
        rate: proposal.designer.profile?.rate
      }
    }));

    // Compter les propositions par statut
    const counts = {
      total: proposals.length,
      pending: proposals.filter((p) => p.status === "PENDING").length,
      accepted: proposals.filter((p) => p.status === "ACCEPTED").length,
      rejected: proposals.filter((p) => p.status === "REJECTED").length
    };

    return NextResponse.json({ proposals: formattedProposals, counts });
  } catch (error) {
    console.error("Erreur GET proposals/received:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


























