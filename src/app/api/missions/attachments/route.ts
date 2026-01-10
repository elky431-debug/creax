/**
 * Upload des pièces jointes & références d'une mission.
 *
 * POST /api/missions/attachments
 * FormData:
 * - file: File
 * - missionId: string
 * - type: "attachment" | "reference"
 *
 * Règles:
 * - Auth requis
 * - Rôle CREATOR uniquement
 * - La mission doit appartenir au créateur
 * - Stockage sur Supabase Storage ("uploads")
 * - Enregistre l'entrée dans MissionAttachment (type ATTACHMENT/REFERENCE)
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_REFERENCE_SIZE = 5 * 1024 * 1024; // 5MB

const ACCEPTED_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream"
];

const ACCEPTED_REFERENCE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function safeExt(fileName: string): string {
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "";
  const clean = (ext || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean || "bin";
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier rôle
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });
    if (!user || user.role !== "CREATOR") {
      return NextResponse.json({ error: "Accès réservé aux créateurs" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const missionId = formData.get("missionId") as string | null;
    const rawType = (formData.get("type") as string | null) || "attachment"; // attachment|reference

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }
    if (!missionId) {
      return NextResponse.json({ error: "missionId requis" }, { status: 400 });
    }

    const kind = rawType === "reference" ? "REFERENCE" : "ATTACHMENT";
    const maxSize = kind === "REFERENCE" ? MAX_REFERENCE_SIZE : MAX_ATTACHMENT_SIZE;
    const accepted = kind === "REFERENCE" ? ACCEPTED_REFERENCE_TYPES : ACCEPTED_ATTACHMENT_TYPES;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${(maxSize / 1024 / 1024).toFixed(0)}MB)` },
        { status: 400 }
      );
    }

    if (!accepted.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non supporté" },
        { status: 400 }
      );
    }

    // Vérifier propriété de la mission
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      select: { creatorId: true }
    });
    if (!mission) {
      return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
    }
    if (mission.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Vous ne pouvez pas modifier cette mission" }, { status: 403 });
    }

    const ext = safeExt(file.name);
    const path = `missions/${missionId}/${kind.toLowerCase()}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(path, bytes, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error("Supabase upload error (mission attachment):", uploadError);
      return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);

    const attachment = await prisma.missionAttachment.create({
      data: {
        missionId,
        url: urlData.publicUrl,
        filename: file.name,
        type: kind as any
      }
    });

    return NextResponse.json(
      {
        attachment: {
          id: attachment.id,
          url: attachment.url,
          filename: attachment.filename,
          type: attachment.type
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur upload mission attachment:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Taille max : 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "video/mp4",
  "video/quicktime"
];

// POST - Ajouter une pièce jointe à une mission
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const missionId = formData.get("missionId") as string | null;
    const attachmentType = (formData.get("type") as string) || "attachment";

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    if (!missionId) {
      return NextResponse.json({ error: "ID de mission manquant" }, { status: 400 });
    }

    // Déterminer le type d'attachment
    const type = attachmentType === "reference" ? "REFERENCE" : "ATTACHMENT";

    // Vérifier que la mission appartient à l'utilisateur
    const mission = await prisma.mission.findUnique({
      where: { id: missionId }
    });

    if (!mission || mission.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Vérifier le type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non autorisé" },
        { status: 400 }
      );
    }

    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop volumineux. Maximum 10 Mo." },
        { status: 400 }
      );
    }

    // Créer le dossier uploads s'il n'existe pas
    const uploadsDir = join(process.cwd(), "public", "uploads", "missions");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Générer un nom de fichier unique
    const ext = file.name.split(".").pop();
    const filename = `${missionId}-${Date.now()}.${ext}`;
    const filepath = join(uploadsDir, filename);

    // Sauvegarder le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // URL publique
    const url = `/uploads/missions/${filename}`;

    // Créer l'entrée en base
    const attachment = await prisma.missionAttachment.create({
      data: {
        missionId,
        url,
        filename: file.name,
        type: type as "ATTACHMENT" | "REFERENCE"
      }
    });

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST attachment:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

