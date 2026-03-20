
function n(v?: string) {
  return v?.trim() || "[À COMPLÉTER]";
}

export interface LiquidationData {
  // Société
  denomination: string;
  formeJuridique: string;
  capital: string;
  rcsVille: string;
  rcsNumero: string;
  adresse: string;
  nombrePartsTotal: string;

  // Assemblée
  typeAssemblee: "associe_unique" | "unanime" | "AGE";
  date: string;
  ville: string;
  heure?: string;

  // Associé unique
  associeUniqueCivilite?: "M." | "Mme";
  associeUniqueNom?: string;
  associeUniquePrenom?: string;

  // AGE
  partsPresentes?: string;
  presidentCivilite?: "M." | "Mme";
  presidentNom?: string;
  presidentPrenom?: string;
  presidentQualite?: string;
  hasCac?: boolean;
  cacNom?: string;
  cacPresent?: boolean;
  hasCe?: boolean;
  cePresent?: boolean;

  // Liquidation
  dateArretComptes: string;
  soldeLiquidation: "positif" | "negatif";
  montantSolde: string;
  dateCloture: string;

  // Liquidateur
  typeLiquidateur: "physique" | "morale";
  liquidateurCivilite?: "M." | "Mme";
  liquidateurNom?: string;
  liquidateurPrenom?: string;
  liquidateurDenomination?: string;
  liquidateurRepresentant?: string;

  // Votes AGE
  toutesResUnanimesAGE?: boolean;
  res5Pour?: string; res5Contre?: string; res5Abstentions?: string;
  res6Pour?: string; res6Contre?: string; res6Abstentions?: string;
  res7Pour?: string; res7Contre?: string; res7Abstentions?: string;
  res8Pour?: string; res8Contre?: string; res8Abstentions?: string;
}

function voteResult(
  typeAssemblee: "associe_unique" | "unanime" | "AGE",
  toutUnanimite: boolean,
  pour?: string, contre?: string, abstentions?: string
): string {
  if (typeAssemblee !== "AGE" || toutUnanimite) {
    return "La résolution est adoptée à l'unanimité.\n\n";
  }
  return `La résolution est adoptée avec ${n(pour)} votes en faveur de la résolution, ${n(contre)} votes contre et ${n(abstentions)} abstentions.\n\n`;
}

