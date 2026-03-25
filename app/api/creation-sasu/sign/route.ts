import { NextRequest, NextResponse } from "next/server";

// Yousign API v3
const YOUSIGN_BASE = process.env.YOUSIGN_SANDBOX === "true"
  ? "https://api-sandbox.yousign.app/v3"
  : "https://api.yousign.app/v3";

interface Signer {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: "associe" | "president" | "dg" | "dgd" | "hebergeur";
}

interface SignDocument {
  type: "statuts" | "non_condamnation" | "attestation_origine" | "attestation_hebergement" | "dispense_caa" | "attestation_biens_communs" | "annonce_legale";
  /** Base64-encoded DOCX content */
  contentBase64: string;
  /** Last page number where signature field should be placed */
  signaturePage?: number;
}

interface SignRequest {
  companyName: string;
  documents: SignDocument[];
  signers: Signer[];
  /** "qualified" for statuts, "advanced" for PV, "simple" for annexes */
  signatureLevel?: "qualified" | "advanced" | "simple";
}

const DOC_LABELS: Record<string, string> = {
  statuts: "Statuts constitutifs",
  non_condamnation: "Déclaration de non-condamnation et de filiation",
  attestation_origine: "Attestation d'origine des fonds",
  attestation_hebergement: "Attestation de domiciliation",
  dispense_caa: "Dispense de commissaire aux apports",
  attestation_biens_communs: "Attestation de biens communs",
  annonce_legale: "Annonce légale de constitution",
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.YOUSIGN_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Clé API Yousign manquante (YOUSIGN_API_KEY)" },
      { status: 500 }
    );
  }

  try {
    const body: SignRequest = await request.json();

    if (!body.documents?.length || !body.signers?.length) {
      return NextResponse.json(
        { error: "Documents et signataires requis" },
        { status: 400 }
      );
    }

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    // 1. Créer la signature request
    const srRes = await fetch(`${YOUSIGN_BASE}/signature_requests`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: `Création SASU – ${body.companyName}`,
        delivery_mode: "email",
        ordered_signers: false,
        reminder_settings: {
          interval_in_days: 2,
          max_occurrences: 5,
        },
        expiration_date: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(), // 30 days
      }),
    });

    if (!srRes.ok) {
      const txt = await srRes.text();
      throw new Error(`Création signature request: ${srRes.status} – ${txt}`);
    }

    const sr = await srRes.json();
    const signatureRequestId: string = sr.id;

    // 2. Upload chaque document
    const documentIds: { type: string; id: string; page: number }[] = [];

    for (const doc of body.documents) {
      const label = DOC_LABELS[doc.type] || doc.type;
      const fileName = `${label.replace(/[^a-zA-Z0-9àâéèêëïîôùûüÿçæœ\s-]/g, "").replace(/\s+/g, "_")}_${body.companyName}.docx`;

      const docRes = await fetch(
        `${YOUSIGN_BASE}/signature_requests/${signatureRequestId}/documents`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            nature: "signable_document",
            name: fileName,
            content: doc.contentBase64,
            content_type:
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          }),
        }
      );

      if (!docRes.ok) {
        const txt = await docRes.text();
        throw new Error(`Upload ${label}: ${docRes.status} – ${txt}`);
      }

      const docData = await docRes.json();
      documentIds.push({
        type: doc.type,
        id: docData.id,
        page: doc.signaturePage || 1,
      });
    }

    // 3. Ajouter les signataires avec leurs champs de signature
    const signerResults: {
      signerName: string;
      role: string;
      email: string;
      signatureLink: string;
    }[] = [];

    for (const signer of body.signers) {
      // Déterminer quels documents ce signataire doit signer
      const signerFields = buildSignerFields(signer.role, documentIds);

      const signerRes = await fetch(
        `${YOUSIGN_BASE}/signature_requests/${signatureRequestId}/signers`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            info: {
              first_name: signer.firstName,
              last_name: signer.lastName,
              email: signer.email,
              phone_number: signer.phone || undefined,
              locale: "fr",
            },
            signature_level: body.signatureLevel === "qualified"
              ? "qualified_electronic_signature"
              : body.signatureLevel === "advanced"
              ? "advanced_electronic_signature"
              : "electronic_signature",
            signature_authentication_mode: signer.phone
              ? "otp_sms"
              : "otp_email",
            fields: signerFields,
          }),
        }
      );

      if (!signerRes.ok) {
        const txt = await signerRes.text();
        throw new Error(
          `Ajout signataire ${signer.firstName} ${signer.lastName}: ${signerRes.status} – ${txt}`
        );
      }

      const signerData = await signerRes.json();
      signerResults.push({
        signerName: `${signer.firstName} ${signer.lastName}`,
        role: signer.role,
        email: signer.email,
        signatureLink:
          signerData.signature_link || signerData.signing_url || "",
      });
    }

    // 4. Activer la signature request
    const activateRes = await fetch(
      `${YOUSIGN_BASE}/signature_requests/${signatureRequestId}/activate`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      }
    );

    if (!activateRes.ok) {
      const txt = await activateRes.text();
      throw new Error(`Activation: ${activateRes.status} – ${txt}`);
    }

    return NextResponse.json({
      signatureRequestId,
      signers: signerResults,
      documentsCount: documentIds.length,
      message: `Demande de signature envoyée (${documentIds.length} document(s), ${signerResults.length} signataire(s)).`,
    });
  } catch (err) {
    console.error("Erreur Yousign (création SASU):", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur Yousign" },
      { status: 500 }
    );
  }
}

/**
 * Détermine quels documents un signataire doit signer selon son rôle.
 *
 * - associe: statuts, attestation_origine, attestation_biens_communs, dispense_caa
 * - president: statuts, non_condamnation
 * - dg: statuts (si mentionné), non_condamnation
 * - dgd: statuts (si mentionné), non_condamnation
 * - hebergeur: attestation_hebergement
 */
function buildSignerFields(
  role: string,
  documentIds: { type: string; id: string; page: number }[]
) {
  const docsToSign: string[] = [];

  switch (role) {
    case "associe":
      docsToSign.push(
        "statuts",
        "attestation_origine",
        "attestation_biens_communs",
        "dispense_caa"
      );
      break;
    case "president":
      docsToSign.push("statuts", "non_condamnation");
      break;
    case "dg":
    case "dgd":
      docsToSign.push("statuts", "non_condamnation");
      break;
    case "hebergeur":
      docsToSign.push("attestation_hebergement");
      break;
  }

  const fields: {
    document_id: string;
    type: string;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }[] = [];

  // Positions de signature selon le rôle (décalage vertical pour éviter les chevauchements)
  const yPositions: Record<string, number> = {
    associe: 680,
    president: 740,
    dg: 680,
    dgd: 740,
    hebergeur: 680,
  };
  const yPos = yPositions[role] || 700;

  for (const docType of docsToSign) {
    const doc = documentIds.find((d) => d.type === docType);
    if (doc) {
      fields.push({
        document_id: doc.id,
        type: "signature",
        page: doc.page,
        x: 70,
        y: yPos,
        width: 200,
        height: 50,
      });
    }
  }

  return fields;
}
