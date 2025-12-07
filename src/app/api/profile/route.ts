import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        subscriptions: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName || user.email,
        role: user.role,
        hasSubscription: user.subscriptions.some(s => s.status === "active"),
        profile: user.profile
      }
    });
  } catch (error) {
    console.error("Erreur profile GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();

    // Vérifier que le profil existe
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    });

    if (!existingProfile) {
      // Créer le profil s'il n'existe pas
      await prisma.profile.create({
        data: {
          userId: session.user.id,
          displayName: body.displayName || "Utilisateur",
          bio: body.bio,
          skills: body.skills,
          portfolioUrl: body.portfolioUrl,
          contentTypes: body.contentTypes,
          needs: body.needs,
          rate: body.rate,
          availability: body.availability
        }
      });
    } else {
      // Mettre à jour le profil
      await prisma.profile.update({
        where: { userId: session.user.id },
        data: {
          displayName: body.displayName,
          bio: body.bio,
          skills: body.skills,
          portfolioUrl: body.portfolioUrl,
          contentTypes: body.contentTypes,
          needs: body.needs,
          rate: body.rate,
          availability: body.availability
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur profile PUT:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = session.user.id;

    // Récupérer l'utilisateur avec ses abonnements
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Annuler les abonnements Stripe actifs
    for (const subscription of user.subscriptions) {
      if (subscription.status === "active" || subscription.status === "trialing") {
        try {
          await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        } catch (stripeError) {
          console.error("Erreur annulation Stripe:", stripeError);
        }
      }
    }

    // Supprimer le client Stripe si existant
    if (user.stripeCustomerId) {
      try {
        await stripe.customers.del(user.stripeCustomerId);
      } catch (stripeError) {
        console.error("Erreur suppression client Stripe:", stripeError);
      }
    }

    // Supprimer toutes les données liées à l'utilisateur
    // L'ordre est important à cause des contraintes de clés étrangères
    await prisma.$transaction([
      // Supprimer les messages envoyés par l'utilisateur
      prisma.message.deleteMany({
        where: { senderId: userId }
      }),
      // Supprimer les conversations où l'utilisateur participe
      prisma.conversation.deleteMany({
        where: {
          OR: [{ creatorId: userId }, { designerId: userId }]
        }
      }),
      // Supprimer les livraisons
      prisma.missionDelivery.deleteMany({
        where: {
          OR: [
            { creatorId: userId },
            { freelancerId: userId }
          ]
        }
      }),
      // Supprimer les propositions
      prisma.proposal.deleteMany({
        where: {
          OR: [{ designerId: userId }, { mission: { creatorId: userId } }]
        }
      }),
      // Supprimer les pièces jointes des missions
      prisma.missionAttachment.deleteMany({
        where: { mission: { creatorId: userId } }
      }),
      // Supprimer les missions
      prisma.mission.deleteMany({
        where: { creatorId: userId }
      }),
      // Supprimer les images du portfolio
      prisma.portfolioImage.deleteMany({
        where: { profile: { userId: userId } }
      }),
      // Supprimer les abonnements
      prisma.subscription.deleteMany({
        where: { userId: userId }
      }),
      // Supprimer le profil
      prisma.profile.deleteMany({
        where: { userId: userId }
      }),
      // Supprimer l'utilisateur
      prisma.user.delete({
        where: { id: userId }
      })
    ]);

    return NextResponse.json({ success: true, message: "Compte supprimé avec succès" });
  } catch (error) {
    console.error("Erreur suppression compte:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du compte" },
      { status: 500 }
    );
  }
}
