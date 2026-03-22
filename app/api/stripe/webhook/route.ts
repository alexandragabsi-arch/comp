import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Mapping type interne → type Bubble
const BUBBLE_TYPE_MAP: Record<string, string> = {
  cession:                    "Cession de parts",
  dissolution:                "Dissolution / Liquidation",
  sommeil:                    "Mise en Sommeil",
  modification:               "Modification Statutaire",
  creation:                   "Création de société",
  creation_auto_entrepreneur: "Création Auto-entrepreneur/EI",
  modification_ae:            "Modification Auto-entrepreneur/EI",
};

async function getOrCreateUser(email: string): Promise<string | null> {
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const existing = usersData?.users?.find((u) => u.email === email);
  if (existing) return existing.id;

  const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (error || !newUser?.user) return null;
  return newUser.user.id;
}

async function notifyBubble(email: string, type: string, formule?: string) {
  const apiKey = process.env.BUBBLE_API_KEY;
  const appUrl = process.env.BUBBLE_APP_URL ?? "https://legalcorners.fr";
  if (!apiKey) return;

  try {
    await fetch(`${appUrl}/version-live/api/1.1/obj/Dossier`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        User: email,
        OS_Statut: "En cours",
        Type: BUBBLE_TYPE_MAP[type] ?? type,
        ...(formule && { Formule: formule }),
      }),
    });
  } catch (e) {
    console.error("Erreur création dossier Bubble:", e);
  }
}

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== "paid") {
      return NextResponse.json({ ok: true });
    }

    const email = session.customer_details?.email;
    const type = session.metadata?.type ?? "cession";
    const formule = session.metadata?.formule;
    const sessionId = session.id;

    if (!email) return NextResponse.json({ ok: true });

    // Éviter les doublons
    const { data: existing } = await supabaseAdmin
      .from("dossiers")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (existing) return NextResponse.json({ ok: true });

    // Trouver ou créer l'utilisateur Supabase
    const userId = await getOrCreateUser(email);
    if (!userId) {
      return NextResponse.json({ error: "Création user échouée" }, { status: 500 });
    }

    // Créer le dossier dans Supabase
    await supabaseAdmin.from("dossiers").insert({
      user_id: userId,
      company_name: "",
      siren: "",
      forme_juridique: "",
      type,
      status: "en_cours",
      stripe_session_id: sessionId,
      stripe_paid: true,
      data: { formule },
    });

    // Notifier Bubble
    await notifyBubble(email, type, formule);
  }

  return NextResponse.json({ ok: true });
}
