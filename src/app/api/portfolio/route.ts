import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Taille max : 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// GET - Récupérer les images du portfolio
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        portfolioImages: {
          orderBy: { order: "asc" }
        }
      }
    });

    return NextResponse.json({
      images: profile?.portfolioImages || []
    });
  } catch (error) {
    console.error("Erreur GET portfolio:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Ajouter une image au portfolio
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est un designer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true }
    });

    if (!user || user.role !== "DESIGNER") {
      return NextResponse.json(
        { error: "Seuls les graphistes/monteurs peuvent ajouter des images au portfolio" },
        { status: 403 }
      );
    }

    // Créer le profil s'il n'existe pas
    let profile = user.profile;
    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          userId: user.id,
          displayName: user.email.split("@")[0]
        }
      });
    }

    // Vérifier le nombre d'images (max 12)
    const imageCount = await prisma.portfolioImage.count({
      where: { profileId: profile.id }
    });

    if (imageCount >= 12) {
      return NextResponse.json(
        { error: "Vous avez atteint la limite de 12 images" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Vérifier le type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non autorisé. Utilisez JPG, PNG, WebP ou GIF." },
        { status: 400 }
      );
    }

    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop volumineux. Maximum 5 Mo." },
        { status: 400 }
      );
    }

    // Créer le dossier uploads s'il n'existe pas
    const uploadsDir = join(process.cwd(), "public", "uploads", "portfolio");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Générer un nom de fichier unique
    const ext = file.name.split(".").pop();
    const filename = `${session.user.id}-${Date.now()}.${ext}`;
    const filepath = join(uploadsDir, filename);

    // Sauvegarder le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // URL publique
    const url = `/uploads/portfolio/${filename}`;

    // Créer l'entrée en base
    const image = await prisma.portfolioImage.create({
      data: {
        profileId: profile.id,
        url,
        filename,
        title: title || null,
        description: description || null,
        order: imageCount
      }
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST portfolio:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}








































