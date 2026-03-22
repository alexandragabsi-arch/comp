import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Appelé par Bubble (backend workflow) pour générer un lien de connexion magique.
 *
 * POST /api/auth/bubble-link
 * Headers: Authorization: Bearer BUBBLE_API_KEY
 * Body: { email: "client@email.com", name?: "Jean Dupont" }
 *
 * Returns: { url: "https://..." }  → Bubble redirige l'utilisateur vers cette URL
 */
export async function POST(request: NextRequest) {
  // Vérification clé API Bubble
  const auth = request.headers.get("authorization") ?? "";
  const apiKey = auth.replace("Bearer ", "").trim();
  if (!apiKey || apiKey !== process.env.BUBBLE_API_KEY) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { email, name } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  // Client admin Supabase (service role — jamais exposé côté client)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://legalcorners.fr"}/auth/callback?next=/dashboard`;

  // Génère un lien magique (OTP email) — crée le compte si inexistant
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo,
      data: { role: "client", name: name ?? "" },
    },
  });

  if (error || !data?.properties?.action_link) {
    console.error("Erreur génération magic link:", error);
    return NextResponse.json(
      { error: "Impossible de générer le lien de connexion." },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: data.properties.action_link });
}
