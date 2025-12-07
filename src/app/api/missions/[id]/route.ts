/**
 * API pour gérer une mission spécifique
 * 
 * GET /api/missions/[id] - Détails d'une mission
 * PATCH /api/missions/[id] - Annuler une mission
 * DELETE /api/missions/[id] - Supprimer une mission de l'historique
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateMissionSchema = z.object({
  action: z.enum(["CANCEL"])
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const missionId = params.id;

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
                avatarUrl: true
              }
            }
          }
        },
        attachments: true,
        proposals: {
          where: { designerId: session.user.id },
          select: { id: true, status: true, price: true }
        },
        deliveries: {
          where: { freelancerId: session.user.id },
          select: { id: true, status: true }
        }
      }
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
    }

    // Vérifier les droits d'accès
    const isCreator = mission.creatorId === session.user.id;
    const isAssignedFreelancer = mission.assignedFreelancerId === session.user.id;
    const hasProposal = mission.proposals.length > 0;

    // Autoriser l'accès si :
    // - C'est le créateur
    // - C'est le freelance assigné
    // - Le freelance a fait une proposition
    // - La mission est ouverte (visible par tous les designers)
    if (!isCreator && !isAssignedFreelancer && !hasProposal && mission.status !== "OPEN") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    return NextResponse.json({ 
      mission,
      isCreator,
      isAssignedFreelancer,
      hasProposal,
      hasDelivery: mission.deliveries.length > 0
    });
  } catch (error) {
    console.error("Erreur GET mission:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH - Annuler une mission
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

    const missionId = params.id;

    // Vérifier que la mission existe et appartient au créateur
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      select: {
        id: true,
        creatorId: true,
        status: true,
        title: true
      }
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
    }

    if (mission.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez annuler que vos propres missions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateMissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Action invalide" },
        { status: 400 }
      );
    }

    const { action } = parsed.data;

    if (action === "CANCEL") {
      // Vérifier que la mission peut être annulée
      if (mission.status !== "OPEN" && mission.status !== "IN_PROGRESS") {
        return NextResponse.json(
          { error: "Cette mission ne peut plus être annulée" },
          { status: 400 }
        );
      }

      // Annuler la mission
      const updatedMission = await prisma.mission.update({
        where: { id: missionId },
        data: {
          status: "CANCELLED",
          updatedAt: new Date()
        }
      });

      // Rejeter toutes les propositions en attente
      await prisma.proposal.updateMany({
        where: {
          missionId: missionId,
          status: "PENDING"
        },
        data: {
          status: "REJECTED"
        }
      });

      return NextResponse.json({
        mission: updatedMission,
        message: "Mission annulée avec succès"
      });
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch (error) {
    console.error("Erreur PATCH mission:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE - Supprimer une mission de l'historique
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const missionId = params.id;

    // Vérifier que la mission existe et appartient au créateur
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      select: {
        id: true,
        creatorId: true,
        status: true
      }
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
    }

    if (mission.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez supprimer que vos propres missions" },
        { status: 403 }
      );
    }

    // Seules les missions terminées ou annulées peuvent être supprimées
    if (mission.status !== "COMPLETED" && mission.status !== "CANCELLED") {
      return NextResponse.json(
        { error: "Seules les missions terminées ou annulées peuvent être supprimées" },
        { status: 400 }
      );
    }

    // Supprimer les propositions associées
    await prisma.proposal.deleteMany({
      where: { missionId: missionId }
    });

    // Supprimer les pièces jointes
    await prisma.missionAttachment.deleteMany({
      where: { missionId: missionId }
    });

    // Supprimer les livraisons
    await prisma.missionDelivery.deleteMany({
      where: { missionId: missionId }
    });

    // Supprimer la mission
    await prisma.mission.delete({
      where: { id: missionId }
    });

    return NextResponse.json({
      message: "Mission supprimée avec succès"
    });
  } catch (error) {
    console.error("Erreur DELETE mission:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
