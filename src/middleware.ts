import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Pages accessibles sans authentification
const PUBLIC_PAGES = [
  "/",
  "/login",
  "/signup",
  "/pricing",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/api/billing",
  "/api/stripe/webhook",
  "/api/subscription"
];

// Pages accessibles connecté SANS abonnement actif
const NO_SUBSCRIPTION_PAGES = [
  "/subscribe",
  "/subscribe/success",
  "/api/billing",
  "/api/auth",
  "/api/subscription"
];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Vérifier si la page nécessite un abonnement
    const canAccessWithoutSub = NO_SUBSCRIPTION_PAGES.some(page =>
      pathname === page || pathname.startsWith(page + "/")
    );

    // Si on peut accéder sans abonnement, laisser passer
    if (canAccessWithoutSub) {
      return NextResponse.next();
    }

    // La vérification d'abonnement se fait côté page, pas dans le middleware
    // Le middleware vérifie seulement l'authentification
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Pages publiques accessibles à tous
        const isPublic = PUBLIC_PAGES.some(page => 
          pathname === page || pathname.startsWith(page + "/")
        );
        
        if (isPublic) return true;

        // Page /subscribe accessible si connecté (même sans abonnement)
        if (pathname === "/subscribe" || pathname.startsWith("/subscribe/")) {
          return !!token;
        }

        // Les fichiers statiques sont toujours accessibles
        if (pathname.startsWith("/_next") || pathname.includes(".")) {
          return true;
        }

        // Sinon, l'utilisateur doit être connecté
        return !!token;
      }
    }
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|uploads).*)"
  ]
};










