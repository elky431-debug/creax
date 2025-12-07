import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const roleFilter = searchParams.get("role") as "CREATOR" | "DESIGNER" | null;

    const users = await prisma.user.findMany({
      where: {
        id: { not: session.user.id }, // Exclure l'utilisateur actuel
        role: roleFilter || undefined,
        profile: query
          ? {
              OR: [
                { displayName: { contains: query, mode: "insensitive" } },
                { bio: { contains: query, mode: "insensitive" } },
                { skills: { contains: query, mode: "insensitive" } },
                { contentTypes: { contains: query, mode: "insensitive" } }
              ]
            }
          : undefined
      },
      include: {
        profile: {
          select: {
            displayName: true,
            bio: true,
            avatarUrl: true,
            skills: true,
            portfolioUrl: true,
            rate: true,
            contentTypes: true,
            needs: true
          }
        }
      },
      take: 30
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Erreur search:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


