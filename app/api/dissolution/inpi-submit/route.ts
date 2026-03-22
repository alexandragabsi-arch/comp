import { NextRequest, NextResponse } from "next/server";

const GU_BASE =
  process.env.INPI_ENV === "demo"
    ? "https://guichet-unique-demo.inpi.fr/api"
    : "https://guichet-unique.inpi.fr/api";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface InpiSubmitRequest {
  /** Credentials compte e-procedures.inpi.fr */
  inpiUsername: string;
  inpiPassword: string;
  /** Données société */
  siren: string;
  companyName: string;
  formeJuridique: string;
  siegeSocial: string; // "69 RUE GORGE DE LOUP 69009 LYON"
  codePostal: string;
  ville: string;
  /** Dissolution */
  dateDissolution: string; // "DD/MM/YYYY"
  liquidateurNom: string;
  liquidateurPrenom: string;
  liquidateurAdresse: string;
  liquidateurCodePostal: string;
  liquidateurVille: string;
  /** PV signé en base64 (PDF) */
  pvBase64: string;
  /** Référence interne LegalCorners */
  reference?: string;
}

interface InpiSubmitResult {
  step: "auth" | "formality" | "attachment" | "done" | "error";
  formalityId?: number;
  liasseNumber?: string;
  message: string;
  portalUrl?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Convertit "DD/MM/YYYY" → "YYYY-MM-DD" */
function toIsoDate(d: string): string {
  const [day, month, year] = d.split("/");
  return `${year}-${month}-${day}`;
}

/** Parse adresse libre → { numVoie, typeVoie, voie, codePostal, commune } */
function parseAdresse(adresse: string, cpOverride?: string, villeOverride?: string) {
  // Ex: "69 RUE GORGE DE LOUP 69009 LYON"
  const match = adresse.match(/^(\d+)?\s*(.+?)\s+(\d{5})\s+(.+)$/);
  return {
    numVoie: match?.[1] ?? "",
    voie: match?.[2] ?? adresse,
    codePostal: cpOverride ?? match?.[3] ?? "",
    commune: villeOverride ?? match?.[4] ?? "",
    pays: "France",
    codePays: "FRA",
  };
}

// ── Authentification ────────────────────────────────────────────────────────────
async function authenticate(username: string, password: string): Promise<{
  token: string;
  cookieHeader: string;
}> {
  const res = await fetch(`${GU_BASE}/user/login/sso`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Échec authentification INPI (${res.status}): ${txt}`);
  }

  const data = await res.json();

  // Cas "API only" → token dans le body
  if (data.token) {
    return { token: data.token, cookieHeader: "" };
  }

  // Cas utilisateur web → token dans cookie BEARER
  const setCookie = res.headers.get("set-cookie") ?? "";
  const bearerMatch = setCookie.match(/BEARER=([^;]+)/);
  if (!bearerMatch) {
    throw new Error("Token INPI introuvable dans la réponse (cookie BEARER manquant).");
  }
  return { token: bearerMatch[1], cookieHeader: `BEARER=${bearerMatch[1]}` };
}

// ── Création de la formalité de cessation ──────────────────────────────────────
async function createFormality(
  token: string,
  cookieHeader: string,
  req: InpiSubmitRequest
): Promise<{ id: number; liasseNumber: string }> {
  const adresseSiege = parseAdresse(req.siegeSocial, req.codePostal, req.ville);
  const adresseLiq = parseAdresse(
    req.liquidateurAdresse,
    req.liquidateurCodePostal,
    req.liquidateurVille
  );
  const dateDissIso = toIsoDate(req.dateDissolution);

  // Schéma cessation personne morale (typeFormalite = "R")
  // cf. https://guichet-unique.inpi.fr/data pour dictionnaire complet
  const body = {
    companyName: req.companyName,
    referenceMandataire: req.reference ?? `LC-${req.siren}-${Date.now()}`,
    nomDossier: `Dissolution ${req.companyName}`,
    typeFormalite: "R",   // R = Radiation / Cessation
    typePersonne: "PM",   // PM = Personne Morale
    numNat: req.siren,
    diffusionINSEE: "O",
    indicateruEntreeSortieRegistre: true,
    content: {
      personneMorale: {
        // Identité
        identite: {
          entreprise: {
            siren: req.siren,
            denomination: req.companyName,
            formeJuridique: req.formeJuridique,
          },
        },
        // Adresse du siège
        etablissementPrincipal: {
          descriptionEtablissement: {
            rolePourEntreprise: "2", // 2 = siège + établissement principal
            adresse: {
              pays: adresseSiege.pays,
              codePays: adresseSiege.codePays,
              codePostal: adresseSiege.codePostal,
              commune: adresseSiege.commune,
              voie: adresseSiege.voie,
              numVoie: adresseSiege.numVoie,
            },
          },
        },
        // Dissolution / Cessation
        dissolution: {
          dateDissolution: dateDissIso,
          causeDissolution: "autres",
          // Liquidateur
          liquidateur: {
            individu: {
              nom: req.liquidateurNom,
              prenom: req.liquidateurPrenom,
              adresse: {
                pays: adresseLiq.pays,
                codePays: adresseLiq.codePays,
                codePostal: adresseLiq.codePostal,
                commune: adresseLiq.commune,
                voie: adresseLiq.voie,
                numVoie: adresseLiq.numVoie,
              },
            },
          },
        },
        // PV en pièce jointe
        piecesJointes: [
          {
            nomDocument: `PV_Dissolution_${req.siren}.pdf`,
            typeDocument: "PJ_11", // PJ_11 = PV signé
            langueDocument: "Français",
            documentBase64: req.pvBase64,
            documentExtension: "pdf",
          },
        ],
      },
    },
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  if (cookieHeader) headers["Cookie"] = cookieHeader;

  const res = await fetch(`${GU_BASE}/formalities`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Échec création formalité INPI (${res.status}): ${txt}`);
  }

  const data = await res.json();
  return { id: data.id, liasseNumber: data.liasseNumber ?? "" };
}

// ── Route principale ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest): Promise<NextResponse<InpiSubmitResult>> {
  const req: InpiSubmitRequest = await request.json();

  if (!req.inpiUsername || !req.inpiPassword) {
    return NextResponse.json(
      { step: "error", message: "Identifiants INPI manquants." },
      { status: 400 }
    );
  }

  // 1. Authentification
  let token: string;
  let cookieHeader: string;
  try {
    ({ token, cookieHeader } = await authenticate(req.inpiUsername, req.inpiPassword));
  } catch (err) {
    return NextResponse.json(
      { step: "auth", message: err instanceof Error ? err.message : "Erreur authentification INPI." },
      { status: 401 }
    );
  }

  // 2. Création formalité
  let formalityId: number;
  let liasseNumber: string;
  try {
    ({ id: formalityId, liasseNumber } = await createFormality(token, cookieHeader, req));
  } catch (err) {
    return NextResponse.json(
      { step: "formality", message: err instanceof Error ? err.message : "Erreur création formalité INPI." },
      { status: 500 }
    );
  }

  // Succès — retourne l'ID et l'URL du portail pour la suite (signature + paiement)
  const portalUrl =
    (process.env.INPI_ENV === "demo"
      ? "https://procedures-demo.inpi.fr"
      : "https://procedures.inpi.fr") +
    `/?/formalite/${formalityId}`;

  return NextResponse.json({
    step: "done",
    formalityId,
    liasseNumber,
    message: `Formalité déposée avec succès (n° ${liasseNumber || formalityId}). Rendez-vous sur le portail INPI pour signer et payer.`,
    portalUrl,
  });
}
