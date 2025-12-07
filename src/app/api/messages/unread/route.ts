export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Compter les messages non lus
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = session.user.id;

    // Compter les messages non lus dans toutes les conversations
    // où l'utilisateur est créateur ou designer
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { designerId: userId }
        ]
      },
      select: {
        creatorId: true,
        designerId: true,
        unreadForCreator: true,
        unreadForDesigner: true
      }
    });

    // Calculer le total des messages non lus
    const unreadCount = conversations.reduce((total, conv) => {
      if (conv.creatorId === userId) {
        return total + conv.unreadForCreator;
      } else {
        return total + conv.unreadForDesigner;
      }
    }, 0);

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error("Erreur unread messages:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}




























