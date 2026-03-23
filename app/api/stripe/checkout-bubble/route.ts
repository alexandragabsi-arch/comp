import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * Endpoint appelé par Bubble pour créer une session de paiement Stripe.
 *
 * POST /api/stripe/checkout-bubble
 * Headers: Authorization: Bearer BUBBLE_API_KEY
 * Body: {
 *   product_name: string,       // ex: "Création EURL - Essentielle"
 *   product_description?: string,
 *   amount_ttc_cents: number,   // montant TTC en centimes (ex: 19900 = 199€)
 *   type: string,               // type interne (cession, dissolution, creation, etc.)
 *   formule?: string,           // ex: "essentielle", "premium"
 *   success_url: string,        // URL de redirection après paiement
 *   cancel_url: string,         // URL si annulation
 * }
 *
 * Returns: { url: string }
 */
export async function POST(request: NextRequest) {
  // Auth via clé API Bubble
  const auth = request.headers.get("authorization") ?? "";
  const apiKey = auth.replace("Bearer ", "").trim();
  if (!apiKey || apiKey !== process.env.BUBBLE_API_KEY) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });

  try {
    const {
      product_name,
      product_description,
      amount_ttc_cents,
      type,
      formule,
      success_url,
      cancel_url,
    } = await request.json();

    if (!product_name || !amount_ttc_cents || !success_url || !cancel_url) {
      return NextResponse.json(
        { error: "product_name, amount_ttc_cents, success_url et cancel_url sont requis" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      allow_promotion_codes: true,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: product_name,
              ...(product_description && { description: product_description }),
            },
            unit_amount: amount_ttc_cents,
            tax_behavior: "inclusive",
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        type: type ?? "creation",
        ...(formule && { formule }),
        source: "bubble",
      },
      success_url,
      cancel_url,
      locale: "fr",
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Stripe checkout-bubble error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur Stripe" },
      { status: 500 }
    );
  }
}
