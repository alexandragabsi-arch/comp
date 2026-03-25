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
    const {
      activite_principale,
      activites_secondaires,
      type_structure,
    } = body;

    if (!activite_principale) {
      return NextResponse.json(
        { error: "Activité principale requise" },
        { status: 400 }
      );
    }

    const isHoldingPassive = type_structure === "holding_passive";
    const isHoldingAnimatrice = type_structure === "holding_animatrice";

    let contextStructure = "";
    if (isHoldingPassive) {
      contextStructure = `
La société est une HOLDING PASSIVE (pure). L'objet social DOIT être centré sur :
- La prise, gestion, détention et cession de participations dans toutes sociétés françaises ou étrangères
- La perception des produits financiers (dividendes, plus-values de cession, produits de liquidation, intérêts de compte courant)
- Préciser expressément que la société N'EXERCE AUCUNE ACTIVITÉ OPÉRATIONNELLE DIRECTE
- Mentionner les droits de propriété intellectuelle, brevets, marques et licences le cas échéant`;
    } else if (isHoldingAnimatrice) {
      contextStructure = `
La société est une HOLDING ANIMATRICE. L'objet social DOIT inclure :
- La prise, gestion, détention et cession de participations dans toutes sociétés françaises ou étrangères
- L'ANIMATION ACTIVE et la DIRECTION EFFECTIVE des filiales (participation à la conduite de la politique du groupe et au contrôle des filiales)
- La fourniture de services aux filiales : direction générale, stratégie, gestion administrative, financière, comptable, juridique et commerciale
- Mentionner les conventions de management fees à des conditions normales de marché
- IMPORTANT : Ajouter un paragraphe distinct précisant que la société exerce une activité réelle et substantielle dans l'animation de ses filiales, condition nécessaire à la qualification de holding animatrice au sens de la jurisprudence et de la doctrine administrative, notamment pour l'application des dispositifs d'exonération prévus aux articles 787 B du CGI (Dutreil) et 150-0 B ter du CGI (apport-cession).`;
    }

    const prompt = `Tu es un avocat spécialisé en droit des sociétés françaises, expert en rédaction de statuts de SASU. Tu dois rédiger l'OBJET SOCIAL d'une SASU de manière professionnelle, juridiquement solide et complète.

ACTIVITÉ PRINCIPALE : ${activite_principale}
${activites_secondaires ? `ACTIVITÉS SECONDAIRES : ${activites_secondaires}` : ""}
${contextStructure}

RÈGLES STRICTES DE RÉDACTION :
1. Commence DIRECTEMENT par la description de l'activité (ex: "La prestation de services en matière de...")
2. Sois CONCIS et JURIDIQUEMENT PRÉCIS — un seul paragraphe fluide
3. Intègre les activités secondaires avec des LIAISONS naturelles ("; la prestation de...", "; le conseil en...", "; ainsi que..."). JAMAIS de phrase sèche collée sans transition.
4. Tout doit former UN SEUL TEXTE FLUIDE, comme rédigé par un avocat — pas une liste déguisée en prose
5. Utilise le vocabulaire juridique approprié (prestations de services, négoce, conseil, intermédiation, etc.)
6. NE TERMINE PAS par la clause omnibus "Et plus généralement..." — elle sera ajoutée automatiquement par les statuts
7. NE METS PAS de tirets, bullets, ou numéros — rédige en PROSE CONTINUE
8. N'ajoute AUCUN commentaire, AUCUNE explication — retourne UNIQUEMENT le texte de l'objet social
9. Maximum 6 lignes. Style avocat : concis, précis, fluide.

IMPORTANT : Le résultat doit être d'un niveau professionnel de cabinet d'avocats. Les activités doivent être liées par des points-virgules et des connecteurs ("; la...", "; ainsi que...", "; le..."), JAMAIS par des points suivis d'une nouvelle phrase sèche.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ objet_social: text.trim() });
  } catch (error) {
    console.error("Erreur génération objet social:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de l'objet social" },
      { status: 500 }
    );
  }
}
