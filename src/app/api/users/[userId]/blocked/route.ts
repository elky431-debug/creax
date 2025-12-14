import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET - Vérifier si un utilisateur est bloqué
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { userId } = await params;

    const block = await prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: session.user.id,
          blockedId: userId
        }
      }
    });

    return NextResponse.json({ 
      isBlocked: !!block,
      reason: block?.reason || null,
      blockedAt: block?.createdAt || null
    });
  } catch (error) {
    console.error("Erreur vérification blocage:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

