/**
 * API pour demander une réinitialisation de mot de passe
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // On retourne toujours un succès pour des raisons de sécurité
    // (ne pas révéler si un email existe ou non)
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Supprimer les anciens tokens pour cet email
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail }
    });

    // Créer un nouveau token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await prisma.passwordResetToken.create({
      data: {
        token,
        email: normalizedEmail,
        expiresAt
      }
    });

    // Construire le lien de réinitialisation
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://creix.app"}/reset-password?token=${token}`;

    // Envoyer l'email via Resend (ou autre service)
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      
      console.log("=== DEBUG EMAIL ===");
      console.log("RESEND_API_KEY présente:", !!resendApiKey);
      console.log("Email destinataire:", normalizedEmail);
      console.log("Reset URL:", resetUrl);
      
      if (resendApiKey) {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: "CREIX <noreply@creix.app>",
            to: normalizedEmail,
            subject: "Réinitialisation de votre mot de passe CREIX",
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; margin: 0; padding: 40px 20px;">
                <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #111 0%, #1a1a1a 100%); border-radius: 16px; border: 1px solid #333; padding: 40px;">
                  <h1 style="color: #00D9FF; font-size: 28px; margin: 0 0 24px; text-align: center;">CREIX</h1>
                  
                  <h2 style="color: #fff; font-size: 20px; margin: 0 0 16px;">Réinitialisation du mot de passe</h2>
                  
                  <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                    Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
                  </p>
                  
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                    <tr>
                      <td style="border-radius: 50px; background: linear-gradient(135deg, #00D9FF 0%, #10B981 100%);">
                        <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 16px 32px; color: #000; text-decoration: none; font-weight: 600; font-size: 14px;">
                          Réinitialiser mon mot de passe
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #666; font-size: 12px; margin: 24px 0 0; text-align: center;">
                    Ce lien expire dans 1 heure.<br>
                    Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                  </p>
                  
                  <p style="color: #555; font-size: 11px; margin: 16px 0 0; text-align: center; word-break: break-all;">
                    Si le bouton ne fonctionne pas, copiez ce lien :<br>
                    <a href="${resetUrl}" style="color: #00D9FF;">${resetUrl}</a>
                  </p>
                </div>
              </body>
              </html>
            `
          })
        });

        const emailResult = await emailResponse.json();
        console.log("Resend Response Status:", emailResponse.status);
        console.log("Resend Response:", JSON.stringify(emailResult));
        
        if (!emailResponse.ok) {
          console.error("Erreur Resend:", emailResult);
        } else {
          console.log("Email envoyé avec succès! ID:", emailResult.id);
        }
      } else {
        // Log pour le développement si pas de clé Resend
        console.log("PAS DE CLÉ RESEND - Email non envoyé");
        console.log(`Lien: ${resetUrl}`);
      }
      console.log("===================");
    } catch (emailError) {
      console.error("Erreur envoi email:", emailError);
      // On ne fait pas échouer la requête si l'email échoue
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur forgot-password:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}


