import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin client (service role) — contourne RLS pour sauvegarder sans session
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SaveDossierPayload {
  email: string;           // email du client (pour retrouver/créer l'user Supabase)
  company_name: string;
  siren?: string;
  forme_juridique?: string;
  type: string;            // cession | dissolution | sommeil | modification | creation_auto_entrepreneur | fermeture_micro
  status?: string;         // brouillon | en_cours (défaut: en_cours)
  stripe_session_id?: string;
  stripe_paid?: boolean;
  data?: Record<string, unknown>; // données brutes du formulaire
}

export async function POST(req: NextRequest) {
  try {
    const body: SaveDossierPayload = await req.json();

    if (!body.email || !body.type) {
      return NextResponse.json({ error: "email et type requis" }, { status: 400 });
    }

    // 1. Retrouver l'utilisateur Supabase par email
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = usersData?.users?.find(u => u.email === body.email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // 2. Créer l'utilisateur s'il n'existe pas (sans mot de passe — magic link uniquement)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        email_confirm: true,
      });
      if (createError || !newUser?.user) {
        console.error("Erreur création user Supabase:", createError);
        return NextResponse.json({ error: "Impossible de créer l'utilisateur" }, { status: 500 });
      }
      userId = newUser.user.id;
    }

    // 3. Vérifier si un dossier identique existe déjà (évite les doublons)
    if (body.stripe_session_id) {
      const { data: existing } = await supabaseAdmin
        .from("dossiers")
        .select("id")
        .eq("stripe_session_id", body.stripe_session_id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ id: existing.id, already_exists: true });
      }
    }

    // 4. Insérer le dossier
    const { data: dossier, error } = await supabaseAdmin
      .from("dossiers")
      .insert({
        user_id: userId,
        company_name: body.company_name,
        siren: body.siren ?? "",
        forme_juridique: body.forme_juridique ?? "",
        type: body.type,
        status: body.status ?? "en_cours",
        stripe_session_id: body.stripe_session_id ?? null,
        stripe_paid: body.stripe_paid ?? false,
        data: body.data ?? {},
      })
      .select("id")
      .single();

    if (error) {
      console.error("Erreur insertion dossier:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: dossier.id });
  } catch (e) {
    console.error("Erreur /api/dossiers:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
