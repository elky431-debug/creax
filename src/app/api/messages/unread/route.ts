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

    const count = await prisma.message.count({
      where: {
        receiverId: session.user.id,
        read: false
      }
    });

    return NextResponse.json({ unreadCount: count });
  } catch (error) {
    console.error("Erreur unread messages:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}




























