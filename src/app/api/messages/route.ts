import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const postSchema = z.object({
  toUserId: z.string().min(1),
  body: z.string().min(1).max(2000)
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get("with");

    if (!otherUserId) {
      return NextResponse.json(
        { error: "Paramètre 'with' manquant" },
        { status: 400 }
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: session.user.id }
        ]
      },
      orderBy: { createdAt: "asc" }
    });

    // Marquer les messages reçus comme lus
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: session.user.id,
        read: false
      },
      data: { read: true }
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Erreur messages GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides" },
        { status: 400 }
      );
    }

    const { toUserId, body: text } = parsed.data;

    // Vérifier que le destinataire existe
    const targetUser = await prisma.user.findUnique({
      where: { id: toUserId }
    });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: "Destinataire introuvable" },
        { status: 404 }
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: toUserId,
        body: text
      }
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Erreur messages POST:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
