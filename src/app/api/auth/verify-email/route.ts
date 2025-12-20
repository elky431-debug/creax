import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(10)
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Requête invalide" },
        { status: 400 }
      );
    }

    const { token } = parsed.data;

    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!record) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 400 }
      );
    }

    if (record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Token expiré" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: record.userId },
      data: {
        emailVerified: new Date()
      }
    });

    await prisma.emailVerificationToken.delete({
      where: { id: record.id }
    });

    return NextResponse.json(
      { message: "Email vérifié avec succès, vous pouvez vous connecter." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur vérification email", error);
    return NextResponse.json(
      { error: "Erreur serveur inattendue" },
      { status: 500 }
    );
  }
}





















































