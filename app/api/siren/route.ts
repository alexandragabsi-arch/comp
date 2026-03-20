import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.PAPPERS_API_KEY!;
const BASE = "https://api.pappers.fr/v2";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siren = searchParams.get("siren");
  const nom   = searchParams.get("nom");
  const list  = searchParams.get("list");

  try {
    /* ── Recherche par SIREN ─────────────────────────────────── */
    if (siren) {
      const res = await fetch(
        `${BASE}/entreprise?siren=${siren}&api_token=${API_KEY}`,
        { headers: { Accept: "application/json" } }
      );

      if (!res.ok) {
        return NextResponse.json({ error: "SIREN non trouvé" }, { status: 404 });
      }

      const d = await res.json();

      // Adresse siège
      const siege = d.siege ?? {};
      const adresseParts = [
        siege.adresse_ligne_1,
        siege.adresse_ligne_2,
      ].filter(Boolean);
      const siegeSocial = adresseParts.join(", ");

      // Dirigeants (pour auto-complétion du représentant)
      const dirigeants: { nom: string; prenom: string; qualite: string }[] = (
        d.dirigeants ?? []
      ).map((dir: Record<string, string>) => ({
        nom:     dir.nom      ?? "",
        prenom:  dir.prenom   ?? "",
        qualite: dir.titre    ?? dir.qualite ?? "",
      }));

      // Associés (pour remplir les parts)
      const associes: { nom: string; prenom: string; nbParts: number }[] = (
        d.associes ?? []
      ).map((a: Record<string, string | number>) => ({
        nom:     String(a.nom    ?? ""),
        prenom:  String(a.prenom ?? ""),
        nbParts: Number(a.nombre_parts ?? 0),
      }));

      return NextResponse.json({
        denominationSociale: d.denomination ?? d.nom_entreprise ?? "",
        formeJuridique:      d.forme_juridique ?? "",
        siegeSocial,
        codePostal: siege.code_postal     ?? "",
        ville:      siege.ville           ?? "",
        capitalSocial: d.capital ? String(d.capital) : "",
        siren:      d.siren ?? siren,
        greffe:     d.greffe              ?? "",
        rcs:        d.numero_rcs          ?? "",
        dirigeants,
        associes,
      });
    }

    /* ── Recherche par nom (suggestions) ─────────────────────── */
    if (nom && list) {
      const res = await fetch(
        `${BASE}/suggestions?q=${encodeURIComponent(nom)}&api_token=${API_KEY}&longueur=10`,
        { headers: { Accept: "application/json" } }
      );

      if (!res.ok) {
        return NextResponse.json({ resultats: [] });
      }

      const data = await res.json();
      // Pappers renvoie resultats_nom_entreprise, resultats_siren, etc.
      const suggestions: Record<string, unknown>[] = [
        ...(data.resultats_nom_entreprise ?? []),
        ...(data.resultats_siren          ?? []),
      ];

      const resultats = suggestions.map((s) => ({
        siren: s.siren,
        nom:   s.nom_entreprise ?? "",
        formeJuridique: s.forme_juridique ?? "",
        codePostal: (s.siege as Record<string, string>)?.code_postal ?? "",
        ville: (s.siege as Record<string, string>)?.ville ?? "",
      }));

      return NextResponse.json({ resultats });
    }

    return NextResponse.json({ error: "Paramètre manquant" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
