export const dynamic = 'force-dynamic';

/**
 * API pour récupérer les propositions envoyées par un designer
 * 
 * GET /api/proposals/my
 * 
 * Retourne toutes les propositions du designer connecté avec :
 * - Infos de la mission
 * - Infos du créateur
 * - Statut de la livraison si existante
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

    // Récupérer les propositions
    const proposals = await prisma.proposal.findMany({
      where: { designerId: session.user.id },
      include: {
        mission: {
          select: {
            id: true,
            title: true,
            type: true,
            description: true,
            status: true,
            budgetCustom: true,
            budgetRange: true,
            deadline: true,
            assignedFreelancerId: true,
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
                paymentStatus: true
              },
              take: 1
            }
          }
        }
      },
      orderBy: [
        { status: "asc" }, // ACCEPTED en premier, puis PENDING, puis REJECTED
        { updatedAt: "desc" }
      ]
    });

    // Formater les propositions
    const formattedProposals = proposals.map((proposal) => {
      const delivery = proposal.mission.deliveries[0] || null;
      
      return {
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
          description: proposal.mission.description,
          status: proposal.mission.status,
          budgetCustom: proposal.mission.budgetCustom,
          budgetRange: proposal.mission.budgetRange,
          deadline: proposal.mission.deadline,
          assignedFreelancerId: proposal.mission.assignedFreelancerId,
          creator: {
            id: proposal.mission.creator.id,
            displayName: proposal.mission.creator.profile?.displayName || proposal.mission.creator.email,
            avatarUrl: proposal.mission.creator.profile?.avatarUrl
          }
        },
        hasDelivery: delivery !== null,
        deliveryId: delivery?.id || null,
        deliveryStatus: delivery?.status || null,
        deliveryPaymentStatus: delivery?.paymentStatus || null
      };
    });

    // Trier : Acceptées sans livraison en premier, puis acceptées avec livraison, puis en attente, puis refusées
    formattedProposals.sort((a, b) => {
      // Acceptées sans livraison = priorité max
      if (a.status === "ACCEPTED" && !a.hasDelivery) return -1;
      if (b.status === "ACCEPTED" && !b.hasDelivery) return 1;
      
      // Acceptées avec livraison en cours
      if (a.status === "ACCEPTED" && a.hasDelivery) return -1;
      if (b.status === "ACCEPTED" && b.hasDelivery) return 1;
      
      // En attente
      if (a.status === "PENDING" && b.status !== "PENDING") return -1;
      if (b.status === "PENDING" && a.status !== "PENDING") return 1;
      
      // Par date de mise à jour
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return NextResponse.json({ proposals: formattedProposals });
  } catch (error) {
    console.error("Erreur GET proposals/my:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}















