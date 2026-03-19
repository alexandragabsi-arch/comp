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
  if (!username || !password) throw new Error("Identifiants INPI manquants (INPI_USERNAME / INPI_PASSWORD)");

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

  if (!token) throw new Error("Token INPI introuvable dans la réponse");
  return { token, cookie };
}

function buildFormalitePayload(body: {
  siren: string;
  formeJuridique: string;
  denomination: string;
  capitalSocial: string;
  siegeAdresse: string;
  cedant: { type: string; nom?: string; prenom?: string; adresse?: string; denomination?: string; siren?: string };
  cessionnaire: { type: string; nom?: string; prenom?: string; adresse?: string; denomination?: string; siren?: string };
  nombreParts: string;
  prixTotal: string;
  dateSignature: string;
  includChangementDirigeant: boolean;
  nouveauDirigeant: { nom: string; prenom: string; fonction: string } | null;
}) {
  const nomCedant = body.cedant.type === "physique"
    ? `${body.cedant.nom || ""} ${body.cedant.prenom || ""}`.trim()
    : (body.cedant.denomination || "");

  const nomCessionnaire = body.cessionnaire.type === "physique"
    ? `${body.cessionnaire.nom || ""} ${body.cessionnaire.prenom || ""}`.trim()
    : (body.cessionnaire.denomination || "");

  // Payload pour modification - transmission de parts/actions
  const payload: Record<string, unknown> = {
    formeExercice: body.formeJuridique,
    siren: body.siren,
    content: {
      formeJuridique: body.formeJuridique,
      denomination: body.denomination,
      capital: body.capitalSocial,
      adresseSiege: body.siegeAdresse,
      typeModification: "CESSION_PARTS",
      cession: {
        cedant: body.cedant.type === "physique"
          ? {
              typePersonne: "PERSONNE_PHYSIQUE",
              nom: body.cedant.nom || "",
              prenom: body.cedant.prenom || "",
              adresse: body.cedant.adresse || "",
            }
          : {
              typePersonne: "PERSONNE_MORALE",
              denomination: body.cedant.denomination || "",
              siren: body.cedant.siren || "",
            },
        cessionnaire: body.cessionnaire.type === "physique"
          ? {
              typePersonne: "PERSONNE_PHYSIQUE",
              nom: body.cessionnaire.nom || "",
              prenom: body.cessionnaire.prenom || "",
              adresse: body.cessionnaire.adresse || "",
            }
          : {
              typePersonne: "PERSONNE_MORALE",
              denomination: body.cessionnaire.denomination || "",
              siren: body.cessionnaire.siren || "",
            },
        nombreParts: parseInt(body.nombreParts || "0"),
        prixCession: parseFloat(body.prixTotal?.replace(/\s/g, "").replace(",", ".") || "0"),
        dateCession: body.dateSignature,
        nomCedant,
        nomCessionnaire,
      },
      ...(body.includChangementDirigeant && body.nouveauDirigeant
        ? {
            changementDirigeant: {
              typeModification: "NOMINATION",
              dirigeant: {
                typePersonne: "PERSONNE_PHYSIQUE",
                nom: body.nouveauDirigeant.nom,
                prenom: body.nouveauDirigeant.prenom,
                fonction: body.nouveauDirigeant.fonction,
              },
            },
          }
        : {}),
    },
  };

  return payload;
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Authentification INPI
    const { token, cookie } = await loginInpi();

    // 2. Création de la formalité
    const payload = buildFormalitePayload(body);
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

    if (!formaliteId) throw new Error("Identifiant de formalité introuvable dans la réponse INPI");

    // 3. Upload des pièces justificatives
    const justifFiles: Partial<Record<string, JustifFile>> = body.justifFiles || {};

    const docTypeMap: Record<string, string> = {
      acte: "ACTE_CESSION",
      pv: "PV_ASSEMBLEE",
      statuts: "STATUTS_CERTIFIES",
      identite: "PIECE_IDENTITE",
      declaration: "DECLARATION_NON_CONDAMNATION",
    };

    for (const [key, typeCode] of Object.entries(docTypeMap)) {
      const file = justifFiles[key];
      if (file) {
        await uploadDocument(token, cookie, formaliteId, file, typeCode);
      }
    }

    // 4. Soumission de la formalité
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
      // Non bloquant : la formalité est créée mais pas encore soumise
      console.warn(`Soumission formalité échouée (${submitRes.status}): ${txt}`);
      return NextResponse.json({
        dossierId: formaliteId,
        message: `Dossier créé (n° ${formaliteId}) mais non encore soumis. Connectez-vous sur guichet-unique.inpi.fr pour finaliser.`,
      });
    }

    return NextResponse.json({
      dossierId: formaliteId,
      message: `Formalité déposée avec succès sur le Guichet Unique INPI (dossier n° ${formaliteId}).`,
    });
  } catch (err: unknown) {
    console.error("Erreur INPI:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
