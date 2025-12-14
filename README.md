## CREAX – Plateforme SaaS créateurs & graphistes

CREAX est une plateforme de mise en relation entre **créateurs de contenu** et **graphistes/monteurs vidéo**, construite avec **Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL + Stripe + NextAuth**.

Ce projet est pensé pour être **production-ready**, avec :

- **Authentification sécurisée** (hash de mot de passe, email vérifié, sessions sécurisées, rate limiting basique)
- **Profils** (créateur / graphiste) et **recherche**
- **Messagerie** entre utilisateurs
- **Abonnements Stripe** (créateur & graphiste)
- UI moderne basée sur **Tailwind CSS** et palette bleu `#048B9A` / blanc.

---

## 1. Prérequis (sans jargon)

- Un ordinateur avec **Node.js 18+** installé  
  (tu peux vérifier avec : `node -v` dans le terminal)
- Un compte **PostgreSQL** (par exemple via [Supabase] ou [Vercel Postgres])
- Un compte **Stripe** (mode test) pour gérer les paiements
- Un compte **Vercel** pour héberger le site (recommandé)

Tu n’as pas besoin de savoir coder pour suivre les étapes ci-dessous, il suffit de copier/coller les commandes.

---

## 2. Installation en local (sur ton Mac)

### 2.1. Ouvrir le projet

Dans l’app **Terminal** :

```bash
cd /Users/yacineelfahim/CREAX
```

### 2.2. Installer les dépendances

```bash
npm install
```

Laisse le temps à la commande de s’exécuter (1re fois un peu longue).

---

## 3. Configuration des variables d’environnement

Next.js et les services externes (base de données, Stripe) utilisent des **variables d’environnement**.  
Tu vas les mettre dans un fichier `.env` (ou `.env.local`) à la racine du projet.

Crée un fichier `.env` dans `/Users/yacineelfahim/CREAX` et colle-y ce modèle, puis adapte les valeurs :

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/creax"

NEXTAUTH_SECRET="change-moi-par-une-longue-chaine-aleatoire"
NEXTAUTH_URL="http://localhost:3000"

STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
STRIPE_PRICE_CREATOR="price_xxx_creator"
STRIPE_PRICE_DESIGNER="price_xxx_designer"
```

- **DATABASE_URL** : fournie par Supabase ou ton hébergeur PostgreSQL (copier/coller l’URL complète).
- **NEXTAUTH_SECRET** : génère une chaîne aléatoire (tu peux utiliser `openssl rand -hex 32` dans le terminal).
- **NEXTAUTH_URL** : 
  - en local : `http://localhost:3000`
  - en production (Vercel) : `https://ton-domaine.vercel.app`
- **STRIPE_SECRET_KEY** : clé secrète Stripe en mode test (`sk_test_...`).
- **STRIPE_WEBHOOK_SECRET** : secret du webhook (créé dans le dashboard Stripe, voir plus bas).
- **STRIPE_PRICE_CREATOR** et **STRIPE_PRICE_DESIGNER** : IDs des prix d’abonnement dans Stripe.

> Tant que ces valeurs ne sont pas correctes, l’interface fonctionnera mais les paiements ne marcheront pas.

---

## 4. Base de données (Prisma + PostgreSQL)

1. Crée une base PostgreSQL (par ex. sur Supabase).
2. Récupère l’URL de connexion et mets-la dans `DATABASE_URL` de `.env`.
3. Dans le terminal (au niveau du projet) :

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Cela crée les tables nécessaires :

- `User`, `Profile`
- `Message`
- `Subscription`
- `EmailVerificationToken`

---

## 5. Lancer l’application en local

Dans le dossier du projet :

```bash
npm run dev
```

Puis ouvre ton navigateur sur : `http://localhost:3000`

Tu peux naviguer sur :

- `/` : page d’accueil, deux parcours (créateur / graphiste)
- `/signup` : inscription avec choix du rôle
- `/login` : connexion
- `/dashboard` : tableau de bord (protégé, nécessite connexion)
- `/profile` : profil utilisateur + infos publiques
- `/search` : recherche de profils avec filtres
- `/messages` : messagerie
- `/pricing` : page de tarification + bouton vers Stripe Checkout

En développement, la **vérification d’email** renvoie un `devVerificationToken` dans la réponse JSON d’inscription.  
Tu peux utiliser le bouton prévu sur la page d’inscription pour simuler la vérification.

---

## 6. Intégration Stripe (abonnements)

### 6.1. Créer les produits et prix

Dans ton dashboard Stripe (mode test) :

1. Crée un **Produit** “Abonnement créateur” avec un **Price** récurrent mensuel :
   - 4,99 € pour le premier mois (tu peux gérer la réduction via coupons ou un prix spécifique)
   - puis 9,99 €/mois (selon ta stratégie de pricing, tu peux n’avoir qu’un seul price à 9,99 € pour simplifier).
