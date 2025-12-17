/**
 * API pour gérer les informations bancaires des designers
 * 
 * GET /api/profile/bank - Récupérer les infos bancaires
 * POST /api/profile/bank - Sauvegarder les infos bancaires
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET - Récupérer les informations bancaires
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: {
        iban: true,
        bankAccountHolder: true,
        bankName: true,
        bic: true
      }
    });

    if (!profile) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }

    // Masquer partiellement l'IBAN pour la sécurité
    const maskedIban = profile.iban 
      ? profile.iban.slice(0, 4) + "****" + profile.iban.slice(-4)
      : null;

    return NextResponse.json({
      iban: maskedIban,
      bankAccountHolder: profile.bankAccountHolder,
      bankName: profile.bankName,
      bic: profile.bic,
      isConfigured: !!(profile.iban && profile.bankAccountHolder)
    });
  } catch (error) {
    console.error("Erreur récupération infos bancaires:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST - Sauvegarder les informations bancaires
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que c'est un designer
    if (session.user.role !== "DESIGNER") {
      return NextResponse.json(
        { error: "Seuls les designers peuvent configurer les paiements" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { iban, bankAccountHolder, bankName, bic } = body;

    // Validation basique de l'IBAN
    if (!iban || !bankAccountHolder) {
      return NextResponse.json(
        { error: "L'IBAN et le nom du titulaire sont requis" },
        { status: 400 }
      );
    }

    // Nettoyer l'IBAN (supprimer les espaces)
    const cleanIban = iban.replace(/\s/g, "").toUpperCase();

    // Validation simple de l'IBAN (format européen)
    if (cleanIban.length < 15 || cleanIban.length > 34) {
      return NextResponse.json(
        { error: "Format d'IBAN invalide" },
        { status: 400 }
      );
    }

    // Mettre à jour le profil
    await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        iban: cleanIban,
        bankAccountHolder: bankAccountHolder.trim(),
        bankName: bankName?.trim() || null,
        bic: bic?.replace(/\s/g, "").toUpperCase() || null
      }
    });

    return NextResponse.json({ 
      success: true,
      message: "Informations bancaires enregistrées"
    });
  } catch (error) {
    console.error("Erreur sauvegarde infos bancaires:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

