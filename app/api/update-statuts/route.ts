import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { statutsText, cessionData } = body as {
      statutsText: string;
      cessionData: {
        nomCedant: string;
        nomCessionnaire: string;
        nbParts: string;
        prixTotal: string;
        date: string;
        ville: string;
        formeJuridique: string;
        denomination: string;
        capitalTotal: string;
        nbTitresTotal: string;
        includChangementDirigeant: boolean;
        nouveauDirigeantCivilite?: string;
        nouveauDirigeantNom?: string;
        nouveauDirigeantPrenom?: string;
        nouveauDirigeantFonction?: string;
        ancienDirigeantNom?: string;
      };
    };

    const {
      nomCedant, nomCessionnaire, nbParts, date, ville,
      formeJuridique, denomination, capitalTotal, nbTitresTotal,
      includChangementDirigeant, nouveauDirigeantCivilite,
      nouveauDirigeantNom, nouveauDirigeantPrenom, nouveauDirigeantFonction,
      ancienDirigeantNom,
    } = cessionData;

    const typeTitre = ["SARL", "EURL", "SNC", "SCI"].includes(formeJuridique) ? "parts sociales" : "actions";

    const prompt = `Tu es un juriste expert en droit des sociétés français. Tu dois mettre à jour des statuts de société après une cession de ${typeTitre}.

STATUTS ACTUELS :
---
${statutsText}
---

OPÉRATIONS INTERVENUES LE ${date} :
- Cession de ${nbParts} ${typeTitre} de ${nomCedant} à ${nomCessionnaire}
- Société : ${denomination} (${formeJuridique}) — Capital total : ${capitalTotal} — Nombre total de ${typeTitre} : ${nbTitresTotal}
${includChangementDirigeant ? `- Changement de dirigeant : démission de ${ancienDirigeantNom || nomCedant}, nomination de ${nouveauDirigeantCivilite || ""} ${nouveauDirigeantNom} ${nouveauDirigeantPrenom} en qualité de ${nouveauDirigeantFonction || "Gérant"}` : ""}

INSTRUCTIONS :
1. Reproduis les statuts EN INTÉGRALITÉ, mot pour mot, en ne modifiant QUE les passages concernés.
2. Modifications à effectuer :
   a. Dans l'article sur la répartition du capital / liste des associés : remplace les parts de ${nomCedant} par ${nomCessionnaire} (${nbParts} ${typeTitre}). Si ${nomCedant} n'a plus de parts, retire-le de la liste.
   ${includChangementDirigeant ? `b. Dans l'article sur la gérance/présidence : remplace ${ancienDirigeantNom || nomCedant} par ${nouveauDirigeantCivilite || ""} ${nouveauDirigeantNom} ${nouveauDirigeantPrenom} en qualité de ${nouveauDirigeantFonction || "Gérant"}.` : ""}
3. À la toute fin des statuts, avant toute signature existante, ajoute cette mention de certification :

---
MISE À JOUR DES STATUTS
Statuts mis à jour le ${date} à ${ville}, suite à :
- Cession de ${nbParts} ${typeTitre} de ${nomCedant} à ${nomCessionnaire}${includChangementDirigeant ? `\n- Nomination de ${nouveauDirigeantCivilite || ""} ${nouveauDirigeantNom} ${nouveauDirigeantPrenom} en qualité de ${nouveauDirigeantFonction || "Gérant"} en remplacement de ${ancienDirigeantNom || nomCedant}` : ""}

Certifié conforme à la décision prise le ${date}

Pour la société ${denomination},
${includChangementDirigeant ? `${nouveauDirigeantCivilite || ""} ${nouveauDirigeantNom} ${nouveauDirigeantPrenom}, ${nouveauDirigeantFonction || "Gérant"}` : `Le Gérant`}

Signature : _______________________
---

4. Pour chaque passage modifié, indique clairement avec ce marqueur AVANT le passage : [MODIFIÉ]
   et ce marqueur APRÈS le passage modifié : [/MODIFIÉ]
   Ces marqueurs me permettront d'afficher un diff visuel.

Réponds UNIQUEMENT avec le texte intégral des statuts mis à jour (avec les marqueurs [MODIFIÉ]...[/MODIFIÉ]).`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      messages: [{ role: "user", content: prompt }],
    });

    const block = response.content.find((b) => b.type === "text");
    const updatedText = block && block.type === "text" ? block.text : "";

    return NextResponse.json({ updatedText });
  } catch (error) {
    console.error("Erreur update-statuts:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour des statuts" }, { status: 500 });
  }
}