2. Crée un **Produit** “Abonnement graphiste” avec un **Price** récurrent mensuel :
   - 0 € le 1er mois (ou essai gratuit configuré dans Stripe)
   - puis 9,99 €/mois.

Récupère les **Price IDs** (du type `price_xxx`) et renseigne :

- `STRIPE_PRICE_CREATOR`
- `STRIPE_PRICE_DESIGNER`

dans ton fichier `.env`.

### 6.2. Webhook Stripe

Pour mettre à jour automatiquement les abonnements dans la base :

1. Dans Stripe, menu **Developers → Webhooks**.
2. Ajoute un endpoint :
   - URL en dev (via Stripe CLI) : `http://localhost:3000/api/billing/webhook`
   - URL en prod (Vercel) : `https://ton-domaine.vercel.app/api/billing/webhook`
3. Sélectionne au minimum les événements :
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copie le **signing secret** donné par Stripe (`whsec_xxx`) dans `STRIPE_WEBHOOK_SECRET` de `.env`.

En mode développement, tu peux utiliser la CLI Stripe :

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

---

## 7. Déploiement sur Vercel (recommandé)

1. Crée un compte sur Vercel.
2. Connecte ton dépôt Git (GitHub par exemple) contenant ce projet.
3. Lors de la création du projet Vercel :
   - Choisis le **framework Next.js** (détection automatique).
   - Ajoute toutes les variables d’environnement vues plus haut dans l’onglet **Settings → Environment Variables**.
4. Mets à jour `NEXTAUTH_URL` dans Vercel avec l’URL de production, par exemple :

```env
NEXTAUTH_URL="https://creax.vercel.app"
```

5. Redéploie si nécessaire.

Ta base PostgreSQL peut être :

- Soit hébergée chez Supabase / Railway / autre (seule la `DATABASE_URL` compte),
- Soit Vercel Postgres (Vercel fournit la `DATABASE_URL`).

---

## 8. Sécurité – mesures mises en place

- **Mots de passe hashés** avec `bcrypt` (jamais stockés en clair).
- **Vérification d’email** avant connexion (le compte doit être activé).
- **Sessions sécurisées** via NextAuth (cookies signés, CSRF inclus).
- **Rate limiting** :
  - Sur l’inscription (`/api/auth/register`) par IP.
  - Sur la messagerie (`/api/messages`) par IP (limite de messages/minute).
  - Sur la connexion via un compteur par email dans `authConfig`.
- **Pas de requêtes SQL brutes** : Prisma protège contre les injections SQL classiques.
- **XSS** : Next.js échappe par défaut le contenu rendu, et aucune zone n’utilise `dangerouslySetInnerHTML`.
- **CSRF** : les endpoints sensibles reposent sur la session NextAuth (cookies + protection CSRF intégrée).
- **Secrets en variables d’environnement** (Stripe, NextAuth, DB), jamais en dur dans le code.

> Pour une sécurité “entreprise”, il faudrait ajouter un WAF, un stockage rate-limit partagé (Redis), une gestion avancée des logs et une politique RGPD complète. Les fondations sont cependant en place.

---

## 9. Tests

Le projet inclut **Vitest** avec un test simple sur le rate limiting.

Pour lancer les tests :

```bash
npm run test
```

Les tests se trouvent dans :

- `src/lib/rate-limit.test.ts`

---

## 10. Résumé fonctionnel

- **Inscription / connexion :**
  - Choix du rôle (Créateur / Graphiste).
  - Email + mot de passe sécurisé (bcrypt).
  - Vérification email (token enregistré en base).
- **Profils :**
  - Créateur : type de contenu, besoins.
  - Graphiste : compétences, portfolio, tarifs, disponibilité.
- **Recherche :**
  - Filtre par rôle et texte (nom, bio, compétences, types de contenu).
- **Messagerie :**
  - Discussions entre deux utilisateurs.
  - Actualisation régulière (polling 5s) pour s’approcher du temps réel.
- **Abonnements :**
  - Page `/pricing` avec les deux offres.
  - Redirection vers Stripe Checkout.
  - Webhook pour synchroniser l’état des abonnements.

---

## 11. Ce que tu as à faire concrètement

1. Installer les dépendances : `npm install`.
2. Configurer `.env` (DB + NextAuth + Stripe).
3. Lancer Prisma : `npx prisma generate && npx prisma migrate dev --name init`.
4. Lancer le site : `npm run dev` puis aller sur `http://localhost:3000`.
5. Quand tout te convient, déployer sur Vercel en recopiant les mêmes variables d’environnement.

Si tu rencontres un message d’erreur précis dans le terminal ou dans le navigateur, tu peux me le copier, et je t’indiquerai exactement quoi faire, **sans jargon technique inutile**.















































