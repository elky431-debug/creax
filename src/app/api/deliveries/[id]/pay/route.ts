/**
 * API pour payer une livraison via Stripe
 * 
 * POST /api/deliveries/[id]/pay - Créer une session de paiement Stripe
 */

import { NextResponse } from "next/server";

/**
 * POST - Créer une session de paiement pour une livraison
 */
export async function POST(
  _req: Request,
  _context: { params: { id: string } }
) {
  return NextResponse.json(
    { error: "Paiements désactivés sur CREIX. Utilisez un virement bancaire (hors plateforme)." },
    { status: 410 }
  );
}
