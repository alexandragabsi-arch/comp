
function n(v?: string) {
  return v?.trim() || "[À COMPLÉTER]";
}

export interface DissolutionData {
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

  // Liquidateur
  typeLiquidateur: "physique" | "morale";
  liquidateurCivilite?: "M." | "Mme";
  liquidateurNom?: string;
  liquidateurPrenom?: string;
  liquidateurAdresse?: string;
  estActuelGerant?: boolean;
  liquidateurDenomination?: string;
  liquidateurRcsVille?: string;
  liquidateurRcsNumero?: string;
  liquidateurRepresentant?: string;

  // Options
  siegeLiquidation: "siege" | "domicile" | "autre";
  adresseLiquidationAutre?: string;
  hasRemuneration: boolean;
  remunerationMontant?: string;

  // Votes AGE (par résolution)
  toutesResUnanimesAGE?: boolean;
  res1Pour?: string; res1Contre?: string; res1Abstentions?: string;
  res2Pour?: string; res2Contre?: string; res2Abstentions?: string;
  res3Pour?: string; res3Contre?: string; res3Abstentions?: string;
  res4Pour?: string; res4Contre?: string; res4Abstentions?: string;
}

function voteResult(
  typeAssemblee: "associe_unique" | "unanime" | "AGE",
  toutUnanimiite: boolean,
  pour?: string, contre?: string, abstentions?: string
): string {
  if (typeAssemblee !== "AGE" || toutUnanimiite) {
    return "La résolution est adoptée à l'unanimité.\n\n";
  }
  return `La résolution est adoptée avec ${n(pour)} votes en faveur de la résolution, ${n(contre)} votes contre et ${n(abstentions)} abstentions.\n\n`;
}

