import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const PRODUCTS = {
  essentiel: {
    name: "LegalCorners — Dissolution Essentiel",
    amount: 19900, // 199€ TTC en centimes
    description: "PV de dissolution, formalités administratives",
  },
  premium: {
    name: "LegalCorners — Dissolution Premium",
    amount: 29900, // 299€ TTC en centimes
    description: "Formule Essentiel + vérification juriste + accompagnement téléphonique",
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
      success_url: `${baseUrl}/dissolution?payment=success&session_id={CHECKOUT_SESSION_ID}&state=${stateKey}&formule=${formule}`,
      cancel_url: `${baseUrl}/dissolution?payment=cancel&formule=${formule}`,
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
