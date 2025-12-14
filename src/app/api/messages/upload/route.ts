/**
 * Upload pour pièces jointes de la messagerie.
 * - Auth requis
 * - Stockage sur Supabase Storage
 * - Retourne une URL publique utilisable dans le message
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed"
];

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

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 20MB)" }, { status: 400 });
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Type non supporté (images, vidéos mp4/mov/webm, pdf, zip)" },
        { status: 400 }
      );
    }

    // Générer un nom de fichier unique
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const filename = `messages/${session.user.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Convertir le fichier en ArrayBuffer
    const bytes = await file.arrayBuffer();

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(filename, bytes, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error("Erreur Supabase Storage:", uploadError);
      return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from("uploads")
      .getPublicUrl(filename);

    return NextResponse.json({
      url: urlData.publicUrl,
      name: file.name,
      size: file.size,
      mime: file.type
    });
  } catch (error) {
    console.error("Erreur upload message:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
