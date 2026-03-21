import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const PRODUCTS = {
  essentiel: {
    name: "LegalCorners — Cession Essentiel",
    amount: 23880, // 199€ HT × 1.20 = 238.80€ TTC en centimes
    description: "Acte de cession, PV d'assemblée, registre des mouvements, formulaire fiscal",
  },
  premium: {
    name: "LegalCorners — Cession Premium",
    amount: 35880, // 299€ HT × 1.20 = 358.80€ TTC en centimes
    description: "Formule Essentiel + vérification par un juriste + accompagnement téléphonique",
  },
};

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });

  try {
    const { formule, stateKey } = await request.json();

    if (!formule || !(formule in PRODUCTS)) {
      return NextResponse.json({ error: "Formule invalide" }, { status: 400 });
    }

    const product = PRODUCTS[formule as keyof typeof PRODUCTS];
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : request.headers.get("origin") ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      allow_promotion_codes: true,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: product.amount,
            tax_behavior: "inclusive",
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/cession-parts?payment=success&session_id={CHECKOUT_SESSION_ID}&state=${stateKey}&formule=${formule}`,
      cancel_url: `${baseUrl}/cession-parts?payment=cancel&formule=${formule}`,
      locale: "fr",
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Stripe error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur Stripe" },
      { status: 500 }
    );
  }
}
