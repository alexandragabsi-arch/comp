import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY non configurée" }, { status: 500 });
    }

    const { fileBase64, fileType } = await req.json();

    if (!fileBase64) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    // Determine media type
    let mediaType: "image/png" | "image/jpeg" | "image/gif" | "image/webp" = "image/png";
    if (fileType?.includes("jpeg") || fileType?.includes("jpg")) mediaType = "image/jpeg";
    if (fileType?.includes("png")) mediaType = "image/png";
    if (fileType?.includes("webp")) mediaType = "image/webp";

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: fileBase64,
              },
            },
            {
              type: "text",
              text: `Analyse ce document comptable (bilan ou compte de résultat).

Extrais les données suivantes et retourne-les en JSON STRICT (pas de commentaire, pas de markdown, juste le JSON) :

{
  "resultat_net": nombre (positif = bénéfice, négatif = perte),
  "capital_social": nombre,
  "reserve_legale": nombre,
  "report_a_nouveau": nombre,
  "total_bilan_actif": nombre,
  "total_bilan_passif": nombre,
  "chiffre_affaires": nombre,
  "exercice_debut": "YYYY-MM-DD" ou null,
  "exercice_fin": "YYYY-MM-DD" ou null,
  "denomination": "nom de la société" ou null
}

Si une donnée n'est pas visible dans le document, mets null.
Les montants sont en euros, sans symbole, juste le nombre.
Retourne UNIQUEMENT le JSON, rien d'autre.`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON response
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: "Impossible d'extraire les données", raw: text });
      }
      const data = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ success: true, data });
    } catch {
      return NextResponse.json({ error: "Erreur de parsing", raw: text });
    }
  } catch (error) {
    console.error("Erreur analyse bilan:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur d'analyse" },
      { status: 500 }
    );
  }
}
