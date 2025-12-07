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


