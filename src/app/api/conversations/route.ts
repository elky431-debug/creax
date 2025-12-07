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

    // Trouver tous les utilisateurs avec qui on a échangé des messages
    const conversations = await prisma.user.findMany({
      where: {
        OR: [
          {
            messagesReceived: {
              some: { senderId: userId }
            }
          },
          {
            messagesSent: {
              some: { receiverId: userId }
            }
          }
        ],
        NOT: {
          id: userId
        }
      },
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
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Erreur conversations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


