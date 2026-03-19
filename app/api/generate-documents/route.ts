import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { FormData } from "../../types/form";
import { TEMPLATE_ACTE, TEMPLATE_PV } from "../../lib/templates";

export const maxDuration = 300;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildPromptActe(data: FormData): string {
  const cedant = data.cedant;
  const cessionnaire = data.cessionnaire;
  const societe = data.societe;
  const prix = data.prix;
  const gap = data.gap;
  const nc = data.nonConcurrence;
  const cc = data.comptesCourants;
  const typeTitre = ["SARL", "EURL", "SNC", "SCI"].includes(
    societe.formeJuridique || ""
  )
    ? "parts sociales"
    : "actions";

  const pct =
    societe.nombreTitresTotal && cedant.nombreTitresCedes
      ? (
          (parseInt(cedant.nombreTitresCedes) /
            parseInt(societe.nombreTitresTotal)) *
          100
        ).toFixed(2)
      : "?";

  const nomCedant =
    cedant.typePersonne === "physique" && cedant.physique
      ? `${cedant.physique.civilite} ${cedant.physique.nom} ${cedant.physique.prenom}`
      : cedant.morale?.denomination || "[CÉDANT]";

  const nomCessionnaire =
    cessionnaire.typePersonne === "physique" && cessionnaire.physique
      ? `${cessionnaire.physique.civilite} ${cessionnaire.physique.nom} ${cessionnaire.physique.prenom}`
      : cessionnaire.morale?.denomination || "[CESSIONNAIRE]";

  return `Tu es un juriste expert en droit des sociétés français. Rédige un ACTE DE CESSION DE ${typeTitre.toUpperCase()} complet, professionnel et juridiquement correct.

Voici le MODÈLE DE RÉFÉRENCE à suivre impérativement (tous les articles doivent être présents) :
---
${TEMPLATE_ACTE}
---

Remplis ce modèle EXACTEMENT en te basant sur les informations suivantes. Ne saute aucun article. Adapte uniquement les clauses optionnelles selon les paramètres fournis.

DONNÉES DE LA CESSION :

SOCIÉTÉ CIBLE :
- Dénomination : ${societe.denomination || "[non renseigné]"}
- Forme juridique : ${societe.formeJuridique || "[non renseigné]"}
- Capital : ${societe.capital || "[non renseigné]"}
- Siège social : ${societe.adresse || "[non renseigné]"}
- RCS : ${societe.rcsVille || ""} n° ${societe.rcsNumero || "[non renseigné]"}
- Nombre total de ${typeTitre} : ${societe.nombreTitresTotal || "[non renseigné]"}
- Valeur nominale : ${societe.valeurNominale || "[non renseigné]"} par titre
${societe.estSPI ? "- ATTENTION : Société à prépondérance immobilière (SPI)" : ""}

CÉDANT :
${
  cedant.typePersonne === "physique" && cedant.physique
    ? `- Personne physique : ${cedant.physique.civilite} ${cedant.physique.nom} ${cedant.physique.prenom}
- Né(e) le : ${cedant.physique.dateNaissance || "[non renseigné]"} à ${cedant.physique.villeNaissance || "[non renseigné]"}
- Nationalité : ${cedant.physique.nationalite || "française"}
- Adresse : ${cedant.physique.adresse || "[non renseigné]"}
- Situation maritale : ${
        cedant.physique.regime === "communaute"
          ? `Marié(e)/Pacsé(e) sous régime de ${cedant.physique.typeRegime || "communauté de biens"} avec ${cedant.physique.conjointCivilite || ""} ${cedant.physique.conjointNom || ""} ${cedant.physique.conjointPrenom || ""}`
          : cedant.physique.regime === "separation"
          ? `Marié(e)/Pacsé(e) sous séparation de biens avec ${cedant.physique.conjointCivilite || ""} ${cedant.physique.conjointNom || ""} ${cedant.physique.conjointPrenom || ""}`
          : "Célibataire / non marié(e)"
      }`
    : `- Personne morale : ${cedant.morale?.denomination || "[non renseigné]"}
- Forme : ${cedant.morale?.formeJuridique || ""}, Capital : ${cedant.morale?.capital || ""}
- Siège : ${cedant.morale?.adresse || ""}
- RCS ${cedant.morale?.rcsVille || ""} n° ${cedant.morale?.rcsNumero || ""}
- Représentée par : ${cedant.morale?.representantCivilite || ""} ${cedant.morale?.representantNom || ""} ${cedant.morale?.representantPrenom || ""}, ${cedant.morale?.representantQualite || ""}`
}
- Nombre de ${typeTitre} cédées : ${cedant.nombreTitresCedes || "[non renseigné]"} (${pct}% du capital)
${data.natureCession.numeroDe && data.natureCession.numeroA ? `- Numéros des titres : n°${data.natureCession.numeroDe} à n°${data.natureCession.numeroA}` : ""}

CESSIONNAIRE :
${
  cessionnaire.typePersonne === "physique" && cessionnaire.physique
    ? `- Personne physique : ${cessionnaire.physique.civilite} ${cessionnaire.physique.nom} ${cessionnaire.physique.prenom}
- Né(e) le : ${cessionnaire.physique.dateNaissance || "[non renseigné]"} à ${cessionnaire.physique.villeNaissance || "[non renseigné]"}
- Nationalité : ${cessionnaire.physique.nationalite || "française"}
- Adresse : ${cessionnaire.physique.adresse || "[non renseigné]"}
- Situation maritale : ${
        cessionnaire.physique.regime === "communaute"
          ? `Marié(e) sous régime de communauté — acquisition sur biens ${cessionnaire.acquisitionBiens === "communs" ? "communs" : "propres"} — conjoint : ${cessionnaire.physique.conjointCivilite || ""} ${cessionnaire.physique.conjointNom || ""} ${cessionnaire.physique.conjointPrenom || ""}`
          : cessionnaire.physique.regime === "separation"
          ? `Marié(e) sous séparation de biens`
          : "Célibataire / non marié(e)"
      }`
    : `- Personne morale : ${cessionnaire.morale?.denomination || "[non renseigné]"}
- Forme : ${cessionnaire.morale?.formeJuridique || ""}, Capital : ${cessionnaire.morale?.capital || ""}
- Siège : ${cessionnaire.morale?.adresse || ""}
- RCS ${cessionnaire.morale?.rcsVille || ""} n° ${cessionnaire.morale?.rcsNumero || ""}
- Représentée par : ${cessionnaire.morale?.representantCivilite || ""} ${cessionnaire.morale?.representantNom || ""} ${cessionnaire.morale?.representantPrenom || ""}, ${cessionnaire.morale?.representantQualite || ""}`
}

PRIX ET PAIEMENT :
- Prix total : ${prix.prixTotal || "[non renseigné]"}
- Mode de paiement : ${prix.typePaiement === "comptant" ? "Comptant (quittance immédiate)" : "Échelonné"}
${
  prix.typePaiement === "echelonne" && prix.echeances
    ? prix.echeances
        .map((e, i) => `- Échéance ${i + 1} : ${e.montant} le ${e.date}`)
        .join("\n")
    : ""
}
- Nature : ${data.natureCession.type === "pleine_propriete" ? "Pleine propriété" : data.natureCession.type === "usufruit" ? "Usufruit" : "Nue-propriété"}
- Frais d'enregistrement à la charge du : ${data.fraisALaCharge}
- Lieu et date de signature : ${data.ville || "[ville]"}, le ${data.date || "[date]"}

GARANTIE D'ACTIF ET DE PASSIF (GAP) :
${
  gap.active
    ? `- GAP ACTIVE
- Seuil par sinistre (franchise) : ${gap.seuilParSinistre || "[non renseigné]"}
- Seuil annuel cumulé : ${gap.seuilAnnuel || "[non renseigné]"}
- Plafond global : ${gap.plafond || "[non renseigné]"}
- Durée : ${gap.dureeAnnees || "[non renseigné]"} années
- Délai notification : ${gap.notificationDelaiMois || "[non renseigné]"} mois
${gap.notificationAdresse ? `- Adresse de notification : ${gap.notificationAdresse}` : ""}
${gap.notificationEmail ? `- Email de notification : ${gap.notificationEmail}` : ""}
${gap.escrow ? `- SÉQUESTRE : ${gap.escrowMontant || ""} auprès de ${gap.escrowBeneficiaire || ""}` : "- Pas de séquestre"}`
    : "- Pas de GAP prévue"
}

COMPTE COURANT D'ASSOCIÉ :
${
  cc.option === "absent"
    ? "- Aucun compte courant / renonciation"
    : cc.option === "cede"
    ? `- Cession du compte courant au cessionnaire — solde : ${cc.solde || "?"}`
    : `- Conservation par le cédant — solde : ${cc.solde || "?"} — remboursement sous ${cc.delaiRemboursementMois || "?"} mois`
}

NON-CONCURRENCE :
${
  nc.active
    ? `- Clause active : ${nc.dureeAns || "?"} ans — zone : ${nc.zoneGeographique || "?"}
${nc.appliqueAuCessionnaire ? `- S'applique aussi au cessionnaire : ${nc.dureeAnsCessionnaire || "?"} ans — zone : ${nc.zoneGeoCessionnaire || "?"}` : ""}`
    : "- Pas de clause de non-concurrence"
}

PV D'AGRÉMENT daté du : ${data.pv.date || data.date || "[date]"}
Type d'assemblée : ${data.pv.typeAssemblee}

INSTRUCTIONS DE RÉDACTION :
1. Rédige l'acte COMPLET avec tous les articles numérotés
2. Intègre toutes les informations ci-dessus EXACTEMENT (ne laisse aucun [À COMPLÉTER] si l'info est fournie)
3. Utilise un style juridique professionnel français
4. Inclus les articles : Identification des parties, Déclarations préalables, Objet, Prix & quittance, Fiscalité, Régime matrimonial, Agrément, Comptes courants, Transfert de propriété, GAP (selon paramètre), Non-concurrence (selon paramètre), Opposabilité & formalités, Dispositions générales, Signatures
5. Adapte le régime fiscal selon le type de cédant (personne physique → PFU, personne morale → IS)
6. Pour les droits d'enregistrement : ${
    ["SA", "SAS", "SASU"].includes(societe.formeJuridique || "")
      ? "0,1% (SA/SAS)"
      : "3% avec abattement 23 000€ proratisé (SARL/EURL)"
  }
7. Termine par les blocs de signature avec les mentions manuscrites requises
${nomCedant} ${nomCessionnaire}`;
}

