import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — Liste des RDV avocats
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("dossiers")
      .select("*")
      .eq("type", "creation-sasu")
      .not("answers->rdv_date", "is", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const rdvs = (data || []).map((d) => {
      const answers = typeof d.answers === "string" ? JSON.parse(d.answers) : (d.answers || {});
      return {
        id: d.id,
        nom: answers.rdv_nom || answers.associe_nom || "",
        prenom: answers.rdv_prenom || answers.associe_prenom || "",
        email: answers.rdv_email || d.email || "",
        telephone: answers.rdv_telephone || "",
        date: answers.rdv_date || "",
        heure: answers.rdv_heure || "",
        societe: answers.nom_societe || d.company_name || "",
        formule: answers.formule || "",
        status: d.status || "pending",
        created_at: d.created_at,
      };
    }).filter((r) => r.date);

    return NextResponse.json({ rdvs });
  } catch (err) {
    console.error("Erreur récupération RDV avocats:", err);
    return NextResponse.json({ rdvs: [], error: String(err) });
  }
}

// PATCH — Mettre à jour le statut d'un RDV
export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: "id et status requis" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("dossiers")
      .update({ status })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erreur mise à jour RDV:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
