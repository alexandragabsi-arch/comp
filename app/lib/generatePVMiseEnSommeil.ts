
function n(v?: string) {
  return v?.trim() || "[À COMPLÉTER]";
}

export interface MiseEnSommeilData {
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

  // Options mise en sommeil
  dureeMiseEnSommeil: string; // en mois (max 24)
  datePriseEffet: string;
  adresseSiegeMaintenue: boolean;
  dirigeantMaintenu: boolean;
  dirigeantCivilite?: "M." | "Mme";
  dirigeantNom?: string;
  dirigeantPrenom?: string;
  dirigeantQualite?: string;
}

export function generatePVMiseEnSommeil(data: MiseEnSommeilData): string {
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
  const confere = isPlural ? "confèrent" : "confère";
  const entendus = isPlural ? "entendus" : "entendu";
  const convoqueSingPlur = isPlural ? "les associés" : "l'associé unique";

  let doc = "";

  // ── En-tête société
  doc += `${n(data.denomination)}\n`;
  doc += `${n(data.formeJuridique)} au capital de ${n(data.capital)} €\n`;
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
  doc += `MISE EN SOMMEIL DE LA SOCIÉTÉ\n`;
  doc += `${"═".repeat(60)}\n\n`;

  // ── Ouverture
  if (data.typeAssemblee === "associe_unique") {
    const civilite = data.associeUniqueCivilite ? `${data.associeUniqueCivilite} ` : "";
    const nom = `${n(data.associeUniqueNom)} ${n(data.associeUniquePrenom)}`.trim();
    doc += `Le ${n(data.date)}, l'associé unique, ${civilite}${nom}, a pris les décisions suivantes :\n`;
    doc += `- La mise en sommeil (cessation temporaire d'activité) de la Société ;\n`;
    doc += `- Les modalités de la mise en sommeil.\n\n`;
  } else if (data.typeAssemblee === "unanime") {
    doc += `Le ${n(data.date)}, la totalité des associés de la société ${n(data.denomination)} réunis ont pris unanimement les décisions suivantes :\n`;
    doc += `- La mise en sommeil (cessation temporaire d'activité) de la Société ;\n`;
    doc += `- Les modalités de la mise en sommeil.\n\n`;
  } else {
    const heure = data.heure ? ` à ${data.heure}` : "";
    doc += `Le ${n(data.date)}${heure}, les associés de la société susnommée, se sont réunis en Assemblée générale extraordinaire.\n\n`;
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
    const presidentQualite = n(data.presidentQualite);
    doc += `L'Assemblée est présidée par ${presidentCiv}${presidentNom}, en sa qualité de ${presidentQualite}.\n\n`;
    doc += `Le Président constate que l'Assemblée, régulièrement constituée, peut valablement délibérer.\n\n`;
    doc += `L'Assemblée est réunie à l'effet de délibérer sur l'ordre du jour suivant :\n`;
    doc += `- La mise en sommeil de la Société ;\n`;
    doc += `- Les modalités de la cessation temporaire d'activité.\n\n`;
  }

  // ── Résolution 1 — Mise en sommeil
  doc += `${"─".repeat(60)}\n`;
  doc += `RÉSOLUTION 1 — MISE EN SOMMEIL DE LA SOCIÉTÉ\n`;
  doc += `${"─".repeat(60)}\n\n`;

  doc += `${titreAss}, après avoir ${entendus} l'exposé du dirigeant sur la situation de la Société, ${decide} de la mise en sommeil (cessation temporaire d'activité) de la société ${n(data.denomination)} à compter du ${n(data.datePriseEffet)}.\n\n`;

  doc += `Cette cessation temporaire d'activité est décidée pour une durée de ${n(data.dureeMiseEnSommeil)} mois, conformément aux dispositions de l'article R.123-130-2 du Code de commerce.\n\n`;

  doc += `Il est rappelé que la mise en sommeil ne peut excéder une durée de deux ans. À l'issue de ce délai, le greffe du Tribunal de commerce pourra procéder à la radiation d'office de la société du registre du commerce et des sociétés.\n\n`;

  doc += `La résolution est adoptée à l'unanimité.\n\n`;

  // ── Résolution 2 — Maintien du siège et du dirigeant
  doc += `${"─".repeat(60)}\n`;
  doc += `RÉSOLUTION 2 — MAINTIEN DU SIÈGE SOCIAL ET DES FONCTIONS DE DIRECTION\n`;
  doc += `${"─".repeat(60)}\n\n`;

  if (data.adresseSiegeMaintenue) {
    doc += `${titreAss} ${decide} que le siège social de la Société est maintenu à l'adresse suivante : ${n(data.adresse)}.\n\n`;
  } else {
    doc += `${titreAss} ${decide} que le siège social de la Société est maintenu à son adresse actuelle.\n\n`;
  }

  if (data.dirigeantMaintenu) {
    const dirCiv = data.dirigeantCivilite ? `${data.dirigeantCivilite} ` : "";
    const dirNom = `${n(data.dirigeantNom)} ${n(data.dirigeantPrenom)}`.trim();
    const dirQualite = n(data.dirigeantQualite);
    doc += `${titreAss} ${decide} que ${dirCiv}${dirNom} est maintenu(e) dans ses fonctions de ${dirQualite} pendant toute la durée de la mise en sommeil.\n\n`;
  } else {
    doc += `${titreAss} ${decide} que le dirigeant actuel est maintenu dans ses fonctions pendant toute la durée de la mise en sommeil.\n\n`;
  }

  doc += `Le dirigeant conserve l'ensemble de ses pouvoirs tels que définis par les statuts et la loi, notamment pour assurer la conservation du patrimoine social et répondre aux obligations légales de la Société.\n\n`;

  doc += `La résolution est adoptée à l'unanimité.\n\n`;

  // ── Résolution 3 — Obligations pendant la mise en sommeil
  doc += `${"─".repeat(60)}\n`;
  doc += `RÉSOLUTION 3 — OBLIGATIONS PENDANT LA PÉRIODE DE MISE EN SOMMEIL\n`;
  doc += `${"─".repeat(60)}\n\n`;

  doc += `${titreAss} ${decide} que pendant la période de mise en sommeil, la Société devra :\n\n`;
  doc += `- Continuer à établir et déposer ses comptes annuels ;\n`;
  doc += `- Maintenir son immatriculation au RCS avec la mention « mise en sommeil » ;\n`;
  doc += `- Effectuer les déclarations fiscales et sociales obligatoires ;\n`;
  doc += `- Convoquer ${convoqueSingPlur} en assemblée annuelle pour l'approbation des comptes.\n\n`;

  doc += `La résolution est adoptée à l'unanimité.\n\n`;

  // ── Résolution 4 — Formalités
  doc += `${"─".repeat(60)}\n`;
  doc += `RÉSOLUTION 4 — POUVOIRS POUR LES FORMALITÉS\n`;
  doc += `${"─".repeat(60)}\n\n`;

  doc += `${titreAss} ${confere} tous pouvoirs au porteur d'une copie ou d'un extrait du présent procès-verbal à l'effet d'accomplir toutes les formalités légales, et notamment :\n\n`;
  doc += `- La déclaration de cessation temporaire d'activité auprès du guichet unique de l'INPI ;\n`;
  doc += `- L'inscription modificative au Registre du Commerce et des Sociétés ;\n`;
  doc += `- Toute publication requise.\n\n`;

  doc += `La résolution est adoptée à l'unanimité.\n\n`;

  // ── Clôture
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

  doc += `${"─".repeat(60)}\n`;
  doc += `Document confidentiel — Template LegalTech Professionnel — Ne constitue pas un conseil juridique\n`;

  return doc;
}