function buildPromptPV(data: FormData): string {
  const pv = data.pv;
  const cedant = data.cedant;
  const cessionnaire = data.cessionnaire;
  const societe = data.societe;
  const typeTitre = ["SARL", "EURL", "SNC", "SCI"].includes(
    societe.formeJuridique || ""
  )
    ? "parts sociales"
    : "actions";

  const pct =
    societe.nombreTitresTotal && cedant.nombreTitresCedes
      ? (
          (parseInt(cedant.nombreTitresCedes) /
            parseInt(societe.nombreTitresTotal)) *
          100
        ).toFixed(2)
      : "?";

  const nomCedant =
    cedant.typePersonne === "physique" && cedant.physique
      ? `${cedant.physique.civilite} ${cedant.physique.nom} ${cedant.physique.prenom}`
      : cedant.morale?.denomination || "[CÉDANT]";

  const nomCessionnaire =
    cessionnaire.typePersonne === "physique" && cessionnaire.physique
      ? `${cessionnaire.physique.civilite} ${cessionnaire.physique.nom} ${cessionnaire.physique.prenom}`
      : cessionnaire.morale?.denomination || "[CESSIONNAIRE]";

  const nouveauDirigeantBlock =
    pv.changementDirigeant
      ? pv.nouveauDirigeantTypePersonne === "morale"
        ? `Nouveau dirigeant (PM) :
- Dénomination : ${pv.nouveauDirigeantDenomination || ""}
- Forme : ${pv.nouveauDirigeantFormeJuridiqueStr || ""}, Capital : ${pv.nouveauDirigeantCapitalStr || ""}
- Siège : ${pv.nouveauDirigeantSiegeSocial || ""}
- RCS ${pv.nouveauDirigeantRCSSiege || ""} n° ${pv.nouveauDirigeantRCSNum || ""}
- Représentant permanent : ${pv.rpCivilite || ""} ${pv.rpNom || ""} ${pv.rpPrenom || ""}`
        : `Nouveau dirigeant (PP) : ${nomCessionnaire}
- Né(e) le ${cessionnaire.physique?.dateNaissance || pv.nouveauDirigeantDateNaissance || ""} à ${pv.nouveauDirigeantVilleNaissance || cessionnaire.physique?.villeNaissance || ""}
- Nationalité : ${pv.nouveauDirigeantNationalite || cessionnaire.physique?.nationalite || "française"}
- Demeurant : ${cessionnaire.physique?.adresse || pv.nouveauDirigeantAdresse || ""}`
      : "";

  return `Tu es un juriste expert en droit des sociétés français. Rédige un PROCÈS-VERBAL ${pv.typeAssemblee === "AGE" ? "D'ASSEMBLÉE GÉNÉRALE EXTRAORDINAIRE" : pv.typeAssemblee === "associe_unique" ? "DE L'ASSOCIÉ UNIQUE" : "DE DÉCISIONS UNANIMES DES ASSOCIÉS"} complet et juridiquement correct.

Voici le MODÈLE DE RÉFÉRENCE à suivre impérativement (toutes les résolutions doivent être présentes) :
---
${TEMPLATE_PV}
---

Remplis ce modèle EXACTEMENT en te basant sur les informations suivantes. N'omets aucune résolution obligatoire.

DONNÉES :

SOCIÉTÉ :
- Dénomination : ${societe.denomination || "[non renseigné]"}
- Forme : ${societe.formeJuridique || ""} — Capital : ${societe.capital || ""}
- Siège : ${societe.adresse || ""}
- RCS ${societe.rcsVille || ""} n° ${societe.rcsNumero || ""}
- Nombre total de ${typeTitre} : ${societe.nombreTitresTotal || ""}

CESSION :
- Cédant : ${nomCedant}
- Cessionnaire : ${nomCessionnaire}
- Nombre de ${typeTitre} cédées : ${cedant.nombreTitresCedes || "?"} (${pct}% du capital)
- Prix : ${data.prix.prixTotal || "[non renseigné]"}

PV :
- Type : ${pv.typeAssemblee}
- Ville : ${pv.ville || data.ville || "[non renseigné]"}
- Date : ${pv.date || data.date || "[non renseigné]"}
${pv.typeAssemblee === "AGE" ? `- Heure : ${pv.heure || ""}
- Mode de convocation : ${pv.convocationMode || "lettre recommandée"}
- Date de convocation : ${pv.convocationDate || ""}
- Président de séance : ${pv.presidentCivilite || ""} ${pv.presidentNom || ""} ${pv.presidentPrenom || ""}, qualité : ${pv.presidentQualite || ""}
- Questions écrites préalables : ${pv.questionsEcrites ? "Oui" : "Non"}` : ""}

CHANGEMENT DE DIRIGEANT : ${pv.changementDirigeant ? "OUI" : "NON"}
${
  pv.changementDirigeant
    ? `DIRIGEANT SORTANT :
- ${pv.ancienDirigeantCivilite || ""} ${pv.ancienDirigeantNom || ""} ${pv.ancienDirigeantPrenom || ""}, né(e) le ${pv.ancienDirigeantDateNaissance || ""}
- Fonction : ${pv.ancienDirigeantFonction || ""}

${nouveauDirigeantBlock}
- Fonction attribuée : ${pv.nouveauDirigeantFonction || ""}
- Durée du mandat : ${pv.dureeMandat || "illimitée"}`
    : ""
}

INSTRUCTIONS :
1. Rédige le PV COMPLET avec toutes les résolutions nécessaires dans l'ordre logique
2. Résolutions obligatoires : ${pv.changementDirigeant ? "Démission dirigeant, Nomination nouveau dirigeant, " : ""}Approbation du nouvel associé, Agrément de la cession, Constatation de la cession (avec tableau de répartition du capital), Délégation de pouvoirs pour formalités
3. La résolution "Constatation de la cession" doit inclure un tableau de répartition du capital APRÈS cession
4. La délégation de pouvoirs doit mentionner "LEGALCORNERS, 78 Avenue des Champs-Élysées, 75008 Paris"
5. Toutes les résolutions sont adoptées à l'unanimité
6. Termine par les signatures appropriées selon le type d'assemblée
7. Style juridique professionnel français`;
}

