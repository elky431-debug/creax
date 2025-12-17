import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST - Bloquer un utilisateur
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { userId, reason } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "ID utilisateur requis" }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: "Vous ne pouvez pas vous bloquer vous-même" }, { status: 400 });
    }

    // Vérifier que l'utilisateur à bloquer existe
    const userToBlock = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userToBlock) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Vérifier si déjà bloqué
    const existingBlock = await prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: session.user.id,
          blockedId: userId
        }
      }
    });

    if (existingBlock) {
      return NextResponse.json({ error: "Utilisateur déjà bloqué" }, { status: 400 });
    }

    // Créer le blocage
    await prisma.blockedUser.create({
      data: {
        blockerId: session.user.id,
        blockedId: userId,
        reason: reason || null
      }
    });

    return NextResponse.json({ success: true, message: "Utilisateur bloqué" });
  } catch (error) {
    console.error("Erreur blocage:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE - Débloquer un utilisateur
 */
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "ID utilisateur requis" }, { status: 400 });
    }

    // Supprimer le blocage
    await prisma.blockedUser.deleteMany({
      where: {
        blockerId: session.user.id,
        blockedId: userId
      }
    });

    return NextResponse.json({ success: true, message: "Utilisateur débloqué" });
  } catch (error) {
    console.error("Erreur déblocage:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * GET - Liste des utilisateurs bloqués
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const blockedUsers = await prisma.blockedUser.findMany({
      where: { blockerId: session.user.id },
      include: {
        blocked: {
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
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ 
      blockedUsers: blockedUsers.map(b => ({
        id: b.id,
        userId: b.blocked.id,
        email: b.blocked.email,
        displayName: b.blocked.profile?.displayName || b.blocked.email,
        avatarUrl: b.blocked.profile?.avatarUrl,
        role: b.blocked.role,
        reason: b.reason,
        blockedAt: b.createdAt
      }))
    });
  } catch (error) {
    console.error("Erreur liste blocages:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}




