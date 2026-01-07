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
  async function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Fichiers statiques toujours accessibles
    if (pathname.startsWith("/_next") || pathname.includes(".")) {
      return NextResponse.next();
    }

    // Vérifier si la page nécessite un abonnement
    const canAccessWithoutSub = NO_SUBSCRIPTION_PAGES.some(page =>
      pathname === page || pathname.startsWith(page + "/")
    );

    // Si pas connecté, on laisse withAuth gérer la redirection (authorized=false)
    if (!token) {
      return NextResponse.next();
    }

    // Vérifier l'abonnement en DB (source de vérité).
    // Fallback: utiliser le token si le check échoue (évite de bloquer un utilisateur déjà abonné).
    let hasActiveSubscription = (token as { hasActiveSubscription?: boolean })?.hasActiveSubscription === true;

    try {
      const checkUrl = new URL("/api/subscription/check", req.nextUrl.origin);
      const res = await fetch(checkUrl, {
        method: "GET",
        headers: {
          cookie: req.headers.get("cookie") ?? "",
          "x-middleware-check": "true"
        },
        cache: "no-store"
      });

      if (res.ok) {
        const data = await res.json();
        hasActiveSubscription = data?.hasActiveSubscription === true;
      }
    } catch {
      // ignore - fallback token
    }

    // Accès à /subscribe:
    // - si déjà abonné => on ne veut plus voir la paywall
    // - sinon => laisser la page s'afficher
    if (pathname === "/subscribe" || pathname.startsWith("/subscribe/")) {
      if (hasActiveSubscription) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return NextResponse.next();
    }

    // Si on peut accéder sans abonnement (API auth/billing/subscription), laisser passer
    if (canAccessWithoutSub) {
      return NextResponse.next();
    }

    // Sinon, pages privées => abonnement requis
    if (!hasActiveSubscription) {
      const subscribeUrl = new URL("/subscribe", req.url);
      subscribeUrl.searchParams.set("from", "paywall");
      return NextResponse.redirect(subscribeUrl);
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










