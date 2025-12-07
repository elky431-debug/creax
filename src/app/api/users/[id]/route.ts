import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: "ID utilisateur manquant" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            displayName: true,
            bio: true,
            avatarUrl: true,
            skills: true,
            portfolioUrl: true,
            rate: true,
            availability: true,
            contentTypes: true,
            needs: true,
            portfolioImages: {
              select: {
                id: true,
                url: true,
                title: true,
                description: true
              },
              orderBy: { order: "asc" }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Erreur GET user:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

