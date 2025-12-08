import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Pages accessibles sans abonnement
const PUBLIC_PAGES = [
  "/",
  "/login",
  "/signup",
  "/pricing",
  "/api/auth",
  "/api/billing",
  "/api/stripe/webhook"
];

// Pages accessibles sans authentification
const AUTH_PAGES = ["/login", "/signup"];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Si l'utilisateur est connecté mais n'a pas d'abonnement actif
    if (token && !token.hasActiveSubscription) {
      // Autoriser les pages publiques et l'API
      const isPublicPage = PUBLIC_PAGES.some(page => 
        pathname === page || pathname.startsWith(page + "/") || pathname.startsWith("/api/")
      );

      if (!isPublicPage && !pathname.startsWith("/_next") && !pathname.includes(".")) {
        // Rediriger vers la page de tarifs
        return NextResponse.redirect(new URL("/pricing?subscription_required=true", req.url));
      }
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








