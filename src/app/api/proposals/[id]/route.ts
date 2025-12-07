/**
 * API pour gérer une proposition spécifique
 * 
 * GET /api/proposals/[id] - Récupérer les détails d'une proposition
 * PATCH /api/proposals/[id] - Mettre à jour le statut (accepter/refuser)
 * 
 * Accessible aux créateurs (pour leurs missions) et aux designers (pour leurs propositions)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schéma de validation pour la mise à jour
const updateSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED", "WITHDRAWN"]),
  responseMessage: z.string().optional()
});

/**
 * GET - Récupérer les détails d'une proposition
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const proposalId = params.id;

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        mission: {
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
              take: 5
            }
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
                rate: true,
                portfolioImages: {
                  take: 6,
                  orderBy: { order: "asc" }
                }
              }
            }
          }
        }
      }
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposition introuvable" },
        { status: 404 }
      );
    }

    // Vérifier les droits d'accès
    const isCreator = proposal.mission.creatorId === session.user.id;
    const isDesigner = proposal.designerId === session.user.id;

    if (!isCreator && !isDesigner) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    return NextResponse.json({ proposal, isCreator, isDesigner });
  } catch (error) {
    console.error("Erreur GET proposal:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH - Mettre à jour le statut d'une proposition
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const proposalId = params.id;

    // Récupérer la proposition
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        mission: {
          select: {
            id: true,
            creatorId: true,
            title: true,
            status: true
          }
        }
      }
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposition introuvable" },
        { status: 404 }
      );
    }

    // Valider les données
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { status } = parsed.data;

    // Vérifier les droits selon l'action
    const isCreator = proposal.mission.creatorId === session.user.id;
    const isDesigner = proposal.designerId === session.user.id;

    // Seul le créateur peut accepter ou refuser
    if ((status === "ACCEPTED" || status === "REJECTED") && !isCreator) {
      return NextResponse.json(
        { error: "Seul le créateur peut accepter ou refuser une proposition" },
        { status: 403 }
      );
    }

    // Seul le designer peut retirer sa proposition
    if (status === "WITHDRAWN" && !isDesigner) {
      return NextResponse.json(
        { error: "Seul le graphiste peut retirer sa proposition" },
        { status: 403 }
      );
    }

    // Vérifier que la proposition est en attente
    if (proposal.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cette proposition a déjà été traitée" },
        { status: 400 }
      );
    }

    // Mettre à jour la proposition
    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status,
        updatedAt: new Date()
      },
      include: {
        mission: {
          select: {
            id: true,
            title: true
          }
        },
        designer: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true
              }
            }
          }
        }
      }
    });

    // Si acceptée, mettre à jour le statut de la mission et assigner le freelance
    if (status === "ACCEPTED") {
      await prisma.mission.update({
        where: { id: proposal.mission.id },
        data: { 
          status: "IN_PROGRESS",
          assignedFreelancerId: proposal.designerId // Assigner le freelance
        }
      });

      // Refuser automatiquement les autres propositions en attente
      await prisma.proposal.updateMany({
        where: {
          missionId: proposal.mission.id,
          id: { not: proposalId },
          status: "PENDING"
        },
        data: { status: "REJECTED" }
      });
    }

    return NextResponse.json({ proposal: updatedProposal });
  } catch (error) {
    console.error("Erreur PATCH proposal:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}



