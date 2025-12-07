import Stripe from "stripe";

// Initialiser Stripe avec la clé secrète
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
  typescript: true
});

// Prix des abonnements (à configurer dans Stripe Dashboard)
export const STRIPE_PRICES = {
  // Créateur de contenu : 4,99€/mois (promo, anciennement 9,99€)
  CREATOR_MONTHLY: process.env.STRIPE_PRICE_CREATOR_MONTHLY!,
  
  // Graphiste/Monteur : 9,99€/mois
  DESIGNER_MONTHLY: process.env.STRIPE_PRICE_DESIGNER_MONTHLY!
};

// URLs de redirection
export const getStripeUrls = (origin: string) => ({
  success: `${origin}/dashboard?payment=success`,
  cancel: `${origin}/pricing?payment=cancelled`
});
