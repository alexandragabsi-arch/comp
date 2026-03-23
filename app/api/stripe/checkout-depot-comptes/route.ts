import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const PRODUCTS = {
  essentiel: {
    name: "LegalCorners — Dépôt des comptes Essentiel",
    amount: 11880, // 99€ HT × 1.20 = 118.80€ TTC
    description: "PV d'approbation des comptes généré, dossier greffe pré-rempli",
  },
  standard: {
    name: "LegalCorners — Dépôt des comptes Standard",
    amount: 17880, // 149€ HT × 1.20 = 178.80€ TTC
    description: "Vérification formaliste, envoi au greffe, accompagnement email",
  },
  premium: {
    name: "LegalCorners — Dépôt des comptes Premium",
    amount: 23880, // 199€ HT × 1.20 = 238.80€ TTC
    description: "Accompagnement expert illimité, traitement prioritaire 48h",
  },
};

// Frais de greffe obligatoires (TTC = HT × 1.20)
const FRAIS_GREFFE = [
  { name: "Frais de dépôt au greffe", amount: 5372 }, // 44,77€ HT × 1.20
];

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
        ...FRAIS_GREFFE.map((f) => ({
          price_data: {
            currency: "eur",
            product_data: {
              name: f.name,
              description: "Frais légaux obligatoires",
            },
            unit_amount: f.amount,
            tax_behavior: "inclusive" as const,
          },
          quantity: 1,
        })),
      ],
      mode: "payment",
      metadata: { type: "depot_comptes", formule },
      success_url: `${baseUrl}/depot-comptes?payment=success&session_id={CHECKOUT_SESSION_ID}&state=${stateKey}&formule=${formule}`,
      cancel_url: `${baseUrl}/depot-comptes?payment=cancel&formule=${formule}`,
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
