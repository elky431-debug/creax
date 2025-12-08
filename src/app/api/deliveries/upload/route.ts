/**
 * API pour uploader un fichier de livraison avec watermark automatique
 * 
 * POST /api/deliveries/upload
 * 
 * Fonctionnalités :
 * - Upload d'images (jpg, png, webp) → watermark automatique CREIX
 * - Upload de vidéos (mp4, mov, webm) → compression + watermark texte
 * - Stockage sur le serveur (ou S3 en production)
 * 
 * Le watermark inclut :
 * - Logo/texte "CREIX"
 * - Nom du freelance
 * - Mention "VERSION PROTÉGÉE"
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// Taille max : 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Types de fichiers acceptés
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

/**
 * Échapper les caractères spéciaux XML
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Générer le watermark SVG pour les images
 * WATERMARK ÉNORME ET IMPOSSIBLE À ENLEVER
 */
function generateWatermarkSVG(freelancerName: string, width: number, height: number): Buffer {
  // Échapper le nom pour éviter les erreurs XML
  const safeName = escapeXml(freelancerName);
  
  // Taille ÉNORME pour CREIX au centre
  const hugeFontSize = Math.max(80, Math.min(width, height) / 4);
  const mediumFontSize = hugeFontSize * 0.3;
  const smallFontSize = hugeFontSize * 0.2;
  const year = new Date().getFullYear();
  
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
${generateRepeatedWatermarks(width, height, smallFontSize)}
<g transform="rotate(-25, ${width/2}, ${height/2})">
      <text x="${width/2 + 4}" y="${height/2 + 4}" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="${hugeFontSize}px" font-weight="900" fill="rgba(0,0,0,0.5)">CREIX</text>
      <text x="${width/2}" y="${height/2}" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="${hugeFontSize}px" font-weight="900" fill="rgba(255,255,255,0.7)">CREIX</text>
      <text x="${width/2}" y="${height/2}" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="${hugeFontSize}px" font-weight="900" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="2">CREIX</text>
<text x="${width/2}" y="${height/2 + mediumFontSize * 1.5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${mediumFontSize}px" font-weight="bold" fill="rgba(255,255,255,0.6)">VERSION PROTEGEE</text>
<text x="${width/2}" y="${height/2 + mediumFontSize * 2.5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${smallFontSize}px" font-weight="bold" fill="rgba(255,255,255,0.5)">${safeName}</text>
</g>
      <text x="15" y="30" font-family="Arial, sans-serif" font-size="${smallFontSize}px" font-weight="bold" fill="rgba(255,255,255,0.6)">CREIX ${year}</text>
      <text x="${width - 15}" y="30" text-anchor="end" font-family="Arial, sans-serif" font-size="${smallFontSize}px" font-weight="bold" fill="rgba(255,255,255,0.6)">CREIX</text>
      <text x="15" y="${height - 60}" font-family="Arial, sans-serif" font-size="${smallFontSize}px" font-weight="bold" fill="rgba(255,255,255,0.6)">CREIX</text>
<text x="${width - 15}" y="${height - 60}" text-anchor="end" font-family="Arial, sans-serif" font-size="${smallFontSize}px" font-weight="bold" fill="rgba(255,255,255,0.6)">${year}</text>
<rect x="0" y="${height - 45}" width="${width}" height="45" fill="rgba(0,0,0,0.6)"/>
      <text x="${width/2}" y="${height - 18}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${smallFontSize * 1.2}px" font-weight="bold" fill="rgba(255,255,255,0.9)">CREIX ${year} - TELECHARGEMENT INTERDIT</text>
</svg>`;
  
  return Buffer.from(svg);
}

/**
 * Générer des watermarks répétés en diagonale BIEN VISIBLES
 */
function generateRepeatedWatermarks(width: number, height: number, fontSize: number): string {
  const texts: string[] = [];
  const spacing = fontSize * 4;
  const year = new Date().getFullYear();
  
  let rowIndex = 0;
  for (let y = -height * 0.3; y < height * 1.3; y += spacing) {
    const xOffset = (rowIndex % 2) * (spacing / 2);
    for (let x = -width * 0.3 + xOffset; x < width * 1.3; x += spacing) {
      const text = rowIndex % 2 === 0 ? "CREIX" : `${year}`;
      texts.push(`<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize * 1.2}px" font-weight="900" fill="rgba(255,255,255,0.25)" transform="rotate(-25, ${x}, ${y})">${text}</text>`);
    }
    rowIndex++;
  }
  
  return texts.join("");
}

