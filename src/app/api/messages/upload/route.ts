/**
 * Upload rapide pour pièces jointes de la messagerie.
 * - Auth requis
 * - Stockage local sous /public/uploads/messages
 * - Retourne une URL publique utilisable dans le message
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { authOptions } from "@/lib/auth";

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

    const uploadDir = path.join(process.cwd(), "public", "uploads", "messages");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const filename = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const url = `/uploads/messages/${filename}`;

    return NextResponse.json({
      url,
      name: file.name,
      size: file.size,
      mime: file.type
    });
  } catch (error) {
    console.error("Erreur upload message:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}