export function generatePVDissolution(data: DissolutionData): string {
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
  const nomme = isPlural ? "nomment" : "nomme";
  const donne = isPlural ? "donnent" : "donne";
  const confere = isPlural ? "confèrent" : "confère";
  const met = isPlural ? "mettent" : "met";
  const entendus = isPlural ? "entendus" : "entendu";
  const convoqueSingPlur = isPlural ? "les associés" : "l'associé unique";

  const toutesUnanimesAGE = data.toutesResUnanimesAGE !== false;

  let doc = "";

  // ── En-tête société ──────────────────────────────────────────────────────────
  doc += `${n(data.denomination)}\n`;
  doc += `${n(data.formeJuridique)} au capital de ${n(data.capital)} €\n`;
  doc += `Immatriculée au RCS de ${n(data.rcsVille)} sous le numéro ${n(data.rcsNumero)}\n`;
  doc += `Siège social : ${n(data.adresse)}\n\n`;
  doc += `${"═".repeat(60)}\n`;

  // ── Titre PV selon type ──────────────────────────────────────────────────────
  if (data.typeAssemblee === "associe_unique") {
    doc += `PROCÈS-VERBAL DE DÉCISIONS DE L'ASSOCIÉ UNIQUE\n`;
  } else if (data.typeAssemblee === "AGE") {
    doc += `PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE EXTRAORDINAIRE\n`;
  } else {
    doc += `PROCÈS-VERBAL DE DÉCISIONS UNANIMES DES ASSOCIÉS\n`;
  }
  doc += `${"═".repeat(60)}\n\n`;

  // ── Ouverture ────────────────────────────────────────────────────────────────
  if (data.typeAssemblee === "associe_unique") {
    const civilite = data.associeUniqueCivilite ? `${data.associeUniqueCivilite} ` : "";
    const nom = `${n(data.associeUniqueNom)} ${n(data.associeUniquePrenom)}`.trim();
    doc += `Le ${n(data.date)}, l'associé unique, ${civilite}${nom}, a pris les décisions suivantes :\n`;
    doc += `- La dissolution de la Société ;\n`;
    doc += `- La nomination d'un Liquidateur.\n\n`;
  } else if (data.typeAssemblee === "unanime") {
    doc += `Le ${n(data.date)}, la totalité des associés de la société ${n(data.denomination)} réunis ont pris unanimement les décisions suivantes :\n`;
    doc += `- La dissolution de la Société ;\n`;
    doc += `- La nomination d'un Liquidateur.\n\n`;
  } else {
    // AGE
    const heure = data.heure ? ` à ${data.heure}` : "";
    doc += `Le ${n(data.date)}${heure}, les associés de la société susnommée, se sont réunis en Assemblée générale extraordinaire.\n\n`;
    doc += `L'Assemblée a été convoquée par le président de la Société.\n\n`;

    const partsPresentes = data.partsPresentes || "[XXX]";
    const partsTotal = data.nombrePartsTotal || "[XXX]";
    doc += `Les associés présents et, le cas échéant, représentés, totalisent ${partsPresentes} ${typeTitre} sur un total de ${partsTotal} ${typeTitre}.\n\n`;
    doc += `Les conditions de quorum nécessaires pour cette Assemblée sont donc remplies.\n\n`;

    // CAC
    if (data.hasCac) {
      const cacNom = data.cacNom ? `${data.cacNom}, commissaire aux comptes,` : "Le commissaire aux comptes,";
      const presenceCAC = data.cacPresent ? "présent" : "absent";
      doc += `${cacNom} régulièrement convoqué, est ${presenceCAC}.\n\n`;
    }

    // CE
    if (data.hasCe) {
      const presenceCE = data.cePresent ? "présents" : "absents";
      doc += `Les représentants du Comité d'entreprise, régulièrement convoqués, sont ${presenceCE}.\n\n`;
    }

    const presidentCiv = data.presidentCivilite ? `${data.presidentCivilite} ` : "";
    const presidentNom = `${n(data.presidentNom)} ${n(data.presidentPrenom)}`.trim();
    const presidentQualite = n(data.presidentQualite);
    doc += `L'Assemblée est présidée par ${presidentCiv}${presidentNom}, en sa qualité de ${presidentQualite}.\n\n`;
    doc += `Le Président constate que l'Assemblée, régulièrement constituée, peut valablement délibérer.\n\n`;
    doc += `Le Président dépose sur le bureau et met à la disposition des associés :\n`;
    doc += `- la copie de la lettre de convocation adressée à chaque associé ;\n`;
    doc += `- la feuille de présence ;\n`;
    doc += `- un exemplaire des statuts ;\n`;
    doc += `- le texte des résolutions proposées à l'Assemblée.\n\n`;
    doc += `Aucune question écrite n'a été posée par les associés.\n\n`;
    doc += `L'Assemblée est réunie à l'effet de délibérer sur l'ordre du jour suivant :\n`;
    doc += `- La dissolution de la Société ;\n`;
    doc += `- La nomination du liquidateur.\n\n`;
  }

  // ── Résolution 1 — Dissolution ───────────────────────────────────────────────
  doc += `${"─".repeat(60)}\n`;
  doc += `RÉSOLUTION 1 — DISSOLUTION\n`;
  doc += `${"─".repeat(60)}\n\n`;

  doc += `${titreAss} après avoir ${entendus} lecture du rapport de gestion, ${decide} de la dissolution anticipée de la Société dénommée ${n(data.denomination)} à compter de ce jour et sa liquidation amiable conformément aux dispositions des articles L.237-1 à 237-13 du Code de commerce.\n\n`;
  doc += `La Société subsistera pour les besoins de la liquidation et jusqu'à la clôture de celle-ci.\n\n`;
  doc += `Durant cette période, la dénomination sociale sera suivie de la mention « société en liquidation ». Cette mention ainsi que le nom du liquidateur devront figurer sur tous les documents et actes destinés aux tiers.\n\n`;

  // Siège de liquidation
  if (data.siegeLiquidation === "siege") {
    doc += `Le siège social de la liquidation est fixé au siège de la Société.\n\n`;
  } else if (data.siegeLiquidation === "domicile") {
    doc += `Le siège social de la liquidation est fixé au domicile du liquidateur.\n\n`;
  } else {
    doc += `Le siège social de la liquidation est fixé à l'adresse suivante : ${n(data.adresseLiquidationAutre)}.\n\n`;
  }

  doc += voteResult(data.typeAssemblee, toutesUnanimesAGE, data.res1Pour, data.res1Contre, data.res1Abstentions);

  // ── Résolution 2 — Nomination du liquidateur ─────────────────────────────────
  doc += `${"─".repeat(60)}\n`;
  doc += `RÉSOLUTION 2 — NOMINATION DU LIQUIDATEUR\n`;
  doc += `${"─".repeat(60)}\n\n`;

  if (data.typeLiquidateur === "physique") {
    const civ = data.liquidateurCivilite ? `${data.liquidateurCivilite} ` : "";
    const nom = `${n(data.liquidateurNom)} ${n(data.liquidateurPrenom)}`.trim();
    const gerant = data.estActuelGerant ? ", actuel gérant/président de la Société," : "";
    const adresse = n(data.liquidateurAdresse);
    doc += `${titreAss} ${nomme} en qualité de Liquidateur et pour une durée maximum d'1 (un) an, ${civ}${nom}${gerant}, demeurant au ${adresse}.\n\n`;
  } else {
    const denomination = n(data.liquidateurDenomination);
    const rcsVille = n(data.liquidateurRcsVille);
    const rcsNum = n(data.liquidateurRcsNumero);
    const representant = n(data.liquidateurRepresentant);
    doc += `${titreAss} ${nomme} en qualité de Liquidateur et pour une durée maximum d'1 (un) an, la société dénommée ${denomination} inscrite au registre du commerce et des sociétés de ${rcsVille} sous le numéro ${rcsNum}, représentée par ${representant} qui déclare disposer de tous pouvoirs à l'effet des présentes.\n\n`;
  }

  doc += `${titreAss} ${met} ainsi fin aux fonctions du gérant/président à compter de ce jour.\n\n`;
  doc += `Dans les six mois de sa nomination, le Liquidateur doit convoquer ${convoqueSingPlur} en assemblée générale ordinaire, à l'effet de leur faire un rapport sur la situation comptable de la société, sur la poursuite des opérations de liquidation et sur le délai nécessaire pour les terminer.\n\n`;

  if (data.hasRemuneration) {
    doc += `${titreAss} ${decide} que le liquidateur a droit en contrepartie de l'exercice de son mandat, à une rémunération de ${n(data.remunerationMontant)} euros mensuelle.\n\n`;
  }

  doc += voteResult(data.typeAssemblee, toutesUnanimesAGE, data.res2Pour, data.res2Contre, data.res2Abstentions);

  // ── Résolution 3 — Missions du liquidateur ───────────────────────────────────
  doc += `${"─".repeat(60)}\n`;
  doc += `RÉSOLUTION 3 — MISSIONS DU LIQUIDATEUR\n`;
  doc += `${"─".repeat(60)}\n\n`;

  doc += `${titreAss} ${donne} au liquidateur les pouvoirs les plus étendus pour mener à bien sa mission, c'est-à-dire réaliser l'actif, payer le passif et répartir le solde entre les associés, sous réserve des dispositions des articles L.237-1 et suivants du Code de commerce.\n\n`;
  doc += `Il est autorisé à continuer les affaires en cours pour les besoins de la liquidation exclusivement.\n\n`;
  doc += `Le liquidateur est tenu de réunir ${convoqueSingPlur} en assemblée générale ordinaire au moins une fois par an, dans les trois mois de la clôture de l'exercice social, en vue d'approuver les comptes annuels.\n\n`;

  doc += voteResult(data.typeAssemblee, toutesUnanimesAGE, data.res3Pour, data.res3Contre, data.res3Abstentions);

  // ── Résolution 4 — Délégation de pouvoirs ───────────────────────────────────
  doc += `${"─".repeat(60)}\n`;
  doc += `RÉSOLUTION 4 — DÉLÉGATION DE POUVOIRS EN VUE DES FORMALITÉS\n`;
  doc += `${"─".repeat(60)}\n\n`;

  doc += `${titreAss} ${confere} tous pouvoirs au porteur d'une copie ou d'un extrait du présent procès-verbal à l'effet d'accomplir toutes les formalités légales.\n\n`;

  doc += voteResult(data.typeAssemblee, toutesUnanimesAGE, data.res4Pour, data.res4Contre, data.res4Abstentions);

  // ── Clôture ──────────────────────────────────────────────────────────────────
  doc += `${"─".repeat(60)}\n\n`;
  doc += `De tout ce qui précède, il a été dressé le présent procès-verbal.\n\n`;
  doc += `Fait à ${n(data.ville)}, le ${n(data.date)}\n\n`;

  // ── Signatures ───────────────────────────────────────────────────────────────
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
  doc += `EN QUALITÉ DE LIQUIDATEUR\n\n`;
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