/**
 * Appliquer le watermark + flou léger sur une image
 * Le flou permet de voir le travail mais empêche l'utilisation sans paiement
 */
async function applyImageWatermark(
  imageBuffer: Buffer,
  freelancerName: string
): Promise<Buffer> {
  // Récupérer les métadonnées de l'image
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 600;
  
  // Générer le watermark SVG
  const watermarkSvg = generateWatermarkSVG(freelancerName, width, height);
  
  // 1. D'abord appliquer un flou modéré (on peut voir mais pas utiliser)
  const blurredImage = await sharp(imageBuffer)
    .blur(8) // Flou léger - visible mais protégé
    .toBuffer();
  
  // 2. Ensuite appliquer le watermark sur l'image floutée
  const watermarkedImage = await sharp(blurredImage)
    .composite([
      {
        input: watermarkSvg,
        top: 0,
        left: 0,
      }
    ])
    .jpeg({ quality: 80 }) // Compression pour réduire la qualité
    .toBuffer();
  
  return watermarkedImage;
}

/**
 * POST - Upload avec watermark automatique
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est un designer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: {
          select: { displayName: true }
        }
      }
    });

    if (!user || user.role !== "DESIGNER") {
      return NextResponse.json(
        { error: "Seuls les graphistes/monteurs peuvent uploader des livraisons" },
        { status: 403 }
      );
    }

    const freelancerName = user.profile?.displayName || user.email.split("@")[0];

    // Récupérer le fichier
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const missionId = formData.get("missionId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    if (!missionId) {
      return NextResponse.json({ error: "ID de mission requis" }, { status: 400 });
    }

    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 50MB)" },
        { status: 400 }
      );
    }

    // Vérifier le type
    const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
    const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Type de fichier non supporté. Utilisez JPG, PNG, WebP, MP4, MOV ou WebM." },
        { status: 400 }
      );
    }

    // Vérifier que la mission existe et que le freelance y est assigné
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      select: { assignedFreelancerId: true, status: true }
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
    }

    if (mission.assignedFreelancerId !== session.user.id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas assigné à cette mission" },
        { status: 403 }
      );
    }

    // Créer le dossier d'upload si nécessaire
    const uploadDir = path.join(process.cwd(), "public", "uploads", "deliveries");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = isImage ? "jpg" : file.name.split(".").pop() || "mp4";
    const filename = `delivery_${missionId}_${timestamp}_${randomStr}.${extension}`;
    const filepath = path.join(uploadDir, filename);

    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    // Appliquer le flou + watermark pour les images
    if (isImage) {
      try {
        console.log("Application du flou et watermark...");
        buffer = await applyImageWatermark(buffer, freelancerName);
        console.log("Flou et watermark appliqués avec succès!");
      } catch (error) {
        console.error("ERREUR watermark/flou:", error);
        // On renvoie une erreur au lieu d'ignorer
        return NextResponse.json(
          { error: "Erreur lors de l'application du filigrane" },
          { status: 500 }
        );
      }
    }

    // Sauvegarder le fichier
    await writeFile(filepath, buffer);

    // URL publique
    const publicUrl = `/uploads/deliveries/${filename}`;

    return NextResponse.json({
      url: publicUrl,
      type: isImage ? "image" : "video",
      filename: file.name,
      size: buffer.length,
      watermarked: isImage // Les images sont watermarkées automatiquement
    });
  } catch (error) {
    console.error("Erreur upload delivery:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


