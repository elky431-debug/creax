import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

// DELETE - Supprimer une image du portfolio
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const imageId = params.id;

    // Vérifier que l'image appartient à l'utilisateur
    const image = await prisma.portfolioImage.findUnique({
      where: { id: imageId },
      include: {
        profile: {
          select: { userId: true }
        }
      }
    });

    if (!image) {
      return NextResponse.json({ error: "Image introuvable" }, { status: 404 });
    }

    if (image.profile.userId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Supprimer le fichier physique
    try {
      const filepath = join(process.cwd(), "public", image.url);
      await unlink(filepath);
    } catch {
      // Le fichier n'existe peut-être plus, on continue
    }

    // Supprimer l'entrée en base
    await prisma.portfolioImage.delete({
      where: { id: imageId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE portfolio:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Mettre à jour les infos d'une image
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const imageId = params.id;
    const body = await req.json();

    // Vérifier que l'image appartient à l'utilisateur
    const image = await prisma.portfolioImage.findUnique({
      where: { id: imageId },
      include: {
        profile: {
          select: { userId: true }
        }
      }
    });

    if (!image) {
      return NextResponse.json({ error: "Image introuvable" }, { status: 404 });
    }

    if (image.profile.userId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Mettre à jour
    const updated = await prisma.portfolioImage.update({
      where: { id: imageId },
      data: {
        title: body.title ?? image.title,
        description: body.description ?? image.description,
        order: body.order ?? image.order
      }
    });

    return NextResponse.json({ image: updated });
  } catch (error) {
    console.error("Erreur PATCH portfolio:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}








































