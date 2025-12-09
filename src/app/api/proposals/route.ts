/**
 * API pour gérer les propositions des graphistes/monteurs
 * 
 * POST /api/proposals - Créer une nouvelle proposition
 * GET /api/proposals - Récupérer ses propositions (pour le designer)
 * 
 * Accessible uniquement aux utilisateurs avec rôle DESIGNER
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schéma de validation pour créer une proposition
const proposalSchema = z.object({
  missionId: z.string().min(1, "ID de mission requis"),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères").max(2000, "Le message ne peut pas dépasser 2000 caractères"),
  price: z.number().positive("Le prix doit être positif").optional().nullable()
});

/**
 * POST - Créer une nouvelle proposition
 */
export async function POST(req: Request) {
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
        { error: "Seuls les graphistes/monteurs peuvent soumettre des propositions" },
        { status: 403 }
      );
    }

    // Valider les données
    const body = await req.json();
    const parsed = proposalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { missionId, message, price } = parsed.data;

    // Vérifier que la mission existe et est ouverte
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      select: { id: true, status: true, creatorId: true, title: true }
    });

    if (!mission) {
      return NextResponse.json(
        { error: "Mission introuvable" },
        { status: 404 }
      );
    }

    if (mission.status !== "OPEN") {
      return NextResponse.json(
        { error: "Cette mission n'accepte plus de propositions" },
        { status: 400 }
      );
    }

    // Vérifier qu'une proposition n'existe pas déjà
    const existingProposal = await prisma.proposal.findUnique({
      where: {
        missionId_designerId: {
          missionId,
          designerId: session.user.id
        }
      }
    });

    if (existingProposal) {
      return NextResponse.json(
        { error: "Vous avez déjà soumis une proposition pour cette mission" },
        { status: 400 }
      );
    }

    // Créer la proposition
    const proposal = await prisma.proposal.create({
      data: {
        missionId,
        designerId: session.user.id,
        message,
        price: price || null,
        status: "PENDING"
      },
      include: {
        mission: {
          select: {
            id: true,
            title: true,
            creator: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: { displayName: true }
                }
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST proposal:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * GET - Récupérer les propositions du designer connecté
 */
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
    const statusFilter = searchParams.get("status") || "";

    // Construire les conditions de filtrage
    const whereConditions: any = {
      designerId: session.user.id
    };

    if (statusFilter && statusFilter !== "ALL") {
      whereConditions.status = statusFilter;
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
            deadline: true,
            budgetRange: true,
            budgetCustom: true,
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
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ proposals });
  } catch (error) {
    console.error("Erreur GET proposals:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}






























