/**
 * API pour gérer une livraison spécifique
 * 
 * GET /api/deliveries/[id] - Détails d'une livraison
 * PATCH /api/deliveries/[id] - Mettre à jour (valider, refuser, envoyer final)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schéma de validation pour les mises à jour
const updateDeliverySchema = z.object({
  action: z.enum([
    "VALIDATE",       // Créateur valide la version protégée
    "REQUEST_REVISION", // Créateur demande des modifications
    "SEND_FINAL",     // Freelance envoie la version finale
    "SEND_REVISION",  // Freelance envoie une nouvelle version après révision
    "CONFIRM_TRANSFER" // Freelance confirme réception du virement
  ]),
  revisionNote: z.string().optional(),
  finalUrl: z.string().min(1).optional(),
  finalFilename: z.string().optional(),
  finalNote: z.string().optional(),
  // Pour SEND_REVISION
  protectedUrl: z.string().min(1).optional(),
  protectedType: z.enum(["image", "video"]).optional(),
  protectedNote: z.string().optional()
});

/**
 * GET - Détails d'une livraison
 */
export async function GET(
  req: Request,
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
      include: {
        mission: {
          select: {
            id: true,
            title: true,
            type: true,
            description: true,
            status: true,
            attachments: {
              where: { type: "REFERENCE" },
              take: 5
            }
          }
        },
        freelancer: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                bio: true,
                skills: true,
                iban: true,
                bic: true,
                bankName: true,
                bankAccountHolder: true
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
      }
    });

    if (!delivery) {
      return NextResponse.json({ error: "Livraison introuvable" }, { status: 404 });
    }

    // Vérifier les droits d'accès
    const isFreelancer = delivery.freelancerId === session.user.id;
    const isCreator = delivery.creatorId === session.user.id;

    if (!isFreelancer && !isCreator) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Masquer la version finale si pas payé
    const responseDelivery = {
      ...delivery,
      finalUrl: delivery.paymentStatus === "PAID" ? delivery.finalUrl : null,
      isFreelancer,
      isCreator
    };

    return NextResponse.json({ delivery: responseDelivery });
  } catch (error) {
    console.error("Erreur GET delivery:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH - Mettre à jour une livraison
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const deliveryId = params.id;

    // Récupérer la livraison
    const delivery = await prisma.missionDelivery.findUnique({
      where: { id: deliveryId },
      include: {
        mission: {
          select: { id: true, title: true }
        }
      }
    });

    if (!delivery) {
      return NextResponse.json({ error: "Livraison introuvable" }, { status: 404 });
    }

    const isFreelancer = delivery.freelancerId === session.user.id;
    const isCreator = delivery.creatorId === session.user.id;

    if (!isFreelancer && !isCreator) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateDeliverySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { action, revisionNote, finalUrl, finalFilename, finalNote, protectedUrl, protectedType, protectedNote } = parsed.data;

    // Traiter l'action
    switch (action) {
      case "VALIDATE": {
        // Seul le créateur peut valider
        if (!isCreator) {
          return NextResponse.json(
            { error: "Seul le créateur peut valider" },
            { status: 403 }
          );
        }

        if (delivery.status !== "PROTECTED_SENT") {
          return NextResponse.json(
            { error: "Cette livraison ne peut pas être validée" },
            { status: 400 }
          );
        }

        const updatedDelivery = await prisma.missionDelivery.update({
          where: { id: deliveryId },
          data: {
            status: "VALIDATED",
            paymentStatus: "PENDING", // virement en attente
            updatedAt: new Date()
          }
        });

        // Notification (message système) au créateur avec IBAN du freelance
        try {
          const deliveryWithBank = await prisma.missionDelivery.findUnique({
            where: { id: deliveryId },
            select: {
              missionId: true,
              creatorId: true,
              freelancerId: true,
              amount: true,
              freelancer: {
                select: {
                  email: true,
                  profile: {
                    select: {
                      displayName: true,
                      iban: true,
                      bic: true,
                      bankName: true,
                      bankAccountHolder: true
                    }
                  }
                }
              }
            }
          });

          if (deliveryWithBank) {
            const conv = await prisma.conversation.upsert({
              where: {
                missionId_creatorId_designerId: {
                  missionId: deliveryWithBank.missionId,
                  creatorId: deliveryWithBank.creatorId,
                  designerId: deliveryWithBank.freelancerId
                }
              },
              update: {},
              create: {
                missionId: deliveryWithBank.missionId,
                creatorId: deliveryWithBank.creatorId,
                designerId: deliveryWithBank.freelancerId
              }
            });

            const freelancerName =
              deliveryWithBank.freelancer.profile?.displayName || deliveryWithBank.freelancer.email;
            const amountEuro = (deliveryWithBank.amount / 100).toFixed(2);
            const iban = deliveryWithBank.freelancer.profile?.iban || "IBAN non renseigné";
            const bic = deliveryWithBank.freelancer.profile?.bic || "";
            const bankName = deliveryWithBank.freelancer.profile?.bankName || "";
            const holder = deliveryWithBank.freelancer.profile?.bankAccountHolder || freelancerName;

            const lines = [
              `✅ Livraison validée.`,
              `Paiement à effectuer par virement bancaire (hors CREIX) : ${amountEuro} €`,
              ``,
              `Bénéficiaire : ${holder}`,
              bankName ? `Banque : ${bankName}` : null,
              `IBAN : ${iban}`,
              bic ? `BIC : ${bic}` : null,
              ``,
              `Une fois le virement effectué, le freelance confirmera la réception et vous enverra la version finale.`
            ].filter(Boolean).join("\n");

            await prisma.message.create({
              data: {
                conversationId: conv.id,
                senderId: deliveryWithBank.freelancerId,
                type: "SYSTEM",
                content: lines,
                status: "SENT"
              }
            });

            await prisma.conversation.update({
              where: { id: conv.id },
              data: {
                lastMessageAt: new Date(),
                lastMessagePreview: `Virement requis (${amountEuro} €)`,
                unreadForCreator: { increment: 1 }
              }
            });
          }
        } catch (e) {
          console.error("Erreur notification virement:", e);
        }

        return NextResponse.json({ 
          delivery: updatedDelivery,
          message: "Livraison validée. Procédez au virement bancaire (hors CREIX) pour recevoir la version finale."
        });
      }

      case "REQUEST_REVISION": {
        // Seul le créateur peut demander des modifications
        if (!isCreator) {
          return NextResponse.json(
            { error: "Seul le créateur peut demander des modifications" },
            { status: 403 }
          );
        }

        if (delivery.status !== "PROTECTED_SENT") {
          return NextResponse.json(
            { error: "Cette livraison ne peut pas être modifiée" },
            { status: 400 }
          );
        }

        if (!revisionNote) {
          return NextResponse.json(
            { error: "Veuillez préciser les modifications souhaitées" },
            { status: 400 }
          );
        }

        const updatedDelivery = await prisma.missionDelivery.update({
          where: { id: deliveryId },
          data: {
            status: "NEEDS_REVISION",
            revisionNote,
            revisionCount: { increment: 1 },
            updatedAt: new Date()
          }
        });

        return NextResponse.json({ 
          delivery: updatedDelivery,
          message: "Demande de modification envoyée au freelance."
        });
      }

      case "SEND_FINAL": {
        // Seul le freelance peut envoyer la version finale
        if (!isFreelancer) {
          return NextResponse.json(
            { error: "Seul le freelance peut envoyer la version finale" },
            { status: 403 }
          );
        }

        // Vérifier que le paiement (virement) a été confirmé par le freelance
        if (delivery.paymentStatus !== "PAID") {
          return NextResponse.json(
            { error: "Le paiement par virement doit être confirmé avant d'envoyer la version finale" },
            { status: 400 }
          );
        }

        if (!finalUrl) {
          return NextResponse.json(
            { error: "URL de la version finale requise" },
            { status: 400 }
          );
        }

        const updatedDelivery = await prisma.missionDelivery.update({
          where: { id: deliveryId },
          data: {
            finalUrl,
            finalFilename,
            finalNote,
            status: "FINAL_SENT",
            finalExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
            updatedAt: new Date()
          }
        });

        // Message système au créateur: finale disponible
        try {
          const conv = await prisma.conversation.findUnique({
            where: {
              missionId_creatorId_designerId: {
                missionId: delivery.missionId,
                creatorId: delivery.creatorId,
                designerId: delivery.freelancerId
              }
            }
          });
          if (conv) {
            await prisma.message.create({
              data: {
                conversationId: conv.id,
                senderId: delivery.freelancerId,
                type: "SYSTEM",
                content: "🎉 Version finale envoyée. Vous pouvez maintenant la télécharger depuis l’onglet Livraisons.",
                status: "SENT"
              }
            });
            await prisma.conversation.update({
              where: { id: conv.id },
              data: {
                lastMessageAt: new Date(),
                lastMessagePreview: "Version finale envoyée",
                unreadForCreator: { increment: 1 }
              }
            });
          }
        } catch (e) {
          console.error("Erreur notif finale:", e);
        }

        // Mettre à jour le statut de la mission
        await prisma.mission.update({
          where: { id: delivery.missionId },
          data: { status: "COMPLETED" }
        });

        return NextResponse.json({ 
          delivery: updatedDelivery,
          message: "Version finale envoyée. La mission est terminée !"
        });
      }

      case "SEND_REVISION": {
        // Seul le freelance peut envoyer une révision
        if (!isFreelancer) {
          return NextResponse.json(
            { error: "Seul le freelance peut envoyer une révision" },
            { status: 403 }
          );
        }

        // Vérifier que la livraison est en attente de révision
        if (delivery.status !== "NEEDS_REVISION") {
          return NextResponse.json(
            { error: "Aucune révision n'a été demandée pour cette livraison" },
            { status: 400 }
          );
        }

        if (!protectedUrl) {
          return NextResponse.json(
            { error: "URL de la nouvelle version requise" },
            { status: 400 }
          );
        }

        const updatedDelivery = await prisma.missionDelivery.update({
          where: { id: deliveryId },
          data: {
            protectedUrl,
            protectedType: protectedType || "image",
            protectedNote,
            status: "PROTECTED_SENT", // Retour au statut "envoyé" pour validation
            revisionNote: null, // Effacer la note de révision
            updatedAt: new Date()
          }
        });

        return NextResponse.json({ 
          delivery: updatedDelivery,
          message: "Nouvelle version envoyée ! En attente de validation du créateur."
        });
      }

      case "CONFIRM_TRANSFER": {
        // Seul le freelance peut confirmer réception du virement
        if (!isFreelancer) {
          return NextResponse.json(
            { error: "Seul le freelance peut confirmer la réception du virement" },
            { status: 403 }
          );
        }

        if (delivery.status !== "VALIDATED") {
          return NextResponse.json(
            { error: "Le virement ne peut être confirmé que lorsque la livraison est validée" },
            { status: 400 }
          );
        }

        const updatedDelivery = await prisma.missionDelivery.update({
          where: { id: deliveryId },
          data: {
            paymentStatus: "PAID",
            status: "PAID",
            paidAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Message système au créateur: paiement confirmé
        try {
          const conv = await prisma.conversation.findUnique({
            where: {
              missionId_creatorId_designerId: {
                missionId: delivery.missionId,
                creatorId: delivery.creatorId,
                designerId: delivery.freelancerId
              }
            }
          });
          if (conv) {
            await prisma.message.create({
              data: {
                conversationId: conv.id,
                senderId: delivery.freelancerId,
                type: "SYSTEM",
                content: "✅ Paiement par virement confirmé par le freelance. La version finale sera envoyée dès que possible.",
                status: "SENT"
              }
            });
            await prisma.conversation.update({
              where: { id: conv.id },
              data: {
                lastMessageAt: new Date(),
                lastMessagePreview: "Paiement confirmé",
                unreadForCreator: { increment: 1 }
              }
            });
          }
        } catch (e) {
          console.error("Erreur notif paiement confirmé:", e);
        }

        return NextResponse.json({
          delivery: updatedDelivery,
          message: "Paiement confirmé. Vous pouvez maintenant envoyer la version finale."
        });
      }

      default:
        return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
    }
  } catch (error) {
    console.error("Erreur PATCH delivery:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

