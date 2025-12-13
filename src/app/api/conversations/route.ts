export const dynamic = 'force-dynamic';

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

    const userId = session.user.id;

    // Trouver toutes les conversations où l'utilisateur est créateur ou designer
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { designerId: userId }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true
              }
            }
          }
        },
        designer: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true
              }
            }
          }
        },
        mission: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        lastMessageAt: "desc"
      }
    });

    // Formater pour retourner l'autre utilisateur de la conversation
    const formattedConversations = conversations.map((conv) => {
      const otherUser = conv.creatorId === userId ? conv.designer : conv.creator;
      return {
        id: conv.id,
        missionId: conv.mission.id,
        missionTitle: conv.mission.title,
        lastMessageAt: conv.lastMessageAt,
        lastMessagePreview: conv.lastMessagePreview,
        unreadCount: conv.creatorId === userId ? conv.unreadForCreator : conv.unreadForDesigner,
        otherUser
      };
    });

    return NextResponse.json({ conversations: formattedConversations });
  } catch (error) {
    console.error("Erreur conversations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST - Créer ou récupérer une conversation existante
 * Fonctionne pour n'importe quel utilisateur qui veut contacter un autre
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { missionId, otherUserId } = body;

    if (!missionId) {
      return NextResponse.json({ error: "ID de mission requis" }, { status: 400 });
    }

    if (!otherUserId) {
      return NextResponse.json({ error: "ID de l'autre utilisateur requis" }, { status: 400 });
    }

    // Récupérer la mission pour avoir les infos
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      select: { id: true, title: true, creatorId: true }
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
    }

    // Récupérer les rôles des deux utilisateurs
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true }
    });

    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, role: true }
    });

    if (!currentUser || !otherUser) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Déterminer qui est le créateur et qui est le designer
    // Le créateur de la mission est toujours le "creatorId" de la conversation
    // L'autre personne (designer) est le "designerId"
    let finalCreatorId: string;
    let finalDesignerId: string;

    if (currentUser.role === "CREATOR") {
      finalCreatorId = session.user.id;
      finalDesignerId = otherUserId;
    } else if (otherUser.role === "CREATOR") {
      finalCreatorId = otherUserId;
      finalDesignerId = session.user.id;
    } else {
      // Si les deux sont designers, utiliser le créateur de la mission
      finalCreatorId = mission.creatorId;
      finalDesignerId = session.user.id === mission.creatorId ? otherUserId : session.user.id;
    }

    // Vérifier si une conversation existe déjà (dans les deux sens)
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        missionId,
        OR: [
          { creatorId: finalCreatorId, designerId: finalDesignerId },
          { creatorId: finalDesignerId, designerId: finalCreatorId }
        ]
      }
    });

    if (existingConversation) {
      // Retourner la conversation avec toutes les données nécessaires
      const fullConversation = await prisma.conversation.findUnique({
        where: { id: existingConversation.id },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              role: true,
              profile: { select: { displayName: true, avatarUrl: true } }
            }
          },
          designer: {
            select: {
              id: true,
              email: true,
              role: true,
              profile: { select: { displayName: true, avatarUrl: true } }
            }
          },
          mission: { select: { id: true, title: true } }
        }
      });
      return NextResponse.json({ conversation: fullConversation });
    }

    // Déterminer qui a initié pour les compteurs de non-lus
    const currentIsCreator = session.user.id === finalCreatorId;

    // Créer une nouvelle conversation
    const conversation = await prisma.conversation.create({
      data: {
        missionId,
        creatorId: finalCreatorId,
        designerId: finalDesignerId,
        lastMessagePreview: "Nouvelle conversation",
        unreadForCreator: currentIsCreator ? 0 : 1,
        unreadForDesigner: currentIsCreator ? 1 : 0
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: { select: { displayName: true, avatarUrl: true } }
          }
        },
        designer: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: { select: { displayName: true, avatarUrl: true } }
          }
        },
        mission: { select: { id: true, title: true } }
      }
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST conversation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


