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
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { missionId, creatorId } = body;

    if (!missionId) {
      return NextResponse.json({ error: "ID de mission requis" }, { status: 400 });
    }

    // Récupérer la mission pour avoir les infos
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      select: { id: true, title: true, creatorId: true }
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
    }

    // Déterminer qui est le créateur et qui est le designer
    const isCreator = session.user.id === mission.creatorId;
    const finalCreatorId = mission.creatorId;
    const finalDesignerId = isCreator ? creatorId : session.user.id;

    if (!finalDesignerId) {
      return NextResponse.json({ error: "ID du designer requis" }, { status: 400 });
    }

    // Vérifier si une conversation existe déjà
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        missionId,
        creatorId: finalCreatorId,
        designerId: finalDesignerId
      }
    });

    if (existingConversation) {
      return NextResponse.json({ conversation: existingConversation });
    }

    // Créer une nouvelle conversation
    const conversation = await prisma.conversation.create({
      data: {
        missionId,
        creatorId: finalCreatorId,
        designerId: finalDesignerId,
        lastMessagePreview: "Nouvelle conversation",
        unreadForCreator: isCreator ? 0 : 1,
        unreadForDesigner: isCreator ? 1 : 0
      }
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST conversation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


