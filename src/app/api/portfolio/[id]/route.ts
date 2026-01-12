import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

function extractSupabaseKeyFromPublicUrl(url: string): string | null {
  // Format attendu: https://<project>.supabase.co/storage/v1/object/public/uploads/<key>
  const marker = "/storage/v1/object/public/uploads/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

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

    // Best-effort: supprimer le fichier sur Supabase si possible
    const key = image.filename?.startsWith("portfolio/") ? image.filename : extractSupabaseKeyFromPublicUrl(image.url);
    if (key) {
      try {
        await supabase.storage.from("uploads").remove([key]);
      } catch {
        // ignore
      }
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


















































