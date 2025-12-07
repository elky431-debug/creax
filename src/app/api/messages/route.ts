import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const postSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1).max(2000)
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "Paramètre 'conversationId' manquant" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { creatorId: session.user.id },
          { designerId: session.user.id }
        ]
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation non trouvée" },
        { status: 404 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true
              }
            }
          }
        },
        attachments: true
      },
      orderBy: { createdAt: "asc" }
    });

    // Marquer les messages comme lus
    const isCreator = conversation.creatorId === session.user.id;
    await prisma.conversation.update({
      where: { id: conversationId },
      data: isCreator 
        ? { unreadForCreator: 0 }
        : { unreadForDesigner: 0 }
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

    const { conversationId, content } = parsed.data;

    // Vérifier que l'utilisateur fait partie de la conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { creatorId: session.user.id },
          { designerId: session.user.id }
        ]
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation non trouvée" },
        { status: 404 }
      );
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        type: "TEXT",
        content
      },
      include: {
        sender: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    // Mettre à jour la conversation
    const isCreator = conversation.creatorId === session.user.id;
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: content.substring(0, 100),
        ...(isCreator 
          ? { unreadForDesigner: { increment: 1 } }
          : { unreadForCreator: { increment: 1 } }
        )
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
