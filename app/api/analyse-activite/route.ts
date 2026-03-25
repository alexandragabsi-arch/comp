import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY non configurée" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { activite_principale, activites_secondaires } = body;

    if (!activite_principale) {
      return NextResponse.json(
        { error: "Activité principale requise" },
        { status: 400 }
      );
    }

    const prompt = `Tu es un expert en création d'entreprise en France. Analyse l'activité suivante et fournis :

1. Le **code NAF** (nomenclature INSEE) le plus probable pour cette activité principale, avec son libellé officiel.
2. Si l'activité est **réglementée** (nécessite un diplôme, une autorisation, une licence, un agrément, une carte professionnelle, etc.), liste les conditions et justificatifs requis.

Activité principale : ${activite_principale}
${activites_secondaires ? `Activités secondaires : ${activites_secondaires}` : ""}

Réponds UNIQUEMENT au format JSON suivant (pas de texte avant/après) :
{
  "code_naf": "XX.XXx",
  "libelle_naf": "Libellé officiel du code NAF",
  "est_reglementee": true ou false,
  "reglementation": {
    "description": "Description courte de la réglementation applicable (ou null si non réglementée)",
    "conditions": ["condition 1", "condition 2"],
    "justificatifs": ["justificatif 1", "justificatif 2"],
    "autorite_competente": "Autorité qui délivre l'autorisation (ou null)"
  }
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Réponse invalide" }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur analyse activité:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse" },
      { status: 500 }
    );
  }
}
