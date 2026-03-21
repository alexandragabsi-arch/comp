import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const PRODUCTS = {
  starter: {
    name: "LegalCorners — Dissolution Starter",
    amount: 9480, // 79€ HT × 1.20 = 94.80€ TTC
    description: "Documents juridiques et formulaire M2 pré-rempli",
  },
  standard: {
    name: "LegalCorners — Dissolution Standard",
    amount: 23880, // 199€ HT × 1.20 = 238.80€ TTC
    description: "Vérification formaliste, envoi au greffe, accompagnement",
  },
  premium: {
    name: "LegalCorners — Dissolution Premium",
    amount: 29880, // 249€ HT × 1.20 = 298.80€ TTC
    description: "Accompagnement expert illimité, traitement prioritaire",
  },
  sommeil: {
    name: "LegalCorners — Mise en sommeil",
    amount: 11880, // 99€ HT × 1.20 = 118.80€ TTC
    description: "Vérification du dossier, assistance email et téléphone, enregistrement au greffe",
    fraisAnnexes: [
      { name: "Frais d'enregistrement au greffe", amount: 22148 }, // 184,57€ HT × 1.20
    ],
  },
};

// Frais légaux dissolution (TTC = HT × 1.20)
const FRAIS_DISSOLUTION = [
  { name: "Frais de dissolution au greffe", amount: 23521 },       // 196,01€ HT × 1.20
  { name: "Annonce légale de dissolution", amount: 18240 },         // 152€ HT × 1.20
  { name: "Annonce légale de liquidation", amount: 13200 },         // 110€ HT × 1.20
  { name: "Frais de liquidation au greffe", amount: 1672 },         // 13,93€ HT × 1.20
  { name: "Frais d'obtention Kbis", amount: 384 },                  // 3,20€ HT × 1.20
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

    const isSommeil = formule === "sommeil";
    const fraisAnnexes = isSommeil
      ? (product as typeof PRODUCTS.sommeil).fraisAnnexes
      : FRAIS_DISSOLUTION;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        // Pack principal
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
        // Frais légaux obligatoires
        ...fraisAnnexes.map((f) => ({
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
