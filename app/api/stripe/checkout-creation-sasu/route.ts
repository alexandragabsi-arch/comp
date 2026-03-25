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

// Options supplémentaires (montants TTC en centimes)
const OPTIONS: Record<string, { name: string; amount: number; description: string }> = {
  fermeture_micro: {
    name: "Fermeture micro-entreprise",
    amount: 10680, // 89€ HT × 1.20 = 106.80€ TTC
    description: "Fermeture de votre micro-entreprise auprès de l'URSSAF",
  },
  activite_artisanale: {
    name: "Immatriculation CMA (activité artisanale)",
    amount: 9480, // 79€ HT × 1.20 = 94.80€ TTC
    description: "Inscription au Répertoire des Métiers auprès de la Chambre de Métiers et de l'Artisanat",
  },
  brand_france: {
    name: "Protection de marque — France (INPI)",
    amount: 32280, // 269€ HT × 1.20 = 322.80€ TTC
    description: "Dépôt de marque nationale auprès de l'INPI (1 classe incluse)",
  },
  brand_eu: {
    name: "Protection de marque — Union européenne (EUIPO)",
    amount: 114000, // 950€ HT × 1.20 = 1140€ TTC
    description: "Dépôt de marque européenne auprès de l'EUIPO (1 classe incluse)",
  },
  brand_international: {
    name: "Protection de marque — International (OMPI)",
    amount: 138000, // 1150€ HT × 1.20 = 1380€ TTC
    description: "Dépôt de marque internationale auprès de l'OMPI",
  },
};

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });

  try {
    const { formule, stateKey, options } = await request.json();

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

    // Build line items: formule + options choisies
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
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
    ];

    // Ajouter les options sélectionnées par le client
    const selectedOptions: string[] = Array.isArray(options) ? options : [];
    for (const optId of selectedOptions) {
      const opt = OPTIONS[optId];
      if (opt) {
        lineItems.push({
          price_data: {
            currency: "eur",
            product_data: {
              name: opt.name,
              description: opt.description,
            },
            unit_amount: opt.amount,
            tax_behavior: "inclusive",
          },
          quantity: 1,
        });
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      allow_promotion_codes: true,
      line_items: lineItems,
      mode: "payment",
      metadata: {
        type: "creation-sasu",
        formule,
        options: selectedOptions.join(","),
      },
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
