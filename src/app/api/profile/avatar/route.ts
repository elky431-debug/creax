import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Taille max : 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Vérifier le type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non autorisé. Utilisez JPG, PNG ou WebP." },
        { status: 400 }
      );
    }

    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop volumineux. Maximum 2 Mo." },
        { status: 400 }
      );
    }

    // Récupérer le profil existant pour supprimer l'ancienne photo
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    });

    // Supprimer l'ancienne photo si elle existe
    if (existingProfile?.avatarUrl && existingProfile.avatarUrl.startsWith("/uploads/")) {
      try {
        const oldPath = join(process.cwd(), "public", existingProfile.avatarUrl);
        if (existsSync(oldPath)) {
          await unlink(oldPath);
        }
      } catch {
        // Ignorer les erreurs de suppression
      }
    }

    // Créer le dossier uploads s'il n'existe pas
    const uploadsDir = join(process.cwd(), "public", "uploads", "avatars");
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
    const avatarUrl = `/uploads/avatars/${filename}`;

    // Mettre à jour ou créer le profil
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (existingProfile) {
      await prisma.profile.update({
        where: { userId: session.user.id },
        data: { avatarUrl }
      });
    } else {
      await prisma.profile.create({
        data: {
          userId: session.user.id,
          displayName: user?.email?.split("@")[0] || "Utilisateur",
          avatarUrl
        }
      });
    }

    return NextResponse.json({ avatarUrl }, { status: 200 });
  } catch (error) {
    console.error("Erreur upload avatar:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer la photo de profil
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    });

    if (!profile) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }

    // Supprimer le fichier
    if (profile.avatarUrl && profile.avatarUrl.startsWith("/uploads/")) {
      try {
        const filepath = join(process.cwd(), "public", profile.avatarUrl);
        if (existsSync(filepath)) {
          await unlink(filepath);
        }
      } catch {
        // Ignorer les erreurs
      }
    }

    // Mettre à jour le profil
    await prisma.profile.update({
      where: { userId: session.user.id },
      data: { avatarUrl: null }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression avatar:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}



































