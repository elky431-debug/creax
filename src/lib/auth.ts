import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  providers: [
    CredentialsProvider({
      name: "Email et mot de passe",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        const schema = z.object({
          email: z.string().email(),
          password: z.string().min(8)
        });

        const parsed = schema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.toLowerCase().trim();
        const password = parsed.data.password;

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            profile: true,
            subscriptions: {
              orderBy: { createdAt: "desc" },
              take: 1
            }
          }
        });

        if (!user || !user.hashedPassword) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.hashedPassword);
        if (!isValid) {
          return null;
        }

        // Déterminer si l'utilisateur a un abonnement actif
        const subscription = user.subscriptions[0];
        const hasActiveSub =
          subscription &&
          (subscription.status === "active" || subscription.status === "trialing");

        return {
          id: user.id,
          email: user.email,
          name: user.profile?.displayName ?? null,
          role: user.role,
          hasActiveSubscription: hasActiveSub
        };
      }
    })
  ],
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.hasActiveSubscription = (user as { hasActiveSubscription?: boolean }).hasActiveSubscription;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.hasActiveSubscription = token.hasActiveSubscription as boolean;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
