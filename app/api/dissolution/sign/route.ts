import { NextRequest, NextResponse } from "next/server";

// Yousign API v3
// Docs: https://developers.yousign.com/reference
const YOUSIGN_BASE = process.env.YOUSIGN_SANDBOX === "true"
  ? "https://api-sandbox.yousign.app/v3"
  : "https://api.yousign.app/v3";

interface SignRequest {
  documentType: "pv" | "convocation" | "pv-liquidation" | "convocation-liquidation";
  companyName: string;
  /** DOCX as base64 string */
  documentBase64: string;
  signers: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }[];
}

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

    const docTypeLabels: Record<string, string> = {
      pv: "PV de Dissolution",
      convocation: "Convocation AGE",
      "pv-liquidation": "PV de Clôture de Liquidation",
      "convocation-liquidation": "Convocation AGO Liquidation",
    };
    const docLabel = docTypeLabels[body.documentType] ?? "Document";

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    // 1. Créer la signature request
    const srRes = await fetch(`${YOUSIGN_BASE}/signature_requests`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: `${docLabel} – ${body.companyName}`,
        delivery_mode: "email",
        reminder_settings: {
          interval_in_days: 2,
          max_occurrences: 3,
        },
      }),
    });

    if (!srRes.ok) {
      const txt = await srRes.text();
      throw new Error(`Création signature request Yousign échouée (${srRes.status}): ${txt}`);
    }

    const sr = await srRes.json();
    const signatureRequestId: string = sr.id;

    // 2. Upload du document
    const docRes = await fetch(
      `${YOUSIGN_BASE}/signature_requests/${signatureRequestId}/documents`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          nature: "signable_document",
          name: `${docLabel.replace(/\s/g, "_")}_${body.companyName}.docx`,
          content: body.documentBase64,
          content_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }),
      }
    );

    if (!docRes.ok) {
      const txt = await docRes.text();
      throw new Error(`Upload document Yousign échoué (${docRes.status}): ${txt}`);
    }

    const doc = await docRes.json();
    const documentId: string = doc.id;

    // 3. Ajouter les signataires
    const signerLinks: { signerName: string; url: string }[] = [];
    for (const signer of body.signers) {
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
              phone_number: signer.phone ?? undefined,
              locale: "fr",
            },
            signature_level: "advanced_electronic_signature",
            signature_authentication_mode: "otp_sms",
            fields: [
              {
                document_id: documentId,
                type: "signature",
                page: 1,
                x: 70,
                y: 700,
                width: 200,
                height: 60,
              },
            ],
          }),
        }
      );

      if (!signerRes.ok) {
        const txt = await signerRes.text();
        throw new Error(`Ajout signataire Yousign échoué (${signerRes.status}): ${txt}`);
      }

      const signerData = await signerRes.json();
      signerLinks.push({
        signerName: `${signer.firstName} ${signer.lastName}`,
        url: signerData.signature_link ?? signerData.signing_url ?? "",
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
      throw new Error(`Activation Yousign échouée (${activateRes.status}): ${txt}`);
    }

    return NextResponse.json({
      signatureRequestId,
      signerLinks,
      message: "Demande de signature envoyée avec succès.",
    });
  } catch (err) {
    console.error("Erreur Yousign:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur Yousign inconnue" },
      { status: 500 }
    );
  }
}
