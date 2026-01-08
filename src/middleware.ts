import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Cache léger côté client (cookie) pour éviter un check DB à chaque navigation.
// But: réduire la latence tout en restant robuste si le token NextAuth est "stale".
const SUB_CACHE_COOKIE = "creax_sub_active_until"; // unix ms
const SUB_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const COOKIE_SECURE = process.env.NODE_ENV === "production";

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

    // Fast path: si le token sait déjà que l'utilisateur est abonné, ne pas re-taper la DB.
    const tokenSaysActive =
      (token as { hasActiveSubscription?: boolean })?.hasActiveSubscription === true;

    // Cache cookie (set par le middleware après un check DB positif)
    const cachedUntilRaw = req.cookies.get(SUB_CACHE_COOKIE)?.value;
    const cachedUntil = cachedUntilRaw ? Number(cachedUntilRaw) : 0;
    const cookieSaysActive = Number.isFinite(cachedUntil) && cachedUntil > Date.now();

    let hasActiveSubscription = tokenSaysActive || cookieSaysActive;

    // Slow path: seulement si on n'a aucun signal "actif" (token/cookie),
    // on vérifie la DB (source de vérité) via l'API interne.
    // Objectif: éviter un round-trip DB sur chaque navigation.
    if (!hasActiveSubscription) {
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
        // ignore - fallback token/cookie (déjà faux)
      }
    }

    // Si on vient de détecter un abonnement actif (via DB) et qu'on n'avait pas de cookie valide,
    // on va poser le cookie sur la réponse finale (next/redirect) pour les requêtes suivantes.
    const shouldSetSubCookie = hasActiveSubscription && !cookieSaysActive && !tokenSaysActive;
    const subCookieValue = String(Date.now() + SUB_CACHE_TTL_MS);

    // Accès à /subscribe:
    // - si déjà abonné => on ne veut plus voir la paywall
    // - sinon => laisser la page s'afficher
    if (pathname === "/subscribe" || pathname.startsWith("/subscribe/")) {
      if (hasActiveSubscription) {
        const response = NextResponse.redirect(new URL("/dashboard", req.url));
        if (shouldSetSubCookie) {
          response.cookies.set(SUB_CACHE_COOKIE, subCookieValue, {
            httpOnly: true,
            sameSite: "lax",
            secure: COOKIE_SECURE,
            path: "/"
          });
        }
        return response;
      }
      const response = NextResponse.next();
      // Si pas abonné, on ne set pas de cookie "actif"
      return response;
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

    const response = NextResponse.next();
    if (shouldSetSubCookie) {
      response.cookies.set(SUB_CACHE_COOKIE, subCookieValue, {
        httpOnly: true,
        sameSite: "lax",
        secure: COOKIE_SECURE,
        path: "/"
      });
    }
    return response;
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
     * - api (API routes) -> évite de rajouter une latence sur chaque action
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|uploads|api).*)"
  ]
};










