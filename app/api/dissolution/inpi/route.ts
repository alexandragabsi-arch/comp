import { NextRequest, NextResponse } from "next/server";

const INPI_BASE = "https://guichet-unique.inpi.fr/api";

interface JustifFile {
  name: string;
  base64: string;
  size: number;
}

async function loginInpi(): Promise<{ token: string; cookie: string }> {
  const username = process.env.INPI_USERNAME;
  const password = process.env.INPI_PASSWORD;
  if (!username || !password) throw new Error("Identifiants INPI manquants");

  const res = await fetch(`${INPI_BASE}/user/login/sso`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Authentification INPI échouée (${res.status}): ${txt}`);
  }

  const data = await res.json();
  const token: string = data.token || data.access_token || data.jwt || "";
  const cookie = res.headers.get("set-cookie") || "";
  if (!token) throw new Error("Token INPI introuvable");
  return { token, cookie };
}

async function uploadDocument(
  token: string,
  cookie: string,
  formaliteId: string,
  file: JustifFile,
  typeCode: string
) {
  const res = await fetch(`${INPI_BASE}/formalities/${formaliteId}/attachments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Cookie: cookie,
    },
    body: JSON.stringify({
      nom: file.name,
      type: typeCode,
      contenu: file.base64,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.warn(`Upload pièce ${typeCode} échoué (${res.status}): ${txt}`);
  }
}

/**
 * Pièces justificatives par situation de dissolution :
 *
 * associe_unique / EURL/SASU :
 *   - pvDissolution → DECISION_ASSOCIE_UNIQUE (DAS signé)
 *   - attestationAL → ATTESTATION_ANNONCE_LEGALE
 *   - identiteLiquidateur? → PIECE_IDENTITE
 *
 * unanimite (tous associés) :
 *   - pvDissolution → PV_ASSEMBLEE (PV signé)
 *   - attestationAL → ATTESTATION_ANNONCE_LEGALE
 *   - identiteLiquidateur? → PIECE_IDENTITE
 *
 * age (AGE) :
 *   - pvDissolution → PV_ASSEMBLEE
 *   - convocation → CONVOCATION
 *   - feuillePresence → FEUILLE_PRESENCE
 *   - attestationAL → ATTESTATION_ANNONCE_LEGALE
 *   - identiteLiquidateur? → PIECE_IDENTITE
 */
function getDocTypeMap(decisionType: string, phase: "dissolution" | "liquidation"): Record<string, string> {
  if (phase === "dissolution") {
    const base: Record<string, string> = {
      attestationAL: "ATTESTATION_ANNONCE_LEGALE",
      identiteLiquidateur: "PIECE_IDENTITE",
    };
    if (decisionType === "associe_unique") {
      return { pvDissolution: "DECISION_ASSOCIE_UNIQUE", ...base };
    } else if (decisionType === "unanimite") {
      return { pvDissolution: "PV_ASSEMBLEE", ...base };
    } else {
      // age
      return {
        pvDissolution: "PV_ASSEMBLEE",
        convocation: "CONVOCATION",
        feuillePresence: "FEUILLE_PRESENCE",
        ...base,
      };
    }
  } else {
    // phase liquidation
    const base: Record<string, string> = {
      comptesLiquidation: "COMPTES_LIQUIDATION",
      attestationALCloture: "ATTESTATION_ANNONCE_LEGALE_CLOTURE",
    };
    if (decisionType === "associe_unique") {
      return { pvLiquidation: "DECISION_ASSOCIE_UNIQUE_CLOTURE", ...base };
    } else if (decisionType === "unanimite") {
      return { pvLiquidation: "PV_ASSEMBLEE_CLOTURE", ...base };
    } else {
      // age
      return {
        pvLiquidation: "PV_ASSEMBLEE_CLOTURE",
        convocation: "CONVOCATION_CLOTURE",
        feuillePresence: "FEUILLE_PRESENCE_CLOTURE",
        ...base,
      };
    }
  }
}

function buildDissolutionPayload(body: {
  siren: string;
  formeJuridique: string;
  companyName: string;
  capital: string;
  siegeSocial: string;
  dateDissolution: string;
  decisionType: string;
  liquidateur: {
    type: string;
    nom?: string;
    prenom?: string;
    adresse?: string;
    societeNom?: string;
    societeRCSVille?: string;
    societeRCSNumero?: string;
  };
  phase: "dissolution" | "liquidation";
}) {
  return {
    formeExercice: body.formeJuridique,
    siren: body.siren,
    content: {
      formeJuridique: body.formeJuridique,
      denomination: body.companyName,
      capital: body.capital,
      adresseSiege: body.siegeSocial,
      typeModification: body.phase === "dissolution" ? "DISSOLUTION" : "RADIATION",
      dissolution: {
        date: body.dateDissolution,
        typeDissolution: "AMIABLE",
        typeDecision: body.decisionType === "age" ? "AGE"
          : body.decisionType === "unanimite" ? "UNANIMITE"
            : "ASSOCIE_UNIQUE",
        liquidateur:
          body.liquidateur.type === "personne"
            ? {
                typePersonne: "PERSONNE_PHYSIQUE",
                nom: body.liquidateur.nom ?? "",
                prenom: body.liquidateur.prenom ?? "",
                adresse: body.liquidateur.adresse ?? "",
              }
            : {
                typePersonne: "PERSONNE_MORALE",
                denomination: body.liquidateur.societeNom ?? "",
                siren: body.liquidateur.societeRCSNumero ?? "",
                rcsVille: body.liquidateur.societeRCSVille ?? "",
              },
      },
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Authentification
    const { token, cookie } = await loginInpi();

    // 2. Création de la formalité
    const payload = buildDissolutionPayload(body);
    const createRes = await fetch(`${INPI_BASE}/formalities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Cookie: cookie,
      },
      body: JSON.stringify(payload),
    });

    if (!createRes.ok) {
      const txt = await createRes.text();
      throw new Error(`Création formalité INPI échouée (${createRes.status}): ${txt}`);
    }

    const formalite = await createRes.json();
    const formaliteId: string = formalite.id || formalite.formaliteId || formalite.dossierId || "";
    if (!formaliteId) throw new Error("Identifiant de formalité introuvable");

    // 3. Upload des pièces justificatives (adaptées selon situation)
    const docTypeMap = getDocTypeMap(body.decisionType, body.phase ?? "dissolution");
    const justifFiles: Partial<Record<string, JustifFile>> = body.justifFiles || {};

    for (const [key, typeCode] of Object.entries(docTypeMap)) {
      const file = justifFiles[key];
      if (file) {
        await uploadDocument(token, cookie, formaliteId, file, typeCode);
      }
    }

    // 4. Soumission
    const submitRes = await fetch(`${INPI_BASE}/formalities/${formaliteId}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Cookie: cookie,
      },
    });

    if (!submitRes.ok) {
      const txt = await submitRes.text();
      console.warn(`Soumission formalité échouée (${submitRes.status}): ${txt}`);
      return NextResponse.json({
        dossierId: formaliteId,
        message: `Dossier créé (n° ${formaliteId}) mais non soumis. Finalisez sur guichet-unique.inpi.fr.`,
      });
    }

    return NextResponse.json({
      dossierId: formaliteId,
      message: `Formalité déposée avec succès sur le Guichet Unique INPI (n° ${formaliteId}).`,
    });
  } catch (err) {
    console.error("Erreur INPI dissolution:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
