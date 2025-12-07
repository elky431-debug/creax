/**
 * API pour gérer les livraisons de missions
 * 
 * GET /api/deliveries - Liste des livraisons (freelance ou créateur)
 * POST /api/deliveries - Créer une nouvelle livraison (version protégée)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schéma de validation pour créer une livraison
const createDeliverySchema = z.object({
  missionId: z.string().cuid(),
  protectedUrl: z.string().min(1), // Accepte les URLs relatives comme /uploads/...
  protectedType: z.enum(["image", "video"]),
  protectedNote: z.string().optional(),
  amount: z.number().int().positive() // Montant en centimes
});

/**
 * GET - Liste des livraisons
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const missionId = searchParams.get("missionId");

    // Construire les conditions de filtrage
    const whereConditions: any = {};

    if (user.role === "CREATOR") {
      whereConditions.creatorId = session.user.id;
    } else {
      whereConditions.freelancerId = session.user.id;
    }

    if (status && status !== "ALL") {
      whereConditions.status = status;
    }

    if (missionId) {
      whereConditions.missionId = missionId;
    }

    const deliveries = await prisma.missionDelivery.findMany({
      where: whereConditions,
      include: {
        mission: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true
          }
        },
        freelancer: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true
              }
            }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    // Formater les livraisons
    const formattedDeliveries = deliveries.map((delivery) => ({
      id: delivery.id,
      missionId: delivery.missionId,
      mission: {
        id: delivery.mission.id,
        title: delivery.mission.title,
        type: delivery.mission.type,
        status: delivery.mission.status
      },
      freelancer: {
        id: delivery.freelancer.id,
        displayName: delivery.freelancer.profile?.displayName || delivery.freelancer.email,
        avatarUrl: delivery.freelancer.profile?.avatarUrl
      },
      creator: {
        id: delivery.creator.id,
        displayName: delivery.creator.profile?.displayName || delivery.creator.email,
        avatarUrl: delivery.creator.profile?.avatarUrl
      },
      protectedUrl: delivery.protectedUrl,
      protectedType: delivery.protectedType,
      protectedNote: delivery.protectedNote,
      finalUrl: delivery.paymentStatus === "PAID" ? delivery.finalUrl : null,
      status: delivery.status,
      paymentStatus: delivery.paymentStatus,
      amount: delivery.amount,
      revisionNote: delivery.revisionNote,
      revisionCount: delivery.revisionCount,
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt
    }));

    return NextResponse.json({ deliveries: formattedDeliveries });
  } catch (error) {
    console.error("Erreur GET deliveries:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST - Créer une livraison (envoyer version protégée)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est un designer/freelance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== "DESIGNER") {
      return NextResponse.json(
        { error: "Seuls les graphistes/monteurs peuvent envoyer des livraisons" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createDeliverySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { missionId, protectedUrl, protectedType, protectedNote, amount } = parsed.data;

    // Vérifier que la mission existe et est en cours
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      select: {
        id: true,
        creatorId: true,
        status: true,
        assignedFreelancerId: true
      }
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
    }

    if (mission.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Cette mission n'est pas en cours" },
        { status: 400 }
      );
    }

    // Vérifier que le freelance est assigné à cette mission
    if (mission.assignedFreelancerId !== session.user.id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas assigné à cette mission" },
        { status: 403 }
      );
    }

    // Vérifier si une livraison existe déjà
    const existingDelivery = await prisma.missionDelivery.findUnique({
      where: {
        missionId_freelancerId: {
          missionId,
          freelancerId: session.user.id
        }
      }
    });

    if (existingDelivery && existingDelivery.status !== "NEEDS_REVISION") {
      return NextResponse.json(
        { error: "Une livraison existe déjà pour cette mission" },
        { status: 400 }
      );
    }

    // Créer ou mettre à jour la livraison
    const delivery = existingDelivery
      ? await prisma.missionDelivery.update({
          where: { id: existingDelivery.id },
          data: {
            protectedUrl,
            protectedType,
            protectedNote,
            status: "PROTECTED_SENT",
            protectedExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 heures
            updatedAt: new Date()
          }
        })
      : await prisma.missionDelivery.create({
          data: {
            missionId,
            freelancerId: session.user.id,
            creatorId: mission.creatorId,
            protectedUrl,
            protectedType,
            protectedNote,
            amount,
            status: "PROTECTED_SENT",
            protectedExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 heures
          }
        });

    return NextResponse.json({ delivery }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST delivery:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

