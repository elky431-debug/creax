export const dynamic = 'force-dynamic';

/**
 * API pour compter les propositions en attente (notifications)
 * 
 * GET /api/proposals/count
 * 
 * Pour les créateurs : compte les propositions PENDING reçues (non vues)
 * Pour les designers : compte les propositions avec changement de statut (non vues)
 * 
 * Utilisé pour afficher le badge de notification dans le header
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

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    let pendingCount = 0;

    if (user.role === "CREATOR") {
      // Pour les créateurs : compter les propositions en attente sur leurs missions
      pendingCount = await prisma.proposal.count({
        where: {
          mission: {
            creatorId: session.user.id
          },
          status: "PENDING"
        }
      });
    } else {
      // Pour les designers : compter les propositions acceptées/refusées
      pendingCount = await prisma.proposal.count({
        where: {
          designerId: session.user.id,
          status: { in: ["ACCEPTED", "REJECTED"] }
        }
      });
    }

    return NextResponse.json({ count: pendingCount });
  } catch (error) {
    console.error("Erreur GET proposals/count:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}