function buildDeclarationNonCondamnation(data: FormData): string {
  const pv = data.pv;
  const cessionnaire = data.cessionnaire;
  const ville = pv.ville || data.ville || "[ville]";
  const dateSignature = pv.date || data.date || "[date]";

  const isPM = pv.nouveauDirigeantTypePersonne === "morale";

  // Identité du signataire
  const civilite = isPM ? (pv.rpCivilite || "M.") : (cessionnaire.physique?.civilite || pv.nouveauDirigeantCivilite || "M.");
  const nom = isPM ? (pv.rpNom || "") : (cessionnaire.physique?.nom || pv.nouveauDirigeantNom || "");
  const prenom = isPM ? (pv.rpPrenom || "") : (cessionnaire.physique?.prenom || pv.nouveauDirigeantPrenom || "");
  const dateNaissance = isPM ? (pv.rpDateNaissance || "") : (cessionnaire.physique?.dateNaissance || pv.nouveauDirigeantDateNaissance || "");
  const villeNaissance = isPM ? (pv.rpVilleNaissance || "") : (pv.nouveauDirigeantVilleNaissance || cessionnaire.physique?.villeNaissance || "");
  const nationalite = isPM ? (pv.rpNationalite || "française") : (pv.nouveauDirigeantNationalite || cessionnaire.physique?.nationalite || "française");
  const adresse = isPM ? (pv.rpAdresse || "") : (cessionnaire.physique?.adresse || pv.nouveauDirigeantAdresse || "");
  const nomPere = isPM ? (pv.rpNomPere || "") : (pv.nouveauDirigeantNomPere || "");
  const prenomPere = isPM ? (pv.rpPrenomPere || "") : (pv.nouveauDirigeantPrenomPere || "");
  const nomMere = isPM ? (pv.rpNomMere || "") : (pv.nouveauDirigeantNomMere || "");
  const prenomMere = isPM ? (pv.rpPrenomMere || "") : (pv.nouveauDirigeantPrenomMere || "");
  const genreFils = civilite === "Mme" ? "Fille" : "Fils";

  // Qualité dans la société
  const qualite = isPM
    ? `représentant permanent de ${pv.nouveauDirigeantDenomination || "[PM]"}, ${pv.nouveauDirigeantFonction || "dirigeant"}`
    : (pv.nouveauDirigeantFonction || "dirigeant");

  return `DÉCLARATION DE NON-CONDAMNATION ET DE FILIATION DU DIRIGEANT

══════════════════════════════════════════════════════════════════

Je soussigné(e) : ${civilite} ${nom.toUpperCase()}, ${prenom}

Né(e) le : ${dateNaissance}
À : ${villeNaissance}
De nationalité : ${nationalite}
Demeurant : ${adresse}

${genreFils} de : Monsieur ${nomPere.toUpperCase()} ${prenomPere}
Et de : Madame ${nomMere.toUpperCase()} ${prenomMere}

──────────────────────────────────────────────────────────────────

En ma qualité de ${qualite} de la société ${data.societe.denomination || "[Société]"} (${data.societe.formeJuridique || ""}), immatriculée au RCS de ${data.societe.rcsVille || ""} sous le n° ${data.societe.rcsNumero || ""},

Déclare, conformément aux dispositions de l'article A 123-51 du Code de commerce, relatif au Registre du Commerce et des Sociétés,

* n'avoir jamais fait l'objet d'aucune condamnation pénale ni de sanction civile ou administrative de nature à m'interdire, soit d'exercer une activité commerciale, soit de gérer, d'administrer ou de diriger une personne morale.

──────────────────────────────────────────────────────────────────

Fait à ${ville}, le ${dateSignature}

__________________________
${nom.toUpperCase()} ${prenom}
(Signature précédée de la mention manuscrite "Lu et approuvé")`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formData, type }: { formData: FormData; type: "acte" | "pv" | "both" } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY non configurée" },
        { status: 500 }
      );
    }

    async function generateActe(): Promise<string> {
      const stream = client.messages.stream({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 6000,
        messages: [{ role: "user", content: buildPromptActe(formData) }],
      });
      const response = await stream.finalMessage();
      const block = response.content.find((b) => b.type === "text");
      return block && block.type === "text" ? block.text : "";
    }

    async function generatePV(): Promise<string> {
      const stream = client.messages.stream({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        messages: [{ role: "user", content: buildPromptPV(formData) }],
      });
      const response = await stream.finalMessage();
      const block = response.content.find((b) => b.type === "text");
      return block && block.type === "text" ? block.text : "";
    }

    const [acte, pv] = await Promise.all([
      type === "acte" || type === "both" ? generateActe() : Promise.resolve(undefined),
      type === "pv" || type === "both" ? generatePV() : Promise.resolve(undefined),
    ]);

    // Génère la déclaration de non-condamnation si changement de dirigeant
    const declaration =
      formData.pv.changementDirigeant
        ? buildDeclarationNonCondamnation(formData)
        : undefined;

    return NextResponse.json({ acte, pv, declaration });
  } catch (error) {
    console.error("Erreur génération documents:", error);
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "Clé API invalide" }, { status: 401 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Limite API atteinte, réessayez dans quelques secondes" },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de la génération" },
      { status: 500 }
    );
  }
}
