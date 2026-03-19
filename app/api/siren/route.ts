import { NextRequest, NextResponse } from "next/server";

const NATURE_JURIDIQUE: Record<string, string> = {
  "1000": "Entrepreneur individuel",
  "2110": "Indivision",
  "2120": "Société créée de fait",
  "2210": "Association déclarée",
  "5306": "SA",
  "5307": "SA",
  "5308": "SA",
  "5385": "SA",
  "5410": "EURL",
  "5415": "SARL",
  "5499": "SARL",
  "5505": "SA",
  "5510": "SA",
  "5515": "SA",
  "5520": "SA",
  "5599": "SA",
  "5605": "SCA",
  "5610": "SCA",
  "5615": "SCA",
  "5620": "SCA",
  "5699": "SCA",
  "5710": "SAS",
  "5720": "SASU",
  "5785": "SAS",
  "5799": "SAS",
  "5900": "SNC",
  "6100": "SNC",
  "6210": "SCOP",
  "6316": "SCI",
  "6317": "SCI",
  "6318": "SCI",
  "6411": "SCI",
  "6540": "SCI",
  "6541": "SCI",
  "6542": "SCI",
  "9220": "Association",
};

function getFormeJuridique(code: string): string {
  return NATURE_JURIDIQUE[code] || code || "";
}

function buildAddress(siege: Record<string, string>): string {
  const parts = [
    siege.numero_voie,
    siege.indice_repetition,
    siege.type_voie,
    siege.libelle_voie,
  ].filter(Boolean);
  return parts.join(" ").trim();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siren = searchParams.get("siren");
  const nom = searchParams.get("nom");
  const list = searchParams.get("list");

  try {
    if (siren) {
      // Recherche directe par SIREN
      const res = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${siren}&per_page=1`,
        { headers: { Accept: "application/json" } }
      );

      if (!res.ok) {
        return NextResponse.json({ error: "SIREN non trouvé" }, { status: 404 });
      }

      const data = await res.json();
      const result = data.results?.[0];

      if (!result || result.siren !== siren) {
        return NextResponse.json({ error: "SIREN non trouvé" }, { status: 404 });
      }

      const siege = result.siege || {};

      // Essayer de récupérer le capital social depuis l'API annuaire si absent
      let capitalSocial = result.capital_social ? String(result.capital_social) : "";
      if (!capitalSocial) {
        try {
          const annuaireRes = await fetch(
            `https://api.annuaire-entreprises.data.gouv.fr/entreprise/${siren}`,
            { headers: { Accept: "application/json" } }
          );
          if (annuaireRes.ok) {
            const annuaireData = await annuaireRes.json();
            if (annuaireData.capital_social) {
              capitalSocial = String(annuaireData.capital_social);
            }
          }
        } catch {
          // Ignore fallback error
        }
      }

      return NextResponse.json({
        denominationSociale: result.nom_raison_sociale || result.nom_complet || "",
        formeJuridique: getFormeJuridique(result.nature_juridique || ""),
        siegeSocial: buildAddress(siege),
        codePostal: siege.code_postal || "",
        ville: siege.libelle_commune || "",
        capitalSocial,
        siren: result.siren || siren,
      });
    }

    if (nom && list) {
      // Recherche par nom - retourne une liste
      const res = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(nom)}&per_page=10`,
        { headers: { Accept: "application/json" } }
      );

      if (!res.ok) {
        return NextResponse.json({ resultats: [] }, { status: 200 });
      }

      const data = await res.json();
      const results = data.results || [];

      const resultats = results.map((r: Record<string, unknown>) => ({
        siren: r.siren,
        nom: r.nom_raison_sociale || r.nom_complet || "",
        ville: (r.siege as Record<string, string>)?.libelle_commune || "",
      }));

      return NextResponse.json({ resultats });
    }

    return NextResponse.json({ error: "Paramètre manquant" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
