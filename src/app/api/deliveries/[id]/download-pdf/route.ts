import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

function extFromFilename(name: string | null | undefined): string {
  if (!name) return "";
  const parts = name.split(".");
  return (parts[parts.length - 1] || "").toLowerCase();
}

/**
 * GET /api/deliveries/[id]/download-pdf
 * Convertit la version finale (image) en PDF et renvoie un fichier téléchargeable.
 * 
 * Sécurité: uniquement le créateur (ou le freelance) et uniquement si paymentStatus === PAID.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const deliveryId = params.id;
    const delivery = await prisma.missionDelivery.findUnique({
      where: { id: deliveryId },
      select: {
        id: true,
        creatorId: true,
        freelancerId: true,
        paymentStatus: true,
        finalUrl: true,
        finalFilename: true,
        mission: { select: { title: true } }
      }
    });

    if (!delivery) {
      return NextResponse.json({ error: "Livraison introuvable" }, { status: 404 });
    }

    const isCreator = delivery.creatorId === session.user.id;
    const isFreelancer = delivery.freelancerId === session.user.id;
    if (!isCreator && !isFreelancer) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    if (delivery.paymentStatus !== "PAID") {
      return NextResponse.json({ error: "Paiement requis" }, { status: 402 });
    }

    if (!delivery.finalUrl) {
      return NextResponse.json({ error: "Version finale introuvable" }, { status: 400 });
    }

    const ext = extFromFilename(delivery.finalFilename);
    const supported = ["jpg", "jpeg", "png", "webp"];
    if (!supported.includes(ext)) {
      return NextResponse.json(
        { error: "Conversion PDF disponible uniquement pour les images" },
        { status: 400 }
      );
    }

    const res = await fetch(delivery.finalUrl);
    if (!res.ok) {
      return NextResponse.json({ error: "Impossible de récupérer l'image finale" }, { status: 502 });
    }

    let imageBytes = Buffer.from(await res.arrayBuffer());
    let embedType: "jpg" | "png" = ext === "png" ? "png" : "jpg";

    if (ext === "png") {
      // ok
    } else if (ext === "jpg" || ext === "jpeg") {
      // ok
    } else {
      // webp -> png
      imageBytes = await sharp(imageBytes).png().toBuffer();
      embedType = "png";
    }

    const pdf = await PDFDocument.create();
    const image = embedType === "png"
      ? await pdf.embedPng(imageBytes)
      : await pdf.embedJpg(imageBytes);

    const { width, height } = image.scale(1);
    const page = pdf.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });

    const pdfBytes = await pdf.save();

    const safeTitle = (delivery.mission.title || "CREIX").replace(/[^\w\-]+/g, "_").slice(0, 60);
    const filename = `CREIX_${safeTitle}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error("Erreur download-pdf:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


