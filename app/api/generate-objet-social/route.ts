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
1. Commence par "La Société a pour objet" (JAMAIS "La société a pour objet :")
2. Décris l'activité principale de façon DÉTAILLÉE et JURIDIQUEMENT PRÉCISE (pas juste un mot, développe les prestations concrètes)
3. Inclus les activités secondaires comme des branches distinctes de l'objet
4. Utilise le vocabulaire juridique approprié (prestations de services, négoce, conseil, intermédiation, etc.)
5. Couvre tous les aspects de l'activité : B2B, B2C, en ligne, physique selon le contexte
6. Termine TOUJOURS par la clause omnibus : "Et, plus généralement, toutes opérations économiques, juridiques, industrielles, commerciales, civiles, financières, mobilières ou immobilières se rapportant directement ou indirectement à l'objet social ainsi défini, ou à tous objets similaires, connexes ou complémentaires, susceptibles d'en favoriser l'extension ou le développement, tant en France qu'à l'étranger, pour son compte ou pour le compte de tiers, seule ou en participation."
7. NE METS PAS de tirets, bullets, ou numéros — rédige en PROSE CONTINUE (paragraphes)
8. Fais 2 à 4 paragraphes maximum
9. N'ajoute AUCUN commentaire, AUCUNE explication — retourne UNIQUEMENT le texte de l'objet social
10. Le texte doit être prêt à être inséré tel quel dans des statuts constitutifs de SASU

IMPORTANT : Le résultat doit être d'un niveau professionnel comparable à ce qu'un cabinet d'avocats facturerait 500€.`;

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
