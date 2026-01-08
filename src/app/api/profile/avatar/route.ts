import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

// Taille max : 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function extFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "bin";
}

function extractSupabaseKeyFromPublicUrl(url: string): string | null {
  // Format attendu: https://<project>.supabase.co/storage/v1/object/public/uploads/<key>
  const marker = "/storage/v1/object/public/uploads/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Guard: éviter un crash silencieux si Supabase n'est pas configuré en prod
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: "Stockage non configuré. Contactez le support." },
        { status: 500 }
      );
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

    // Récupérer le profil existant (pour éventuellement supprimer l'ancienne photo côté Storage)
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    });

    // Générer un nom de fichier unique
    const ext = extFromMime(file.type);
    const filename = `avatars/${session.user.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Upload vers Supabase Storage (bucket "uploads")
    const bytes = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(filename, bytes, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error("Erreur Supabase Storage (avatar):", uploadError);
      return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
    }

    // URL publique
    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(filename);
    const avatarUrl = urlData.publicUrl;

    // Best-effort: supprimer l'ancien fichier (si c'était un URL Supabase)
    if (existingProfile?.avatarUrl) {
      const oldKey = extractSupabaseKeyFromPublicUrl(existingProfile.avatarUrl);
      if (oldKey) {
        try {
          await supabase.storage.from("uploads").remove([oldKey]);
        } catch {
          // ignore
        }
      }
    }

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

    // Best-effort: supprimer le fichier sur Supabase si possible (ne bloque jamais la suppression)
    if (profile.avatarUrl) {
      const key = extractSupabaseKeyFromPublicUrl(profile.avatarUrl);
      if (key) {
        try {
          await supabase.storage.from("uploads").remove([key]);
        } catch {
          // ignore
        }
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



















































