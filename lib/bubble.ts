/**
 * Récupère les dossiers d'un client depuis Bubble via l'API Data.
 *
 * Configuration requise dans .env :
 *   BUBBLE_API_KEY         = clé API Bubble (admin token)
 *   BUBBLE_APP_URL         = ex: https://legalcorners.bubbleapps.io
 *   BUBBLE_DOSSIER_TYPE    = nom du type de données dans Bubble, ex: "dossier_creation"
 *
 * L'utilisateur Bubble est identifié par son email (commun avec Supabase).
 */

export interface BubbleDossier {
  id: string;
  company_name: string;
  siren: string;
  type: string;          // "creation" | etc.
  status: string;        // statut Bubble (à mapper)
  created_at: string;
  bubble_url?: string;   // lien vers le dossier dans Bubble
}

const STATUS_BUBBLE_MAP: Record<string, string> = {
  // Adaptez les noms de statuts selon votre app Bubble
  "en cours":   "en_cours",
  "complété":   "termine",
  "signé":      "signe",
  "déposé":     "depose_inpi",
  // Fallback
  "default":    "en_cours",
};

export async function getBubbleDossiers(userEmail: string): Promise<BubbleDossier[]> {
  const apiKey = process.env.BUBBLE_API_KEY;
  const appUrl = process.env.BUBBLE_APP_URL;
  const dataType = process.env.BUBBLE_DOSSIER_TYPE ?? "dossier";

  if (!apiKey || !appUrl) return [];

  try {
    // API Data Bubble : filtre sur l'email du client
    const url = new URL(`${appUrl}/api/1.1/obj/${dataType}`);
    url.searchParams.set("constraints", JSON.stringify([
      { key: "email_client", constraint_type: "equals", value: userEmail }
    ]));

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 60 }, // cache 60s
    });

    if (!res.ok) return [];
    const json = await res.json();
    const results = json?.response?.results ?? [];

    return results.map((r: Record<string, unknown>) => ({
      id: r._id as string,
      company_name: (r.nom_societe ?? r.denomination ?? r.company_name ?? "Société") as string,
      siren: (r.siren ?? "") as string,
      type: "creation",
      status: STATUS_BUBBLE_MAP[(r.statut as string)?.toLowerCase()] ?? "en_cours",
      created_at: (r["Created Date"] ?? r.created_date ?? new Date().toISOString()) as string,
      bubble_url: `${appUrl}/dossier/${r._id}`,
    }));
  } catch {
    return [];
  }
}
