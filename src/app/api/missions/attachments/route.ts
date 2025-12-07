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

