import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const PRODUCTS = {
  essentielle: {
    name: "LegalCorners — Création SASU Essentielle",
    amount: 16680, // 139€ HT × 1.20 = 166.80€ TTC en centimes
    description:
      "Statuts générés, préparation du dossier complet, envoi au greffe, accompagnement par mail",
  },
  premium: {
    name: "LegalCorners — Création SASU Premium",
    amount: 23880, // 199€ HT × 1.20 = 238.80€ TTC en centimes
    description:
      "Formule Essentielle + vérification par un juriste sous 24h + accompagnement téléphonique + garantie anti-rejet",
  },
  avocat: {
    name: "LegalCorners — Création SASU Avocat",
    amount: 102000, // 850€ HT × 1.20 = 1020€ TTC en centimes
    description:
      "Statuts rédigés sur mesure par un avocat, accompagnement complet jusqu'à l'immatriculation",
  },
};

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });

  try {
    const { formule, stateKey } = await request.json();

    if (!formule || !(formule in PRODUCTS)) {
      return NextResponse.json(
        { error: "Formule invalide" },
        { status: 400 }
      );
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
      metadata: { type: "creation-sasu", formule },
      success_url: `${baseUrl}/creation-sasu?payment=success&session_id={CHECKOUT_SESSION_ID}&formule=${formule}&state=${stateKey || ""}`,
      cancel_url: `${baseUrl}/creation-sasu?payment=cancel&formule=${formule}`,
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
