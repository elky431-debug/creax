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
  "/api/stripe/webhook"
];

// Pages accessibles connecté SANS abonnement actif
const NO_SUBSCRIPTION_PAGES = [
  "/subscribe",
  "/subscribe/success",
  "/api/billing",
  "/api/auth"
];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Si l'utilisateur est connecté mais n'a pas d'abonnement actif
    if (token && !token.hasActiveSubscription) {
      // Vérifier si la page est accessible sans abonnement
      const canAccessWithoutSub = NO_SUBSCRIPTION_PAGES.some(page =>
        pathname === page || pathname.startsWith(page + "/")
      );

      // Si la page nécessite un abonnement, rediriger vers /subscribe
      if (!canAccessWithoutSub) {
        const url = req.nextUrl.clone();
        url.pathname = "/subscribe";
        return NextResponse.redirect(url);
      }
    }

    // Si l'utilisateur a un abonnement actif et essaie d'accéder à /subscribe
    if (token?.hasActiveSubscription && pathname === "/subscribe") {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

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
        if (pathname === "/subscribe") {
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










