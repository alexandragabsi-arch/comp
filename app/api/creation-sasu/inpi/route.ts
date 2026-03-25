import { NextRequest, NextResponse } from "next/server";

const INPI_BASE = "https://guichet-unique.inpi.fr/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Answers = Record<string, any>;

interface JustifFile {
  name: string;
  base64: string;
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

function buildCreationPayload(a: Answers) {
  const isPhysique = a.type_associe !== "morale";
  const isPresidentAssocie = a.president_option === "associe";

  // Associé unique
  const associe = isPhysique
    ? {
        typePersonne: "PERSONNE_PHYSIQUE",
        nom: a.associe_nom || "",
        prenom: a.associe_prenom || "",
        dateNaissance: a.associe_date_naissance || "",
        lieuNaissance: a.associe_lieu_naissance || "",
        nationalite: a.associe_nationalite || "Française",
        adresse: a.associe_adresse || "",
      }
    : {
        typePersonne: "PERSONNE_MORALE",
        denomination: a.associe_societe_nom || "",
        siren: a.associe_societe_siren || "",
        formeJuridique: a.associe_societe_forme || "",
        adresse: a.associe_societe_adresse || "",
      };

  // Président
  let president;
  if (isPresidentAssocie) {
    president = { ...associe, fonction: "PRESIDENT" };
  } else if (a.president_type === "physique") {
    president = {
      typePersonne: "PERSONNE_PHYSIQUE",
      nom: a.president_nom || "",
      prenom: a.president_prenom || "",
      dateNaissance: a.president_date_naissance || "",
      lieuNaissance: a.president_lieu_naissance || "",
      nationalite: a.president_nationalite || "Française",
      adresse: a.president_adresse || "",
      fonction: "PRESIDENT",
    };
  } else {
    president = {
      typePersonne: "PERSONNE_MORALE",
      denomination: a.president_pm_nom || "",
      siren: a.president_pm_siren || "",
      adresse: a.president_pm_adresse || "",
      representantPermanent: {
        nom: a.president_rp_nom || "",
        prenom: a.president_rp_prenom || "",
        dateNaissance: a.president_rp_date_naissance || "",
      },
      fonction: "PRESIDENT",
    };
  }

  // DG (optionnel)
  let dg = null;
  if (a.nommer_dg === "oui") {
    if ((a.dg_type || "physique") === "physique") {
      dg = {
        typePersonne: "PERSONNE_PHYSIQUE",
        nom: a.dg_nom || "",
        prenom: a.dg_prenom || "",
        dateNaissance: a.dg_date_naissance || "",
        lieuNaissance: a.dg_lieu_naissance || "",
        nationalite: a.dg_nationalite || "Française",
        adresse: a.dg_adresse || "",
        fonction: "DIRECTEUR_GENERAL",
      };
    } else {
      dg = {
        typePersonne: "PERSONNE_MORALE",
        denomination: a.dg_pm_nom || "",
        siren: a.dg_pm_siren || "",
        adresse: a.dg_pm_adresse || "",
        fonction: "DIRECTEUR_GENERAL",
      };
    }
  }

  // Bénéficiaires effectifs
  const beneficiaires = (a.beneficiaires_effectifs || []).map((be: Answers) => ({
    nom: be.nom || "",
    prenom: be.prenom || "",
    dateNaissance: be.date_naissance || "",
    lieuNaissance: be.lieu_naissance || "",
    nationalite: be.nationalite || "Française",
    adresse: be.adresse || "",
    pourcentageCapital: Number(be.pct_capital) || 0,
    pourcentageDroitsVote: Number(be.pct_votes) || 0,
    natureControle: be.nature_controle || [],
    modaliteControle: be.modalite_controle || "directe",
  }));

  // Exercice social
  const dateClotureExercice = a.cloture_exercice === "31_dec"
    ? "31/12"
    : a.cloture_date_permanente || "31/12";

  return {
    typeFormalite: "CREATION",
    formeJuridique: "SASU",
    content: {
      identite: {
        denomination: a.nom_societe || a.denomination_sociale || "",
        sigle: a.sigle || null,
        nomCommercial: a.nom_commercial || null,
        enseigne: a.enseigne || null,
        formeJuridique: "SAS_UNIPERSONNELLE",
        dateConstitution: a.date_signature || new Date().toISOString().split("T")[0],
      },
      siege: {
        adresse: a.adresse_siege || "",
        typeDomiciliation: a.type_domiciliation || "domicile_dirigeant",
      },
      capital: {
        montant: Number(a.capital_social) || 1,
        devise: "EUR",
        type: a.type_capital === "variable" ? "VARIABLE" : "FIXE",
        ...(a.type_capital === "variable" ? {
          montantMinimum: Number(a.capital_minimum) || 1,
          montantMaximum: Number(a.capital_maximum) || 10000,
        } : {}),
      },
      activite: {
        objetSocial: a.objet_social || "",
        activitePrincipale: a.activite_principale_desc || a.sous_categorie || "",
        codeNAF: a.code_naf || null,
        activiteReglementee: a.est_reglementee === "oui",
      },
      exerciceSocial: {
        dateClotureExercice,
        premierExercice: {
          dateCloture: dateClotureExercice,
          prolonge: a.cloture_prolongee === "oui",
        },
      },
      regimeFiscal: {
        impotBenefices: a.regime_fiscal === "ir" ? "IR" : "IS",
        regimeTVA: a.regime_tva || "reel_simplifie",
      },
      associes: [associe],
      dirigeants: [president, dg].filter(Boolean),
      beneficiairesEffectifs: beneficiaires,
      commissaireAuxComptes: a.nommer_cac === "oui" ? {
        denomination: a.cac_denomination || "",
        adresse: a.cac_adresse || "",
        dureeMandat: Number(a.cac_duree_mandat) || 6,
      } : null,
    },
  };
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
    console.warn(`Upload ${typeCode} échoué (${res.status}): ${txt}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers, justifFiles } = body as {
      answers: Answers;
      justifFiles?: Record<string, JustifFile>;
    };

    // 1. Login INPI
    const { token, cookie } = await loginInpi();

    // 2. Créer la formalité de création
    const payload = buildCreationPayload(answers);
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
    if (!formaliteId) throw new Error("Identifiant formalité introuvable");

    // 3. Upload des pièces justificatives
    const docTypeMap: Record<string, string> = {
      statuts: "STATUTS_CONSTITUTIFS",
      identite: "PIECE_IDENTITE",
      non_condamnation: "DECLARATION_NON_CONDAMNATION",
      attestation_origine: "ATTESTATION_ORIGINE_FONDS",
      domicile: "JUSTIFICATIF_DOMICILE",
      bail: "BAIL_COMMERCIAL",
      propriete: "TITRE_PROPRIETE",
      contrat_domiciliation: "CONTRAT_DOMICILIATION",
      convention_hebergement: "CONVENTION_HEBERGEMENT",
      depot_capital: "ATTESTATION_DEPOT_CAPITAL",
      kbis_president: "KBIS_DIRIGEANT",
      emancipation: "JUGEMENT_EMANCIPATION",
    };

    if (justifFiles) {
      for (const [key, typeCode] of Object.entries(docTypeMap)) {
        const file = justifFiles[key];
        if (file) {
          await uploadDocument(token, cookie, formaliteId, file, typeCode);
        }
      }
    }

    // 4. Soumettre la formalité
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
      console.warn(`Soumission échouée (${submitRes.status}): ${txt}`);
      return NextResponse.json({
        dossierId: formaliteId,
        status: "created",
        message: `Dossier créé (n° ${formaliteId}) mais non soumis. Finalisez sur guichet-unique.inpi.fr.`,
      });
    }

    return NextResponse.json({
      dossierId: formaliteId,
      status: "submitted",
      message: `Formalité de création SASU déposée avec succès (dossier n° ${formaliteId}).`,
    });
  } catch (err: unknown) {
    console.error("Erreur INPI création SASU:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur INPI" },
      { status: 500 }
    );
  }
}