export function generatePVLiquidation(data: LiquidationData): string {
  const typeTitre = ["SARL", "EURL", "SNC", "SCI"].includes(data.formeJuridique)
    ? "parts sociales"
    : "actions";

  const titreAss =
    data.typeAssemblee === "AGE"
      ? "L'assemblée des associés"
      : data.typeAssemblee === "unanime"
      ? "L'unanimité des associés"
      : "L'associé unique";

  const isPlural = data.typeAssemblee !== "associe_unique";
  const decide = isPlural ? "décident" : "décide";
  const donne = isPlural ? "donnent" : "donne";
  const approuve = isPlural ? "approuvent" : "approuve";
  const entendus = isPlural ? "entendus" : "entendu";

  const toutesUnanimesAGE = data.toutesResUnanimesAGE !== false;

  let doc = "";

  // ── En-tête société
  doc += `${n(data.denomination)}\n`;
  doc += `${n(data.formeJuridique)} en liquidation au capital de ${n(data.capital)} €\n`;
  doc += `Immatriculée au RCS de ${n(data.rcsVille)} sous le numéro ${n(data.rcsNumero)}\n`;
  doc += `Siège social : ${n(data.adresse)}\n\n`;
  doc += `${"═".repeat(60)}\n`;

  // ── Titre PV
  if (data.typeAssemblee === "associe_unique") {
    doc += `PROCÈS-VERBAL DE DÉCISIONS DE L'ASSOCIÉ UNIQUE\n`;
  } else if (data.typeAssemblee === "AGE") {
    doc += `PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE EXTRAORDINAIRE\n`;
  } else {
    doc += `PROCÈS-VERBAL DE DÉCISIONS UNANIMES DES ASSOCIÉS\n`;
  }
  doc += `CLÔTURE DE LIQUIDATION\n`;
  doc += `${"═".repeat(60)}\n\n`;

  // ── Ouverture
  if (data.typeAssemblee === "associe_unique") {
    const civilite = data.associeUniqueCivilite ? `${data.associeUniqueCivilite} ` : "";
    const nom = `${n(data.associeUniqueNom)} ${n(data.associeUniquePrenom)}`.trim();
    doc += `Le ${n(data.date)}, à ${n(data.heure)}, à ${n(data.ville)}, l'associé unique de la société, ${civilite}${nom}, a pris les décisions suivantes :\n`;
    doc += `- Approbation des comptes de liquidation ;\n`;
    doc += `- Répartition du solde de liquidation (boni ou mali) ;\n`;
    doc += `- Clôture définitive des opérations de liquidation.\n\n`;
  } else if (data.typeAssemblee === "unanime") {
    doc += `Le ${n(data.date)}, la totalité des associés de la société ${n(data.denomination)} réunis ont pris unanimement les décisions suivantes :\n`;
    doc += `- Approbation des comptes de liquidation ;\n`;
    doc += `- Répartition du solde de liquidation ;\n`;
    doc += `- Clôture définitive des opérations de liquidation.\n\n`;
  } else {
    const heure = data.heure ? ` à ${data.heure}` : "";
    doc += `Le ${n(data.date)}${heure}, les associés de la Société susnommée, se sont réunis en Assemblée générale extraordinaire.\n\n`;
    doc += `L'Assemblée a été convoquée par le président de la Société.\n\n`;

    const partsPresentes = data.partsPresentes || "[XXX]";
    const partsTotal = data.nombrePartsTotal || "[XXX]";
    doc += `Les associés présents et, le cas échéant, représentés, totalisent ${partsPresentes} ${typeTitre} sur un total de ${partsTotal} ${typeTitre}.\n\n`;
    doc += `Les conditions de quorum nécessaires pour cette Assemblée sont donc remplies.\n\n`;

    if (data.hasCac) {
      const cacNom = data.cacNom ? `${data.cacNom}, commissaire aux comptes,` : "Le commissaire aux comptes,";
      const presenceCAC = data.cacPresent ? "présent" : "absent";
      doc += `${cacNom} régulièrement convoqué, est ${presenceCAC}.\n\n`;
    }

    if (data.hasCe) {
      const presenceCE = data.cePresent ? "présents" : "absents";
      doc += `Les représentants du Comité d'entreprise, régulièrement convoqués, sont ${presenceCE}.\n\n`;
    }

    const presidentCiv = data.presidentCivilite ? `${data.presidentCivilite} ` : "";
    const presidentNom = `${n(data.presidentNom)} ${n(data.presidentPrenom)}`.trim();
    doc += `Le Président constate que l'Assemblée, régulièrement constituée, peut valablement délibérer.\n\n`;

    doc += `Le Président dépose sur le bureau et met à la disposition des associés :\n`;
    doc += `- la copie de la lettre de convocation adressée à chaque associé ;\n`;
    doc += `- la feuille de présence ;\n`;
    doc += `- un exemplaire des statuts ;\n`;
    doc += `- le texte des résolutions proposées à l'Assemblée ;\n`;
    doc += `- les comptes de liquidation ;\n`;
    doc += `- le rapport du liquidateur.\n\n`;
    doc += `Aucune question écrite n'a été posée par les associés.\n\n`;
    doc += `L'Assemblée est réunie à l'effet de délibérer sur l'ordre du jour suivant :\n`;
    doc += `- La clôture de la liquidation de la Société.\n\n`;
  }

  const soldeLabel = data.soldeLiquidation === "positif" ? "positif" : "négatif";

  // ── Résolution 5 — Approbation des comptes
  doc += `${"─".repeat(60)}\n`;
  doc += `RÉSOLUTION 5 — APPROBATION DES COMPTES DE LIQUIDATION\n`;
  doc += `${"─".repeat(60)}\n\n`;

  doc += `${titreAss}, après avoir ${entendus} lecture du rapport du liquidateur sur l'ensemble des opérations de liquidation et avoir pris connaissance des comptes définitifs arrêtés le ${n(data.dateArretComptes)} faisant ressortir un solde ${soldeLabel} de liquidation d'un montant de ${n(data.montantSolde)} €, ${approuve} lesdits comptes.\n\n`;

  doc += voteResult(data.typeAssemblee, toutesUnanimesAGE, data.res5Pour, data.res5Contre, data.res5Abstentions);

  // ── Résolution 6 — Répartition du solde
  doc += `${"─".repeat(60)}\n`;
  doc += `RÉSOLUTION 6 — RÉPARTITION DU SOLDE DE LIQUIDATION\n`;
  doc += `${"─".repeat(60)}\n\n`;

  doc += `${titreAss}, après avoir entendu le liquidateur sur l'ensemble des opérations de liquidation et avoir pris connaissance des comptes définitifs arrêtés le ${n(data.dateArretComptes)}, ${decide} de répartir le solde ${soldeLabel} de liquidation s'élevant à ${n(data.montantSolde)} € de la façon suivante :\n\n`;

  if (data.soldeLiquidation === "positif") {
    const beneficiaire = data.typeAssemblee === "associe_unique"
      ? "de l'associé unique"
      : "des associés";
    doc += `– Attribution du boni au profit ${beneficiaire} conformément aux dispositions prévues par les statuts. À défaut de précision statutaire, le boni de liquidation est réparti entre les associés en proportion de leurs droits dans le capital social.\n\n`;
  } else {
    doc += `– Remboursement partiel des titres souscrits après apurement du passif.\n\n`;
  }

  doc += voteResult(data.typeAssemblee, toutesUnanimesAGE, data.res6Pour, data.res6Contre, data.res6Abstentions);

  // ── Résolution 7 — Clôture
  doc += `${"─".repeat(60)}\n`;
  doc += `RÉSOLUTION 7 — CLÔTURE DÉFINITIVE DES OPÉRATIONS DE LIQUIDATION\n`;
  doc += `${"─".repeat(60)}\n\n`;

  doc += `${titreAss} ${donne} :\n\n`;
  doc += `- quitus au liquidateur de sa gestion et le décharge de son mandat ;\n`;
  doc += `- constate la fin des opérations de liquidation et prononce la clôture définitive de la liquidation.\n\n`;

  doc += voteResult(data.typeAssemblee, toutesUnanimesAGE, data.res7Pour, data.res7Contre, data.res7Abstentions);

  // ── Résolution 8 — Formalités
  doc += `${"─".repeat(60)}\n`;
  doc += `RÉSOLUTION 8 — POUVOIR EN VUE D'ACCOMPLIR LES FORMALITÉS\n`;
  doc += `${"─".repeat(60)}\n\n`;

  doc += `${titreAss} ${donne} tous pouvoirs au porteur d'une copie ou d'un extrait du présent procès-verbal pour effectuer la demande de radiation de la société du registre du commerce et des sociétés et accomplir les formalités de publicité afférentes aux décisions ci-dessus adoptées conformément aux dispositions législatives et réglementaires en vigueur.\n\n`;

  doc += voteResult(data.typeAssemblee, toutesUnanimesAGE, data.res8Pour, data.res8Contre, data.res8Abstentions);

  // ── Clôture
  if (data.typeAssemblee === "AGE" || data.typeAssemblee === "unanime") {
    doc += `L'ordre du jour étant épuisé, et personne ne demandant la parole, la séance est levée.\n\n`;
  }

  doc += `${"─".repeat(60)}\n\n`;
  doc += `De tout ce qui précède, il a été dressé le présent procès-verbal.\n\n`;
  doc += `Fait à ${n(data.ville)}, le ${n(data.date)}\n\n`;

  // ── Signatures
  if (data.typeAssemblee === "associe_unique") {
    const civ = data.associeUniqueCivilite ? `${data.associeUniqueCivilite} ` : "";
    const nom = `${n(data.associeUniqueNom)} ${n(data.associeUniquePrenom)}`.trim();
    doc += `L'ASSOCIÉ UNIQUE\n\n`;
    doc += `${civ}${nom}\n`;
    doc += `Signature : _________________________\n\n`;
  } else if (data.typeAssemblee === "unanime") {
    doc += `SIGNATURE DE TOUS LES ASSOCIÉS\n\n`;
    doc += `Signature : _________________________\n\n`;
  } else {
    doc += `LE PRÉSIDENT DE SÉANCE\n\n`;
    const civ = data.presidentCivilite ? `${data.presidentCivilite} ` : "";
    doc += `${civ}${n(data.presidentNom)} ${n(data.presidentPrenom)}\n`;
    doc += `Signature : _________________________\n\n`;
  }

  // Signature liquidateur
  doc += `NOM ET SIGNATURE DU LIQUIDATEUR\n\n`;
  if (data.typeLiquidateur === "physique") {
    const civ = data.liquidateurCivilite ? `${data.liquidateurCivilite} ` : "";
    doc += `${civ}${n(data.liquidateurNom)} ${n(data.liquidateurPrenom)}\n`;
  } else {
    doc += `${n(data.liquidateurDenomination)}, représentée par ${n(data.liquidateurRepresentant)}\n`;
  }
  doc += `Signature : _________________________\n\n`;

  doc += `${"─".repeat(60)}\n`;
  doc += `Document confidentiel — Template LegalTech Professionnel — Ne constitue pas un conseil juridique\n`;

  return doc;
}
