/**
 * API pour réinitialiser le mot de passe
 * 
 * GET - Vérifier si un token est valide
 * POST - Réinitialiser le mot de passe avec le token
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * GET - Vérifier si le token est valide
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 400 }
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 404 }
      );
    }

    if (resetToken.expiresAt < new Date()) {
      // Supprimer le token expiré
      await prisma.passwordResetToken.delete({
        where: { token }
      });
      return NextResponse.json(
        { error: "Token expiré" },
        { status: 410 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Erreur validation token:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * POST - Réinitialiser le mot de passe
 */
export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token et mot de passe requis" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    // Trouver le token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 404 }
      );
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { token }
      });
      return NextResponse.json(
        { error: "Token expiré" },
        { status: 410 }
      );
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Supprimer le token utilisé
    await prisma.passwordResetToken.delete({
      where: { token }
    });

    // Supprimer tous les autres tokens de cet utilisateur
    await prisma.passwordResetToken.deleteMany({
      where: { email: resetToken.email }
    });

    return NextResponse.json({ 
      success: true,
      message: "Mot de passe modifié avec succès"
    });
  } catch (error) {
    console.error("Erreur reset-password:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}


