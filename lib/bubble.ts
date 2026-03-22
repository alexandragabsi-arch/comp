/**
 * Récupère les dossiers d'un client depuis Bubble via l'API Data.
 *
 * Configuration requise dans .env :
 *   BUBBLE_API_KEY   = clé API Bubble (token "backend")
 *   BUBBLE_APP_URL   = https://legalcorners.fr
 *
 * Champs Bubble Dossier utilisés (vérifiés en Data tab) :
 *   User            → email du client (filtre principal)
 *   OS_Statut       → statut du dossier ("En cours", "Complété"…)
 *   Type            → "Création de société"
 *   Référence       → "LC-2026-000003"
 *   Step_dossier    → étape courante
 *   Created Date    → date de création
 */

export interface BubbleDossier {
  id: string;
  company_name: string;
  siren: string;
  type: string;
  status: string;
  reference: string;
  forme_juridique: string;  // ex: "sasu", "sarl"
  step: string;
  created_at: string;
  bubble_url?: string;
}

// Mapping OS_Statut Bubble → statut unifié dashboard
const STATUS_MAP: Record<string, string> = {
  "en cours":       "en_cours",
  "complété":       "termine",
  "terminé":        "termine",
  "signé":          "signe",
  "déposé":         "depose_inpi",
  "en attente":     "en_cours",
  "action requise": "erreur",
};

export async function getBubbleDossiers(userEmail: string): Promise<BubbleDossier[]> {
  const apiKey = process.env.BUBBLE_API_KEY;
  const appUrl = process.env.BUBBLE_APP_URL ?? "https://legalcorners.fr";

  if (!apiKey) return [];

  try {
    // Filtre : User = email du client connecté
    const url = new URL(`${appUrl}/version-live/api/1.1/obj/Dossier`);
    url.searchParams.set(
      "constraints",
      JSON.stringify([
        { key: "User", constraint_type: "equals", value: userEmail },
      ])
    );
    url.searchParams.set("sort_field", "Created Date");
    url.searchParams.set("descending", "true");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error("Bubble API error:", res.status, await res.text());
      return [];
    }

    const json = await res.json();
    const results: Record<string, unknown>[] = json?.response?.results ?? [];

    return results.map((r) => {
      const statut = ((r["OS_Statut"] as string) ?? "").toLowerCase().trim();
      const formeJuridique = ((r["Questionnaire"] as string) ?? "").toUpperCase();
      const ref = (r["Référence"] as string) ?? "";
      return {
        id: r._id as string,
        // Nom affiché = "SASU · LC-2026-000003" (le nom réel est dans les réponses du questionnaire)
        company_name: formeJuridique ? `${formeJuridique} · ${ref}` : ref || "Dossier LegalCorners",
        siren: "",
        type: "creation",
        status: STATUS_MAP[statut] ?? "en_cours",
        reference: ref,
        forme_juridique: formeJuridique,
        step: (r["Step_dossier"] as string) ?? "",
        created_at: (r["Created Date"] as string) ?? new Date().toISOString(),
        bubble_url: `${appUrl}/dossier/${r._id as string}`,
      };
    });
  } catch (e) {
    console.error("Erreur getBubbleDossiers:", e);
    return [];
  }
}
