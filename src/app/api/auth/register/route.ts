import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  role: z.enum(["CREATOR", "DESIGNER"]),
  displayName: z.string().min(1, "Le nom est requis")
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const password = parsed.data.password;
    const role = parsed.data.role;
    const displayName = parsed.data.displayName;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur et son profil
    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        role,
        emailVerified: new Date(), // Pour simplifier, on marque l'email comme vérifié
        profile: {
          create: {
            displayName
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      subscriptionRequired: true
    });
  } catch (error) {
    console.error("Erreur register:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de la création du compte: ${errorMessage}` },
      { status: 500 }
    );
  }
}
