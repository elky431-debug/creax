import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const missionSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(100, "Le titre ne peut pas dépasser 100 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  type: z.enum(["MINIATURE_YOUTUBE", "MONTAGE_VIDEO", "DESIGN_BANNIERE", "MOTION_DESIGN", "RETOUCHE_PHOTO", "AUTRE"]),
  deadline: z.string().optional().nullable().transform(val => val === "" ? null : val),
  budgetRange: z.enum(["LESS_THAN_20", "BETWEEN_20_50", "BETWEEN_50_150", "MORE_THAN_150", "CUSTOM", ""]).optional().nullable().transform(val => val === "" ? null : val),
  budgetCustom: z.number().optional().nullable()
});

// GET - Récupérer les missions
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const creatorOnly = searchParams.get("creatorOnly") === "true";

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Si créateur, récupérer ses missions
    // Si designer, récupérer les missions ouvertes
    const missions = await prisma.mission.findMany({
      where: {
        ...(creatorOnly || user.role === "CREATOR" ? { creatorId: session.user.id } : {}),
        ...(status ? { status: status as any } : {}),
        ...(user.role === "DESIGNER" && !creatorOnly ? { status: "OPEN" } : {})
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
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
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ missions });
  } catch (error) {
    console.error("Erreur GET missions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une mission
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est un créateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== "CREATOR") {
      return NextResponse.json(
        { error: "Seuls les créateurs de contenu peuvent publier des missions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = missionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { title, description, type, deadline, budgetRange, budgetCustom } = parsed.data;

    const mission = await prisma.mission.create({
      data: {
        creatorId: session.user.id,
        title,
        description,
        type,
        deadline: deadline ? new Date(deadline) : null,
        budgetRange: budgetRange || null,
        budgetCustom: budgetCustom || null,
        status: "OPEN"
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ mission }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST mission:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

