// ── SASU Statuts Builder — 40 articles complets ──────────────────────────────
// Generates markdown text for SASU statutes matching professional law-firm quality.
// Each TITRE section is built by a dedicated function for maintainability.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Answers = Record<string, any>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function numberToWords(n: number): string {
  if (isNaN(n) || n === 0) return "zéro";
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"];
  const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];
  if (n < 17) return units[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    if (t === 7) return "soixante-" + numberToWords(10 + u);
    if (t === 8 && u === 0) return "quatre-vingts";
    if (t === 8) return "quatre-vingt-" + units[u];
    if (t === 9) return "quatre-vingt-" + numberToWords(10 + u);
    return tens[t] + (u ? "-" + units[u] : "");
  }
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    const prefix = h === 1 ? "cent" : units[h] + " cent" + (rest === 0 ? "s" : "");
    return prefix + (rest ? " " + numberToWords(rest) : "");
  }
  if (n < 1000000) {
    const k = Math.floor(n / 1000);
    const rest = n % 1000;
    const prefix = k === 1 ? "mille" : numberToWords(k) + " mille";
    return prefix + (rest ? " " + numberToWords(rest) : "");
  }
  return String(n);
}

function fmtDate(date?: string): string {
  if (!date) return new Date().toLocaleDateString("fr-FR");
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString("fr-FR");
}

function fmtNum(n: number): string {
  return n.toLocaleString("fr-FR");
}

// ── Variable preparation ─────────────────────────────────────────────────────

interface V {
  // Company
  denomination: string;
  sigle: string;
  enseigne: string;
  nomCommercial: string;
  siege: string;
  capital: number;
  capitalLetters: string;
  nbActions: number;
  valeurAction: number;
  objet: string;

  // Flags
  isPhysique: boolean;
  isHoldingPassive: boolean;
  isHoldingAnimatrice: boolean;
  isCapitalVariable: boolean;
  isVersementPartiel: boolean;
  isVersementTotal: boolean;
  hasApportNature: boolean;
  hasApportIndustrie: boolean;
  apportIndustrieDesc: string;
  hasDG: boolean;
  isPresidentAssocie: boolean;
  isSimplifiee: boolean;

  // Associé physique
  civAssocie: string;
  prenomAssocie: string;
  nomAssocie: string;
  adresseAssocie: string;
  dateNaissAssocie: string;
  lieuNaissAssocie: string;
  natAssocie: string;

  // Associé PM
  denomAssociePM: string;
  formeAssociePM: string;
  capitalAssociePM: string;
  adresseAssociePM: string;
  sirenAssociePM: string;
  villeRCSAssociePM: string;
  representantAssociePM: string;

  // Situation matrimoniale
  sitMatrimoniale: string;
  regimeMatrimonial: string;
  conjointCivilite: string;
  conjointPrenom: string;
  conjointNom: string;

  // Résidence fiscale
  residentFiscal: boolean;
  paysResidence: string;

  // Président
  presidentNomination: string;
  dureeMandat: string;
  mandatRenouvelable: string;
  revocationPresident: string;
  presidentRemunere: string;
  limitationPouvoirs: boolean;
  montantLimitation: string;
  majoritePresident: string;

  // DG
  dgNomination: string;
  dgPouvoirs: string;

  // Capital
  capitalMin: number;
  capitalMinLetters: string;
  capitalMax: number;
  capitalMaxLetters: string;
  pourcentageVerse: string;
  banqueDepot: string;
  dateDepot: string;

  // Durée
  duree: string;
  dureeLetters: string;

  // Exercice
  clotureExercice: string;
  clotureProlongee: boolean;

  // Fiscal
  regimeFiscal: string;

  // Transmission
  cessionActions: string;
  majoriteAgrement: string;
  transmissionHeritiers: string[];

  // Nantissement
  nantissementAutorise: boolean;
  locationActions: boolean;

  // Non-concurrence
  nonConcurrence: boolean;
  dureeNonConcurrence: string;
  perimetreNonConcurrence: string;
  indemniteNonConcurrence: boolean;
  montantIndemniteNC: string;

  // Comptes courants
  tauxCC: string;
  tauxCCValeur: string;
  plafondCC: boolean;
  montantPlafondCC: string;

  // Management fees
  managementFees: boolean;
  managementFeesPct: string;

  // Cash pooling
  cashPooling: boolean;
  cashPoolingPlafond: string;
  cashPoolingTaux: string;

  // Dutreil
  pacteDutreil: boolean;
  pacteDutreilDuree: string;

  // CAC
  nommerCAC: boolean;
  cacDenomination: string;
  cacAdresse: string;
  cacNumeroCNCC: string;

  // Dépenses
  hasDepenses: boolean;

  // Signature
  dateSignature: string;
  lieuSignature: string;
  signatureAssocie: string;

  // Majority decisions
  majoriteDecisions: string;
}

function prep(a: Answers): V {
  const isPhysique = a.type_associe !== "morale";
  const capital = Number(a.capital_social) || 1;
  const isSimplifiee = a.formule_capital !== "personnalisee";
  const valeurAction = isSimplifiee ? 1 : (Number(a.valeur_action) || 1);
  const nbActions = Math.floor(capital / valeurAction);
  const isPresidentAssocie = a.president_option === "associe";
  const hasDG = a.nommer_dg === "oui";
  const siege = a.adresse_siege || "[ADRESSE DU SIÈGE]";
  const duree = a.duree_societe === "personnalisee" ? (a.duree_societe_annees || "99") : "99";

  // Président nomination text
  let presidentNomination = "";
  if (isPresidentAssocie && isPhysique) {
    presidentNomination = `${a.associe_civilite === "Mme" ? "Madame" : "Monsieur"} ${a.associe_prenom || "[PRÉNOM]"} ${a.associe_nom || "[NOM]"}, né(e) le ${fmtDate(a.associe_date_naissance)} à ${a.associe_lieu_naissance || "[LIEU]"}, domicilié(e) à ${a.associe_adresse || "[ADRESSE]"}.`;
  } else if (isPresidentAssocie && !isPhysique) {
    presidentNomination = `La société ${a.associe_societe_nom || "[DÉNOMINATION]"}, immatriculée au RCS sous le n° ${a.associe_societe_siren || "[SIREN]"}, représentée par son représentant permanent ${a.associe_societe_representant || "[REPRÉSENTANT]"}.`;
  } else if (a.president_type === "physique") {
    presidentNomination = `${a.president_civilite === "Mme" ? "Madame" : "Monsieur"} ${a.president_prenom || "[PRÉNOM]"} ${a.president_nom || "[NOM]"}, né(e) le ${fmtDate(a.president_date_naissance)} à ${a.president_lieu_naissance || "[LIEU]"}, domicilié(e) à ${a.president_adresse || "[ADRESSE]"}.`;
  } else {
    presidentNomination = `La société ${a.president_pm_nom || "[DÉNOMINATION]"}, immatriculée au RCS sous le n° ${a.president_pm_siren || "[SIREN]"}, représentée par son représentant permanent ${a.president_rp_civilite === "Mme" ? "Madame" : "Monsieur"} ${a.president_rp_prenom || "[PRÉNOM]"} ${a.president_rp_nom || "[NOM]"}.`;
  }

  // DG nomination
  let dgNomination = "";
  if (hasDG) {
    dgNomination = `${a.dg_civilite === "Mme" ? "Madame" : "Monsieur"} ${a.dg_prenom || "[PRÉNOM]"} ${a.dg_nom || "[NOM]"}, né(e) le ${fmtDate(a.dg_date_naissance)}, domicilié(e) à ${a.dg_adresse || "[ADRESSE]"}.`;
  }

  // Régime matrimonial label
  const regimeLabel = a.regime_matrimonial === "communaute_reduite" ? "la communauté réduite aux acquêts"
    : a.regime_matrimonial === "separation_biens" ? "la séparation de biens"
    : a.regime_matrimonial === "participation_acquets" ? "la participation aux acquêts"
    : a.regime_matrimonial === "communaute_universelle" ? "la communauté universelle"
    : "[RÉGIME]";

  // Cloture exercice
  let clotureExercice = "31 décembre";
  if (a.cloture_exercice === "autre_permanente" && a.cloture_date_permanente) {
    clotureExercice = a.cloture_date_permanente;
  }

  // Transmission heritiers
  const transmissionHeritiers: string[] = a.transmission_heritiers ? a.transmission_heritiers.split(",").filter(Boolean) : [];

  // Rémunération label
  const presidentRemunere = a.president_remunere === "oui_office" ? "fixee"
    : a.president_remunere === "oui_ulterieur" ? "possible"
    : "non";

  // Signature
  const signatureAssocie = isPhysique
    ? `${a.associe_prenom || "[PRÉNOM]"} ${a.associe_nom || "[NOM]"} — Associé(e) unique${isPresidentAssocie ? " et Président(e)" : ""}`
    : `${a.associe_societe_nom || "[DÉNOMINATION]"} — Associé(e) unique${isPresidentAssocie ? " et Président(e)" : ""}`;

  return {
    denomination: a.nom_societe || a.denomination_sociale || "[DÉNOMINATION]",
    sigle: a.sigle || "",
    enseigne: a.enseigne || "",
    nomCommercial: a.nom_commercial || "",
    siege,
    capital,
    capitalLetters: numberToWords(capital),
    nbActions,
    valeurAction,
    objet: a.objet_social || "[OBJET SOCIAL]",
    isPhysique,
    isHoldingPassive: a.type_structure === "holding_passive",
    isHoldingAnimatrice: a.type_structure === "holding_animatrice",
    isCapitalVariable: a.type_capital === "variable",
    isVersementPartiel: a.etat_versement === "partiel" || a.versement_capital === "partiel",
    isVersementTotal: a.etat_versement !== "partiel" && a.versement_capital !== "partiel",
    hasApportNature: a.apport_nature === "oui",
    hasApportIndustrie: a.apport_industrie === "oui",
    apportIndustrieDesc: a.apport_industrie_description || "",
    hasDG,
    isPresidentAssocie,
    isSimplifiee,
    civAssocie: a.associe_civilite === "Mme" ? "Madame" : "Monsieur",
    prenomAssocie: a.associe_prenom || "[PRÉNOM]",
    nomAssocie: a.associe_nom || "[NOM]",
    adresseAssocie: a.associe_adresse || "[ADRESSE]",
    dateNaissAssocie: fmtDate(a.associe_date_naissance),
    lieuNaissAssocie: a.associe_lieu_naissance || "[LIEU]",
    natAssocie: a.associe_nationalite || "française",
    denomAssociePM: a.associe_societe_nom || "[DÉNOMINATION]",
    formeAssociePM: a.associe_societe_forme || "[FORME]",
    capitalAssociePM: a.associe_societe_capital || "[CAPITAL]",
    adresseAssociePM: a.associe_societe_adresse || "[ADRESSE]",
    sirenAssociePM: a.associe_societe_siren || "[SIREN]",
    villeRCSAssociePM: a.associe_societe_ville_rcs || "[VILLE RCS]",
    representantAssociePM: a.associe_societe_representant || "[REPRÉSENTANT]",
    sitMatrimoniale: a.situation_matrimoniale || "",
    regimeMatrimonial: regimeLabel,
    conjointCivilite: a.conjoint_civilite === "Mme" ? "Madame" : "Monsieur",
    conjointPrenom: a.conjoint_prenom || "",
    conjointNom: a.conjoint_nom || "[CONJOINT]",
    residentFiscal: a.resident_fiscal !== "non",
    paysResidence: a.pays_residence_fiscale || "[PAYS]",
    presidentNomination,
    dureeMandat: a.duree_mandat === "determinee"
      ? `${a.duree_mandat_annees || "[X]"} ans`
      : "indéterminée",
    mandatRenouvelable: a.renouvellement_mandat === "non_renouvelable" ? "non renouvelable" : "renouvelable",
    revocationPresident: a.revocation_president === "juste_motif" ? "juste_motif" : "libre",
    presidentRemunere,
    limitationPouvoirs: a.limitation_pouvoirs === "oui",
    montantLimitation: a.montant_limitation || "[MONTANT]",
    majoritePresident: a.majorite_president === "renforcee" ? `${a.majorite_president_pct || "66"} %`
      : a.majorite_president === "unanimite" ? "l'unanimité"
      : "plus de 50 %",
    dgNomination,
    dgPouvoirs: a.dg_pouvoirs || "interne",
    capitalMin: Number(a.capital_minimum) || capital,
    capitalMinLetters: numberToWords(Number(a.capital_minimum) || capital),
    capitalMax: Number(a.capital_maximum) || capital * 10,
    capitalMaxLetters: numberToWords(Number(a.capital_maximum) || capital * 10),
    pourcentageVerse: a.pourcentage_verse || "50",
    banqueDepot: a.banque_depot || a.etablissement_depot || "[ÉTABLISSEMENT BANCAIRE]",
    dateDepot: fmtDate(a.date_depot),
    duree,
    dureeLetters: numberToWords(Number(duree)),
    clotureExercice,
    clotureProlongee: a.cloture_prolongee === "oui",
    regimeFiscal: a.regime_fiscal === "ir" ? "ir" : "is",
    cessionActions: a.cession_actions || "libre",
    majoriteAgrement: a.majorite_agrement_pct || "50",
    transmissionHeritiers,
    nantissementAutorise: a.nantissement_actions !== "non",
    locationActions: a.location_actions === "oui",
    nonConcurrence: a.non_concurrence === "oui",
    dureeNonConcurrence: a.duree_non_concurrence || "1",
    perimetreNonConcurrence: a.perimetre_non_concurrence || "France métropolitaine",
    indemniteNonConcurrence: a.indemnite_non_concurrence === "oui",
    montantIndemniteNC: a.montant_indemnite_non_concurrence || "[MONTANT]",
    tauxCC: a.taux_compte_courant || "legal",
    tauxCCValeur: a.taux_cc_valeur || "[TAUX]",
    plafondCC: a.plafond_compte_courant === "oui",
    montantPlafondCC: a.montant_plafond_cc || "[MONTANT]",
    managementFees: a.management_fees === "oui",
    managementFeesPct: a.management_fees_pct || "[X]",
    cashPooling: a.cash_pooling === "oui",
    cashPoolingPlafond: a.cash_pooling_plafond || "[MONTANT]",
    cashPoolingTaux: a.cash_pooling_taux || "[X]",
    pacteDutreil: a.pacte_dutreil === "oui",
    pacteDutreilDuree: a.pacte_dutreil_duree || "2",
    nommerCAC: a.nommer_cac === "oui",
    cacDenomination: a.cac_denomination || "[DÉNOMINATION CAC]",
    cacAdresse: a.cac_adresse || "[ADRESSE CAC]",
    cacNumeroCNCC: a.cac_numero_cncc || "[N° CNCC]",
    hasDepenses: a.reprise_depenses === "oui",
    dateSignature: fmtDate(a.date_signature),
    lieuSignature: a.lieu_signature_type === "autre" ? (a.lieu_signature_autre || siege) : siege,
    signatureAssocie,
    majoriteDecisions: a.majorite_decisions === "renforcee" ? `${a.majorite_decisions_pct || "66"} %`
      : a.majorite_decisions === "unanimite" ? "l'unanimité"
      : "la majorité simple",
  };
}

// ── Section builders ─────────────────────────────────────────────────────────
// PLACEHOLDER: These will be filled by parallel agents

export function buildCouverture(v: V): string {
  const capital = `${fmtNum(v.capital)} (${v.capitalLetters})`;
  return [
    "# STATUTS CONSTITUTIFS",
    "Société par Actions Simplifiée Unipersonnelle",
    "",
    "===",
    "",
    `Dénomination sociale : **${v.denomination}**`,
    "",
    `Capital social : **${capital} euros**`,
    "",
    `Siège social : **${v.siege}**`,
    "",
    "===",
  ].join("\n");
}
export function buildSommaire(v: V): string {
  const lines: string[] = [
    "## SOMMAIRE",
    "",
    "**DÉCLARATIONS PRÉLIMINAIRES ET TERMINOLOGIE**",
    "",
    "**TITRE 1 — CARACTÉRISTIQUES DE LA SOCIÉTÉ**",
    "",
    "- Art. 1 — Forme de la Société",
    "- Art. 2 — Objet social",
    "- Art. 3 — Dénomination sociale",
    "- Art. 4 — Siège social",
    "- Art. 5 — Durée de la Société",
    "",
    "**TITRE 2 — APPORTS — CAPITAL SOCIAL — ACTIONS**",
    "",
    "- Art. 6 — Apports",
    "- Art. 7 — Capital social",
  ];

  if (v.isCapitalVariable) {
    lines.push("- Art. 8 — Variabilité du capital");
  } else {
    lines.push("- Art. 8 — Augmentation et réduction du capital");
  }

  lines.push(
    "- Art. 9 — Actions",
    "- Art. 10 — Libération des actions",
    "- Art. 11 — Droits et obligations attachés aux actions",
    "- Art. 12 — Indivisibilité des actions",
    "",
    "**TITRE 3 — CESSION ET TRANSMISSION DES ACTIONS**",
    "",
    "- Art. 13 — Cession des actions",
    "- Art. 14 — Agrément",
    "- Art. 15 — Transmission des actions",
    "- Art. 16 — Nantissement des actions",
    "- Art. 17 — Location des actions",
    "",
    "**TITRE 4 — DIRECTION ET ADMINISTRATION DE LA SOCIÉTÉ**",
    "",
    "- Art. 18 — Président",
    "- Art. 19 — Pouvoirs du Président",
    "- Art. 20 — Rémunération du Président",
    "- Art. 21 — Responsabilité du Président",
  );

  if (v.hasDG) {
    lines.push(
      "- Art. 22 — Directeur Général",
      "- Art. 23 — Pouvoirs du Directeur Général",
    );
  } else {
    lines.push(
      "- Art. 22 — Directeur Général *(réservé)*",
      "- Art. 23 — Pouvoirs du Directeur Général *(réservé)*",
    );
  }

  lines.push(
    "- Art. 24 — Conventions réglementées",
    "",
    "**TITRE 5 — DÉCISIONS DE L'ASSOCIÉ UNIQUE**",
    "",
    "- Art. 25 — Compétence de l'Associé unique",
    "- Art. 26 — Modalités des décisions",
    "- Art. 27 — Droit de communication",
    "- Art. 28 — Registre des décisions",
    "",
    "**TITRE 6 — COMPTES SOCIAUX — AFFECTATION DU RÉSULTAT**",
    "",
    "- Art. 29 — Exercice social",
    "- Art. 30 — Comptes annuels",
    "- Art. 31 — Affectation et répartition du résultat",
    "- Art. 32 — Dividendes",
    "- Art. 33 — Comptes courants d'associé",
  );

  if (v.nommerCAC) {
    lines.push("- Art. 34 — Commissaire aux comptes");
  } else {
    lines.push("- Art. 34 — Commissaire aux comptes *(réservé)*");
  }

  lines.push(
    "",
    "**TITRE 7 — DISPOSITIONS DIVERSES**",
    "",
    "- Art. 35 — Non-concurrence",
    "- Art. 36 — Transformation de la Société",
    "- Art. 37 — Dissolution — Liquidation",
    "- Art. 38 — Contestations",
    "- Art. 39 — Actes accomplis pour le compte de la Société en formation",
    "- Art. 40 — Formalités",
  );

  return lines.join("\n");
}
export function buildDeclarations(v: V): string {
  const sections: string[] = [];

  // ── Header ──
  sections.push("## DÉCLARATIONS PRÉLIMINAIRES ET TERMINOLOGIE");

  // ── 1. Identification de l'Associé unique ──
  sections.push("");
  sections.push("**Identification de l'Associé unique**");
  sections.push("");

  if (v.isPhysique) {
    sections.push(
      `${v.civAssocie} ${v.prenomAssocie} ${v.nomAssocie},`,
      `demeurant à ${v.adresseAssocie},`,
      `né(e) le ${v.dateNaissAssocie} à ${v.lieuNaissAssocie},`,
      `de nationalité ${v.natAssocie},`,
    );
  } else {
    sections.push(
      `La société **${v.denomAssociePM}**, ${v.formeAssociePM} au capital de ${v.capitalAssociePM} euros,`,
      `dont le siège social est situé à ${v.adresseAssociePM},`,
      `immatriculée au Registre du Commerce et des Sociétés de ${v.villeRCSAssociePM} sous le numéro SIREN ${v.sirenAssociePM},`,
      `représentée par ${v.representantAssociePM}, dûment habilité(e) aux fins des présentes,`,
    );
  }

  sections.push("");
  sections.push("ci-après dénommé(e) l'« **Associé unique** »,");
  sections.push("");
  sections.push("a établi ainsi qu'il suit les statuts de la Société par Actions Simplifiée Unipersonnelle devant régir la société.");

  // ── 2. Situation matrimoniale et résidence fiscale (physique only) ──
  if (v.isPhysique) {
    sections.push("");
    sections.push("**Situation matrimoniale et résidence fiscale**");
    sections.push("");

    switch (v.sitMatrimoniale) {
      case "celibataire":
        sections.push("L'Associé unique déclare être célibataire.");
        break;
      case "marie":
        sections.push(
          `L'Associé unique déclare être marié(e) avec ${v.conjointCivilite} ${v.conjointPrenom} ${v.conjointNom} sous le régime de ${v.regimeMatrimonial}.`,
        );
        break;
      case "pacse":
        sections.push(
          `L'Associé unique déclare être lié(e) par un pacte civil de solidarité avec ${v.conjointCivilite} ${v.conjointPrenom} ${v.conjointNom}.`,
        );
        break;
      case "divorce":
        sections.push("L'Associé unique déclare être divorcé(e).");
        break;
      case "veuf":
        sections.push("L'Associé unique déclare être veuf(ve).");
        break;
      default:
        sections.push("L'Associé unique déclare être célibataire.");
        break;
    }

    sections.push("");

    if (v.residentFiscal) {
      sections.push("L'Associé unique déclare être résident fiscal français.");
    } else {
      sections.push(
        `L'Associé unique déclare ne pas être résident fiscal français. Sa résidence fiscale est établie en ${v.paysResidence}.`,
      );
    }
  }

  // ── 3. Déclarations de l'Associé unique ──
  sections.push("");
  sections.push("**Déclarations de l'Associé unique**");
  sections.push("");
  sections.push("L'Associé unique déclare :");
  sections.push("");
  sections.push("- que les informations communiquées ci-dessus sont exactes et sincères ;");
  sections.push("- qu'il jouit de la pleine capacité juridique nécessaire pour souscrire aux présents statuts et s'obliger en conséquence ;");
  sections.push("- avoir obtenu toutes les autorisations nécessaires à la réalisation des apports et à la constitution de la Société ;");
  sections.push("- qu'il n'existe aucun obstacle légal, réglementaire, contractuel ou judiciaire à la constitution de la Société ni à l'exercice de son activité ;");
  sections.push("- ne faire l'objet d'aucune interdiction de gérer, d'administrer ou de diriger une personne morale, ni d'aucune mesure d'incapacité.");

  // ── 4. Terminologie ──
  sections.push("");
  sections.push("**Terminologie**");
  sections.push("");
  sections.push("Dans les présents statuts, les termes ci-après ont la signification suivante :");
  sections.push("");
  sections.push("- **« Associé unique »** ou **« Associé »** : désigne la personne physique ou morale détenant la totalité des actions composant le capital social de la Société, telle qu'identifiée ci-dessus. En cas de pluralité d'associés, les termes « Associé unique » et « Associé » s'entendront comme désignant l'ensemble des associés, et les décisions de l'Associé unique seront prises en assemblée générale ;");
  sections.push("");
  sections.push("- **« Président »** : désigne la personne physique ou morale nommée en qualité de Président de la Société, conformément aux stipulations du Titre 4 des présents statuts. Le Président est le représentant légal de la Société ;");
  sections.push("");

  if (v.hasDG) {
    sections.push("- **« Directeur Général »** ou **« DG »** : désigne la personne physique nommée en qualité de Directeur Général de la Société, conformément aux stipulations du Titre 4 des présents statuts. Le Directeur Général dispose des pouvoirs qui lui sont conférés par l'Associé unique lors de sa nomination ;");
    sections.push("");
  }

  if (v.hasDG && (v.isHoldingAnimatrice || v.isHoldingPassive)) {
    sections.push("- **« Directeur Général Délégué »** ou **« DGD »** : désigne, le cas échéant, la personne physique nommée en qualité de Directeur Général Délégué de la Société, disposant des pouvoirs qui lui sont délégués par le Directeur Général, sous réserve de l'approbation de l'Associé unique ;");
    sections.push("");
  }

  if (v.isHoldingAnimatrice) {
    sections.push("- **« Groupe »** : désigne l'ensemble constitué par la Société et les sociétés qu'elle contrôle au sens de l'article L. 233-3 du Code de commerce, dont elle assure la direction effective en tant que holding animatrice, participant activement à la conduite de la politique du Groupe et au contrôle de ses filiales ;");
    sections.push("");
  }

  sections.push("- **« Statuts »** : désigne les présents statuts constitutifs de la Société, tels qu'ils pourront être modifiés de temps à autre par décision de l'Associé unique.");

  return sections.join("\n");
}
export function buildTitre1(v: V): string {
  const lines: string[] = [];

  // ── TITRE 1 ──
  lines.push("## TITRE 1 — CARACTÉRISTIQUES DE LA SOCIÉTÉ");
  lines.push("");

  // ── Article 1 — Forme de la Société ──
  lines.push("### Article 1 — Forme de la Société");
  lines.push("");
  lines.push(
    "La Société est une Société par Actions Simplifiée Unipersonnelle (SASU) régie par les articles L.227-1 et suivants du Code de commerce, ainsi que par les présents statuts."
  );
  lines.push("");
  lines.push(
    "Elle est constituée par un Associé unique qui exerce les pouvoirs dévolus à la collectivité des associés par les dispositions du Code de commerce relatives aux sociétés par actions simplifiées."
  );
  lines.push("");
  lines.push(
    "La Société pourra ultérieurement comprendre plusieurs associés, notamment à la suite de cession ou de transmission d'actions, d'augmentation de capital ou de fusion. Dans ce cas, elle sera soumise aux dispositions légales et réglementaires applicables aux sociétés par actions simplifiées pluripersonnelles, et les présents statuts seront adaptés en conséquence par décision collective des associés."
  );
  lines.push("");
  lines.push(
    "La Société ne peut procéder à une offre au public de titres financiers ni à l'admission de ses actions aux négociations sur un marché réglementé."
  );
  lines.push("");

  // ── Article 2 — Objet social ──
  lines.push("### Article 2 — Objet social");
  lines.push("");

  if (v.isHoldingPassive) {
    lines.push("La Société a pour objet, en France et à l'étranger :");
    lines.push("");
    lines.push(
      "- La prise, la gestion, la détention et la cession de participations, par tous moyens, directement ou indirectement, dans toutes sociétés et entreprises, quelles qu'en soient la forme et l'activité ;"
    );
    lines.push(
      "- La gestion et la mise en valeur de son patrimoine mobilier et immobilier ;"
    );
    lines.push(
      "- L'acquisition, la souscription, la détention, la gestion et la cession de tous titres, valeurs mobilières, droits sociaux et instruments financiers ;"
    );
    lines.push(
      "- L'octroi de cautions, avals, garanties et sûretés au profit des sociétés et entités dans lesquelles la Société détient une participation, directe ou indirecte ;"
    );
    lines.push("");
    lines.push(
      "La Société n'exercera aucune activité opérationnelle ou commerciale propre. Son activité sera exclusivement limitée à la détention et à la gestion de participations."
    );
  } else if (v.isHoldingAnimatrice) {
    lines.push("La Société a pour objet, en France et à l'étranger :");
    lines.push("");
    lines.push(
      "- L'animation effective du groupe de sociétés qu'elle contrôle, par la participation active à la conduite de leur politique et au contrôle de leur gestion, ainsi que par la fourniture de services spécifiques, administratifs, juridiques, comptables, financiers, immobiliers et de gestion au profit de ses filiales ;"
    );
    lines.push(
      "- La prise, la gestion, la détention et la cession de participations, par tous moyens, directement ou indirectement, dans toutes sociétés et entreprises, quelles qu'en soient la forme et l'activité ;"
    );
    lines.push(
      "- La définition et la mise en œuvre de la stratégie du groupe, la coordination des activités des filiales et la supervision de leur gestion opérationnelle ;"
    );
    lines.push(
      "- La facturation de prestations de management fees, de services administratifs, comptables, juridiques, financiers et de toute nature au profit des sociétés du groupe ;"
    );
    lines.push(
      "- L'acquisition, la souscription, la détention, la gestion et la cession de tous titres, valeurs mobilières, droits sociaux et instruments financiers ;"
    );
    lines.push(
      "- L'octroi de cautions, avals, garanties et sûretés au profit des sociétés et entités dans lesquelles la Société détient une participation, directe ou indirecte ;"
    );
    lines.push("");
    lines.push(
      "En sa qualité de holding animatrice au sens de la doctrine administrative et de la jurisprudence du Conseil d'État, la Société participe activement à la conduite de la politique du groupe et au contrôle des filiales, et rend à ces dernières des prestations de services de nature administrative, comptable, juridique et financière. Cette qualité est susceptible de permettre l'application du dispositif prévu aux articles 787 B et 787 C du Code général des impôts (pacte Dutreil), sous réserve du respect de l'ensemble des conditions légales et réglementaires en vigueur."
    );
  } else {
    lines.push("La Société a pour objet :");
    lines.push("");
    lines.push(v.objet);
  }

  lines.push("");
  lines.push(
    "Et, plus généralement, toutes opérations économiques, juridiques, industrielles, commerciales, civiles, financières, mobilières ou immobilières, pouvant se rattacher directement ou indirectement à l'objet social ou à tout objet similaire, connexe ou complémentaire, ou susceptibles d'en favoriser le développement, l'extension ou la réalisation."
  );
  lines.push("");

  // ── Article 3 — Dénomination ──
  lines.push("### Article 3 — Dénomination sociale");
  lines.push("");
  lines.push(`La dénomination sociale de la Société est : **${v.denomination}**`);
  lines.push("");

  if (v.sigle) {
    lines.push(`La Société pourra également être désignée par le sigle : **${v.sigle}**`);
    lines.push("");
  }
  if (v.enseigne) {
    lines.push(`La Société utilisera l'enseigne suivante : **${v.enseigne}**`);
    lines.push("");
  }
  if (v.nomCommercial) {
    lines.push(`La Société exercera son activité sous le nom commercial suivant : **${v.nomCommercial}**`);
    lines.push("");
  }

  lines.push(
    "Dans tous les actes, factures, annonces, publications et autres documents émanant de la Société et destinés aux tiers, la dénomination sociale devra toujours être précédée ou suivie de la mention « SASU » ou « Société par Actions Simplifiée Unipersonnelle » et de l'indication du montant du capital social, ainsi que du numéro d'immatriculation au Registre du Commerce et des Sociétés, conformément aux dispositions légales et réglementaires en vigueur."
  );
  lines.push("");

  // ── Article 4 — Siège social ──
  lines.push("### Article 4 — Siège social");
  lines.push("");
  lines.push(`Le siège social est fixé au : **${v.siege}**`);
  lines.push("");
  lines.push(
    "Il pourra être transféré en tout autre endroit du même département ou d'un département limitrophe par simple décision du Président, sous réserve de ratification de cette décision par l'Associé unique lors de la prochaine décision ordinaire."
  );
  lines.push("");
  lines.push(
    "Le transfert du siège social en tout autre lieu du territoire français ou à l'étranger ne pourra être décidé que par décision de l'Associé unique, dans les conditions prévues aux présents statuts pour la modification des statuts."
  );
  lines.push("");
  lines.push(
    "Des agences, succursales, bureaux, dépôts et tout autre établissement secondaire pourront être créés, en France ou à l'étranger, par simple décision du Président."
  );
  lines.push("");

  // ── Article 5 — Durée ──
  lines.push("### Article 5 — Durée de la Société");
  lines.push("");
  lines.push(
    `La durée de la Société est fixée à **${v.duree}** (${v.dureeLetters}) années à compter de la date de son immatriculation au Registre du Commerce et des Sociétés, sauf dissolution anticipée ou prorogation.`
  );
  lines.push("");
  lines.push(
    "Un an au moins avant la date d'expiration de la Société, le Président devra consulter l'Associé unique à l'effet de décider si la Société doit être prorogée ou non."
  );
  lines.push("");
  lines.push(
    "À défaut de consultation, tout associé pourra demander au président du Tribunal de commerce, statuant sur requête, la désignation d'un mandataire de justice chargé de provoquer la consultation prévue ci-dessus."
  );
  lines.push("");
  lines.push(
    "La décision de prorogation de la durée de la Société est prise par décision de l'Associé unique, dans les conditions prévues aux présents statuts."
  );
  lines.push("");

  // ── Article 6 — Continuation en cas de décès ──
  lines.push("### Article 6 — Continuation de la Société en cas de décès de l'Associé unique");
  lines.push("");
  lines.push(
    "En cas de décès de l'Associé unique, la Société continuera de plein droit avec ses héritiers, légataires universels ou à titre universel, ainsi qu'avec ses ayants droit, lesquels acquerront de plein droit la qualité d'associé."
  );
  lines.push("");
  lines.push(
    "Les héritiers et ayants droit de l'Associé unique décédé devront justifier de leur qualité auprès du Président dans les meilleurs délais à compter du décès, par la production de tout acte ou document officiel attestant de leur qualité d'héritier ou d'ayant droit (acte de notoriété, attestation notariée, ordonnance d'envoi en possession, etc.)."
  );
  lines.push("");
  lines.push(
    "Dans l'hypothèse où plusieurs héritiers ou ayants droit viendraient à recueillir les actions de l'Associé unique décédé, ceux-ci devront désigner un mandataire commun chargé de les représenter auprès de la Société, tant que les actions resteront dans l'indivision. À défaut d'accord entre les héritiers, le mandataire commun sera désigné en justice à la demande de la partie la plus diligente."
  );
  lines.push("");
  lines.push(
    "Pendant la période comprise entre le décès de l'Associé unique et la désignation du mandataire commun, le Président continuera d'assurer la gestion courante de la Société et ne pourra prendre aucune décision excédant les actes de gestion courante, sauf urgence dûment justifiée."
  );
  lines.push("");
  lines.push(
    "Si la Société vient à comprendre plusieurs associés à la suite de la transmission des actions aux héritiers, les statuts seront mis en conformité avec les dispositions applicables aux sociétés par actions simplifiées pluripersonnelles, par décision collective des associés prise dans les conditions prévues par la loi et les présents statuts."
  );
  lines.push("");

  return lines.join("\n");
}
export function buildTitre2(v: V): string {
  const lines: string[] = [];

  // ── TITRE 2 ──
  lines.push("## TITRE 2 — APPORTS ET CAPITAL SOCIAL");
  lines.push("");

  // ── Article 7 — Apports ──
  lines.push("### Article 7 — Apports");
  lines.push("");

  if (v.isSimplifiee) {
    lines.push(
      `Il a été apporté à la Société, lors de sa constitution, une somme totale de **${fmtNum(v.capital)} euros** (${v.capitalLetters} euros), correspondant à des apports en numéraire intégralement libérés.`
    );
    lines.push("");
    lines.push(
      `Cette somme a été intégralement versée et déposée sur un compte ouvert au nom de la Société en formation auprès de **${v.banqueDepot}**, en date du **${fmtDate(v.dateDepot)}**, ainsi qu'il résulte du certificat de dépôt des fonds établi par ledit établissement.`
    );
    lines.push("");
    lines.push(
      "Les fonds ainsi déposés seront mis à la disposition du Président de la Société dès son immatriculation au Registre du Commerce et des Sociétés, sur présentation de l'extrait K-bis."
    );
  } else {
    // ── Apports en numéraire ──
    lines.push("**7.1 — Apports en numéraire**");
    lines.push("");

    if (v.isVersementTotal) {
      lines.push(
        `L'Associé unique a apporté à la Société une somme de **${fmtNum(v.capital)} euros** (${v.capitalLetters} euros), à titre d'apport en numéraire, intégralement libérée lors de la constitution.`
      );
      lines.push("");
      lines.push(
        `Cette somme a été déposée sur un compte ouvert au nom de la Société en formation auprès de **${v.banqueDepot}**, en date du **${fmtDate(v.dateDepot)}**, ainsi qu'il résulte du certificat de dépôt des fonds établi par ledit établissement.`
      );
    } else {
      lines.push(
        `L'Associé unique a apporté à la Société une somme de **${fmtNum(v.capital)} euros** (${v.capitalLetters} euros), à titre d'apport en numéraire.`
      );
      lines.push("");
      lines.push(
        `Sur cette somme, **${v.pourcentageVerse} %** ont été libérés lors de la constitution, soit la somme de **${fmtNum(Math.round(v.capital * Number(v.pourcentageVerse) / 100))} euros**, déposée sur un compte ouvert au nom de la Société en formation auprès de **${v.banqueDepot}**, en date du **${fmtDate(v.dateDepot)}**, ainsi qu'il résulte du certificat de dépôt des fonds établi par ledit établissement.`
      );
      lines.push("");
      lines.push(
        "Le solde, soit la somme restant à libérer, devra être versé en une ou plusieurs fois, sur appel du Président, dans un délai maximum de cinq (5) ans à compter de la date d'immatriculation de la Société au Registre du Commerce et des Sociétés, conformément aux dispositions de l'article L.227-1 du Code de commerce."
      );
    }
    lines.push("");
    lines.push(
      "Les fonds ainsi déposés seront mis à la disposition du Président de la Société dès son immatriculation au Registre du Commerce et des Sociétés, sur présentation de l'extrait K-bis."
    );

    // ── Apports en nature ──
    if (v.hasApportNature) {
      lines.push("");
      lines.push("**7.2 — Apports en nature**");
      lines.push("");
      lines.push(
        "L'Associé unique a effectué des apports en nature à la Société, dont la description, l'évaluation et les conditions figurent en annexe des présents statuts."
      );
      lines.push("");
      lines.push(
        "Conformément aux dispositions de l'article L.227-1 du Code de commerce renvoyant à l'article L.225-14 du même code, les apports en nature ont été évalués au vu d'un rapport établi sous sa responsabilité par un commissaire aux apports désigné à l'unanimité des associés ou, à défaut, par ordonnance du président du Tribunal de commerce."
      );
      lines.push("");
      lines.push(
        "Les associés ont décidé, conformément à la loi, de retenir l'évaluation figurant dans le rapport du commissaire aux apports. Le transfert de propriété des biens apportés est réalisé à compter de l'immatriculation de la Société au Registre du Commerce et des Sociétés."
      );
    }

    // ── Apports en industrie ──
    if (v.hasApportIndustrie) {
      lines.push("");
      lines.push(v.hasApportNature ? "**7.3 — Apports en industrie**" : "**7.2 — Apports en industrie**");
      lines.push("");
      if (v.apportIndustrieDesc) {
        lines.push(
          `L'Associé unique réalise, en complément de son apport en numéraire, un apport en industrie consistant en la mise à disposition de la Société de : **${v.apportIndustrieDesc}**.`
        );
      } else {
        lines.push(
          "L'Associé unique réalise, en complément de son apport en numéraire, un apport en industrie consistant en la mise à disposition de la Société de ses compétences professionnelles, savoir-faire technique et relations d'affaires."
        );
      }
      lines.push("");
      lines.push(
        "Cet engagement est consenti pour toute la durée pendant laquelle l'Associé unique conserve cette qualité. En cas de cession de la totalité de ses actions, l'apport en industrie prend fin de plein droit."
      );
      lines.push("");
      lines.push(
        "Conformément aux dispositions de l'article L.227-1 du Code de commerce, cet apport en industrie n'entre pas dans la formation du capital social. Il donne lieu à l'attribution d'actions inaliénables qui ne peuvent être cédées ni transmises. Ces actions confèrent à l'Associé unique le droit de participer aux décisions collectives et de percevoir une quote-part des bénéfices, dans les conditions déterminées par les présents statuts."
      );
      lines.push("");
      lines.push(
        "En cas de cessation de l'apport en industrie, pour quelque cause que ce soit (décès, incapacité), les actions d'industrie sont annulées de plein droit."
      );
    }
  }

  lines.push("");
  lines.push(
    "Il est expressément rappelé que les dispositions de l'article 1832-2 du Code civil relatives à la revendication de la qualité d'associé par le conjoint commun en biens ne sont pas applicables aux sociétés par actions simplifiées."
  );
  lines.push("");

  // ── Article 8 — Capital social ──
  lines.push("### Article 8 — Capital social");
  lines.push("");

  lines.push("**8.1 — Montant du capital social**");
  lines.push("");
  lines.push(
    `Le capital social est fixé à la somme de **${fmtNum(v.capital)} euros** (${v.capitalLetters} euros), divisé en **${fmtNum(v.nbActions)}** actions d'une valeur nominale de **${fmtNum(v.valeurAction)} euro${v.valeurAction > 1 ? "s" : ""}** chacune, intégralement souscrites par l'Associé unique.`
  );
  lines.push("");

  if (v.isVersementTotal) {
    lines.push(
      "Les actions de numéraire ont été intégralement libérées lors de la constitution. Le capital social est donc entièrement libéré."
    );
  } else {
    lines.push(
      `Les actions de numéraire ont été libérées à hauteur de **${v.pourcentageVerse} %** de leur valeur nominale lors de la constitution. Le solde devra être libéré dans un délai de cinq (5) ans à compter de l'immatriculation de la Société au Registre du Commerce et des Sociétés, en une ou plusieurs fois, sur appel de fonds du Président.`
    );
    lines.push("");
    lines.push(
      "Tant que le capital social n'aura pas été intégralement libéré, la Société ne pourra procéder à aucune augmentation de capital, conformément aux dispositions légales en vigueur."
    );
  }
  lines.push("");

  lines.push("**8.2 — Capital variable ou fixe**");
  lines.push("");

  if (v.isCapitalVariable) {
    lines.push(
      "La Société est à capital variable, conformément aux articles L.231-1 et suivants du Code de commerce."
    );
    lines.push("");
    lines.push(
      `Le capital social pourra varier entre un montant minimum (capital plancher) de **${fmtNum(v.capitalMin)} euros** (${v.capitalMinLetters} euros) et un montant maximum (capital autorisé) de **${fmtNum(v.capitalMax)} euros** (${v.capitalMaxLetters} euros), par la création d'actions nouvelles ou par le rachat et l'annulation d'actions existantes.`
    );
    lines.push("");
    lines.push(
      "Les augmentations et réductions de capital réalisées dans la limite de la variabilité autorisée ci-dessus ne constituent pas une modification des statuts et sont décidées par le Président, qui constate la modification du capital et procède aux formalités de publicité requises."
    );
    lines.push("");
    lines.push(
      "Le capital ne peut être réduit en dessous du montant minimum (capital plancher) ni par voie de remboursement aux associés, ni par voie de rachat d'actions. Toute modification du capital en dehors de la fourchette de variabilité ci-dessus définie nécessite une modification des présents statuts par décision de l'Associé unique."
    );
    lines.push("");
    lines.push(
      "La mention « à capital variable » doit figurer dans tous les actes et documents émanant de la Société et destinés aux tiers, conformément aux dispositions légales."
    );
  } else {
    lines.push(
      "Le capital social est fixe. Toute augmentation ou réduction du capital social constitue une modification des statuts et devra être décidée par l'Associé unique dans les conditions prévues aux présents statuts."
    );
  }
  lines.push("");

  // ── Article 9 — Modifications du capital ──
  lines.push("### Article 9 — Modifications du capital social");
  lines.push("");
  lines.push(
    "Le capital social pourra être augmenté ou réduit par décision de l'Associé unique, dans les conditions prévues par la loi et les présents statuts, par tous moyens et selon toutes modalités prévus par les dispositions légales et réglementaires en vigueur."
  );
  lines.push("");
  lines.push(
    "Le capital social doit être intégralement libéré avant toute émission d'actions nouvelles à libérer en numéraire, à peine de nullité de l'opération, conformément aux dispositions de l'article L.225-131 du Code de commerce."
  );
  lines.push("");
  lines.push(
    "**Augmentation du capital** — Le capital social pourra être augmenté, en une ou plusieurs fois, soit par émission d'actions nouvelles, soit par élévation de la valeur nominale des actions existantes. Les actions nouvelles pourront être libérées en numéraire, par compensation avec des créances certaines, liquides et exigibles sur la Société, par incorporation de réserves, bénéfices ou primes, ou par apport en nature. L'Associé unique fixe les conditions et les modalités de chaque augmentation de capital."
  );
  lines.push("");
  lines.push(
    "**Réduction du capital** — Le capital social pourra être réduit, en une ou plusieurs fois, par tous moyens prévus par la loi, notamment par voie de remboursement aux associés, de rachat d'actions en vue de leur annulation, ou de réduction de la valeur nominale des actions. La réduction du capital ne peut porter atteinte à l'égalité des associés, sauf consentement exprès des intéressés. En cas de réduction du capital non motivée par des pertes, les créanciers de la Société pourront former opposition dans les conditions prévues par la loi."
  );
  lines.push("");
  lines.push(
    "**Droit préférentiel de souscription** — En cas d'augmentation de capital par émission d'actions nouvelles en numéraire, les associés existants bénéficieront d'un droit préférentiel de souscription aux actions nouvelles, proportionnellement au nombre d'actions qu'ils possèdent, conformément aux dispositions légales. Ce droit est négociable et cessible dans les mêmes conditions que les actions auxquelles il est attaché. L'Associé unique pourra décider de supprimer le droit préférentiel de souscription dans les conditions prévues par la loi."
  );

  if (v.cashPooling) {
    lines.push("");
    lines.push("**Convention de trésorerie (cash pooling)** — La Société pourra conclure, avec les sociétés du groupe auquel elle appartient, une ou plusieurs conventions de trésorerie (cash pooling) ayant pour objet la centralisation et l'optimisation de la gestion de la trésorerie du groupe. Ces conventions pourront prévoir des avances de trésorerie réciproques entre la Société et les autres entités du groupe, dans les conditions suivantes :");
    lines.push("");
    lines.push(
      `- Le montant total des avances consenties par la Société au titre de la convention de trésorerie ne pourra excéder la somme de **${v.cashPoolingPlafond} euros** ;`
    );
    lines.push(
      `- Les avances de trésorerie porteront intérêt au taux de **${v.cashPoolingTaux} %** l'an, ou à tout autre taux qui serait convenu entre les parties dans le respect des dispositions fiscales en vigueur ;`
    );
    lines.push(
      "- La convention de trésorerie devra être conclue dans l'intérêt de la Société et dans des conditions normales de marché ;"
    );
    lines.push(
      "- La convention de trésorerie sera soumise à la procédure de contrôle des conventions réglementées prévue aux présents statuts et par la loi."
    );
  }

  lines.push("");

  return lines.join("\n");
}
export function buildTitre3(v: V): string {
  const lines: string[] = [];

  lines.push("## TITRE 3 — ACTIONS");
  lines.push("");

  // ── Article 10 — Forme des actions ──
  lines.push("### Article 10 — Forme des actions");
  lines.push("");
  lines.push(
    "Les actions émises par la Société sont obligatoirement nominatives. Elles donnent lieu à une inscription en compte individuel dans les conditions et selon les modalités prévues par les dispositions législatives et réglementaires en vigueur."
  );
  lines.push("");
  lines.push(
    "La Société tient un registre des mouvements de titres dans lequel sont inscrits, dans l'ordre chronologique, l'ensemble des mouvements ayant affecté le capital social et les actions le composant."
  );
  lines.push("");
  lines.push(
    "La propriété des actions résulte de leur inscription en compte au nom du ou des titulaires dans le registre des mouvements de titres tenu par la Société, conformément aux dispositions de l'article R. 228-8 du Code de commerce."
  );
  lines.push("");
  lines.push(
    "Il pourra être créé, par décision de l'associé unique ou, en cas de pluralité d'associés, par décision collective des associés statuant dans les conditions prévues par la loi, des actions de préférence, avec ou sans droit de vote, assorties de droits particuliers de toute nature, à titre temporaire ou permanent, dans les conditions fixées par les articles L. 228-11 et suivants du Code de commerce."
  );
  lines.push("");

  // ── Article 11 — Droits et obligations attachés aux actions ──
  lines.push("### Article 11 — Droits et obligations attachés aux actions");
  lines.push("");
  lines.push(
    "Chaque action donne droit, dans les bénéfices, l'actif net et le boni de liquidation, à une part proportionnelle à la quotité du capital qu'elle représente."
  );
  lines.push("");
  lines.push(
    "Chaque action donne droit à une voix lors de la prise de décisions par l'associé unique ou, en cas de pluralité d'associés, lors des consultations et votes en assemblée générale."
  );
  lines.push("");
  lines.push(
    "Les associés ne supportent les pertes qu'à concurrence de leurs apports. Les droits et obligations attachés à l'action suivent le titre dans quelque main qu'il passe."
  );
  lines.push("");
  lines.push(
    "La propriété d'une action emporte de plein droit adhésion aux statuts de la Société et aux décisions régulièrement prises par l'associé unique ou, en cas de pluralité d'associés, par la collectivité des associés."
  );
  lines.push("");
  lines.push(
    "Les héritiers, créanciers, ayants droit ou autres représentants d'un associé ne peuvent requérir l'apposition de scellés sur les biens et valeurs de la Société, ni en demander le partage ou la licitation. Ils ne peuvent en aucun cas s'immiscer dans les actes de la gestion sociale."
  );
  lines.push("");
  lines.push("**Démembrement de propriété**");
  lines.push("");
  lines.push(
    "En cas de démembrement de la propriété des actions, le droit de vote attaché aux actions est exercé de la manière suivante :"
  );
  lines.push("");
  lines.push(
    "- L'usufruitier exerce le droit de vote pour toutes les décisions relatives à l'affectation et à la distribution des bénéfices, ainsi que pour toute décision portant sur la distribution de réserves ou de primes ;"
  );
  lines.push(
    "- Le nu-propriétaire exerce le droit de vote pour toutes les autres décisions, et notamment pour toutes les décisions emportant modification des statuts, y compris les augmentations et réductions de capital, les fusions, scissions et apports partiels d'actif, ainsi que la dissolution de la Société."
  );
  lines.push("");
  lines.push(
    "Les dividendes et toutes distributions de bénéfices reviennent à l'usufruitier, sauf convention contraire entre l'usufruitier et le nu-propriétaire dûment notifiée à la Société."
  );
  lines.push("");
  lines.push(
    "L'usufruitier et le nu-propriétaire doivent porter à la connaissance de la Société tout démembrement de propriété affectant les actions, en précisant l'identité du nu-propriétaire et de l'usufruitier ainsi que la répartition des droits de vote entre eux."
  );
  lines.push("");

  // ── Article 12 — Libération des actions ──
  lines.push("### Article 12 — Libération des actions");
  lines.push("");
  lines.push(
    "Les actions de numéraire doivent être libérées, lors de leur souscription, de la moitié au moins de leur valeur nominale, conformément aux dispositions de l'article L. 227-1 du Code de commerce renvoyant à l'article L. 225-3 du même code."
  );
  lines.push("");
  lines.push(
    "La prime d'émission, s'il en existe, doit être intégralement libérée lors de la souscription."
  );
  lines.push("");
  lines.push(
    "La libération du surplus doit intervenir en une ou plusieurs fois, dans un délai maximum de cinq (5) ans à compter de l'immatriculation de la Société au Registre du commerce et des sociétés, ou, s'il s'agit d'une augmentation de capital, dans un délai de cinq (5) ans à compter du jour où l'augmentation de capital est devenue définitive, sur appel du Président, dans les proportions et aux dates qu'il fixera."
  );
  lines.push("");
  lines.push(
    "Les appels de fonds sont portés à la connaissance de l'associé unique ou, en cas de pluralité d'associés, de chaque associé, par lettre recommandée avec demande d'avis de réception expédiée quinze (15) jours au moins avant la date fixée pour chaque versement."
  );
  lines.push("");
  lines.push(
    "Tout retard dans le versement des sommes dues sur le montant non libéré des actions entraîne, de plein droit et sans qu'il soit besoin de procéder à une formalité quelconque, le paiement d'un intérêt au taux légal, majoré de deux (2) points, calculé à compter de la date d'exigibilité, sans préjudice de l'action personnelle que la Société peut exercer contre l'associé défaillant et des mesures d'exécution forcée prévues par la loi."
  );
  lines.push("");

  // ── Article 13 — Transmissions des actions ──
  lines.push("### Article 13 — Transmissions des actions");
  lines.push("");

  if (v.cessionActions === "libre") {
    lines.push(
      "Tant que la Société ne comporte qu'un associé unique, celui-ci peut librement céder tout ou partie de ses actions à toute personne de son choix."
    );
    lines.push("");
    lines.push(
      "En cas de pluralité d'associés, les cessions d'actions seront libres entre associés et au profit de tiers, sans qu'il soit nécessaire de recueillir un quelconque agrément."
    );
    lines.push("");
    lines.push(
      "Toute cession d'actions devra être constatée par un acte sous seing privé ou authentique, et ne sera opposable à la Société qu'après lui avoir été signifiée ou après son acceptation dans un acte authentique, ou par le transfert sur les registres de la Société, conformément aux dispositions de l'article L. 228-1 du Code de commerce."
    );
    lines.push("");
    lines.push(
      "Elle n'est opposable aux tiers qu'après avoir fait l'objet d'une publicité dont les conditions sont fixées par décret en Conseil d'État."
    );
  } else if (v.cessionActions === "agrement") {
    lines.push(
      "Tant que la Société ne comporte qu'un associé unique, celui-ci peut librement céder tout ou partie de ses actions à toute personne de son choix."
    );
    lines.push("");
    lines.push(
      "Toute cession d'actions devra être constatée par un acte sous seing privé ou authentique, et ne sera opposable à la Société qu'après lui avoir été signifiée ou après son acceptation dans un acte authentique, ou par le transfert sur les registres de la Société, conformément aux dispositions de l'article L. 228-1 du Code de commerce. Elle n'est opposable aux tiers qu'après avoir fait l'objet d'une publicité dont les conditions sont fixées par décret en Conseil d'État."
    );
    lines.push("");
    lines.push("**Clause d'agrément**");
    lines.push("");
    lines.push(
      `En cas de pluralité d'associés, toute cession d'actions à un tiers non associé, à quelque titre que ce soit, est soumise à l'agrément préalable des associés statuant à la majorité de ${v.majoriteAgrement} % des voix des associés disposant du droit de vote.`
    );
    lines.push("");
    lines.push(
      "Le projet de cession est notifié à la Société par lettre recommandée avec demande d'avis de réception ou par acte extrajudiciaire adressé au Président, indiquant les nom, prénom, adresse du cessionnaire proposé, le nombre d'actions dont la cession est envisagée et le prix offert."
    );
    lines.push("");
    lines.push(
      "La décision d'agrément ou de refus d'agrément est notifiée au cédant par lettre recommandée avec demande d'avis de réception dans un délai de trois (3) mois à compter de la réception de la notification du projet de cession. À défaut de réponse dans ce délai, l'agrément est réputé acquis."
    );
    lines.push("");
    lines.push(
      "En cas de refus d'agrément, les associés sont tenus, dans un délai de trois (3) mois à compter de la notification du refus, d'acquérir ou de faire acquérir les actions dont la cession était projetée, à un prix fixé d'un commun accord entre les parties ou, à défaut, déterminé par un expert désigné conformément aux dispositions de l'article 1843-4 du Code civil, soit par les parties, soit par ordonnance du Président du tribunal de commerce statuant en référé."
    );
    lines.push("");
    lines.push(
      "Si, à l'expiration du délai de trois (3) mois ci-dessus, le rachat n'est pas réalisé, l'agrément est réputé acquis, sauf si le cédant renonce à la cession envisagée."
    );
    lines.push("");
    lines.push(
      "Les cessions entre associés et les transmissions par voie de succession ou de liquidation de communauté de biens entre époux sont libres."
    );
  } else if (v.cessionActions === "heritiers") {
    lines.push(
      "Tant que la Société ne comporte qu'un associé unique, celui-ci peut librement céder tout ou partie de ses actions à toute personne de son choix."
    );
    lines.push("");
    lines.push(
      "Toute cession d'actions devra être constatée par un acte sous seing privé ou authentique, et ne sera opposable à la Société qu'après lui avoir été signifiée ou après son acceptation dans un acte authentique, ou par le transfert sur les registres de la Société, conformément aux dispositions de l'article L. 228-1 du Code de commerce. Elle n'est opposable aux tiers qu'après avoir fait l'objet d'une publicité dont les conditions sont fixées par décret en Conseil d'État."
    );
    lines.push("");

    const personnes: string[] = [];
    if (v.transmissionHeritiers.includes("conjoint")) personnes.push("le conjoint de l'associé cédant");
    if (v.transmissionHeritiers.includes("descendants")) personnes.push("les descendants de l'associé cédant");
    if (v.transmissionHeritiers.includes("ascendants")) personnes.push("les ascendants de l'associé cédant");

    if (personnes.length > 0) {
      lines.push(
        `**Cessions libres** — En cas de pluralité d'associés, les cessions d'actions réalisées au profit des personnes suivantes sont libres et ne sont pas soumises à agrément : ${personnes.join(", ")}.`
      );
      lines.push("");
      lines.push(
        "Les cessions entre associés sont également libres."
      );
      lines.push("");
    }

    lines.push("**Clause d'agrément**");
    lines.push("");
    lines.push(
      `En cas de pluralité d'associés, toute cession d'actions à un tiers non visé ci-dessus est soumise à l'agrément préalable des associés statuant à la majorité de ${v.majoriteAgrement} % des voix des associés disposant du droit de vote.`
    );
    lines.push("");
    lines.push(
      "Le projet de cession est notifié à la Société par lettre recommandée avec demande d'avis de réception ou par acte extrajudiciaire adressé au Président, indiquant les nom, prénom, adresse du cessionnaire proposé, le nombre d'actions dont la cession est envisagée et le prix offert."
    );
    lines.push("");
    lines.push(
      "La décision d'agrément ou de refus d'agrément est notifiée au cédant par lettre recommandée avec demande d'avis de réception dans un délai de trois (3) mois à compter de la réception de la notification du projet de cession. À défaut de réponse dans ce délai, l'agrément est réputé acquis."
    );
    lines.push("");
    lines.push(
      "En cas de refus d'agrément, les associés sont tenus, dans un délai de trois (3) mois à compter de la notification du refus, d'acquérir ou de faire acquérir les actions dont la cession était projetée, à un prix fixé d'un commun accord entre les parties ou, à défaut, déterminé par un expert désigné conformément aux dispositions de l'article 1843-4 du Code civil, soit par les parties, soit par ordonnance du Président du tribunal de commerce statuant en référé."
    );
    lines.push("");
    lines.push(
      "Si, à l'expiration du délai de trois (3) mois ci-dessus, le rachat n'est pas réalisé, l'agrément est réputé acquis, sauf si le cédant renonce à la cession envisagée."
    );
  }

  lines.push("");

  if (v.pacteDutreil) {
    lines.push("**Engagement de conservation — Pacte Dutreil**");
    lines.push("");
    lines.push(
      `Conformément aux dispositions de l'article 787 B du Code général des impôts, l'associé unique s'engage à conserver l'intégralité de ses actions pendant une durée minimale de ${v.pacteDutreilDuree} ans à compter de la date d'enregistrement de l'engagement de conservation, dans le cadre du dispositif dit « Pacte Dutreil ».`
    );
    lines.push("");
    lines.push(
      "Cet engagement de conservation porte sur au moins 34 % des droits financiers et des droits de vote attachés aux actions de la Société. L'associé unique exercera, ou l'un de ses héritiers ou donataires exercera, une fonction de direction effective dans la Société, au sens de l'article 885 O bis, 1° du Code général des impôts, pendant toute la durée de l'engagement collectif de conservation et pendant les trois (3) années suivant la date de la transmission."
    );
    lines.push("");
    lines.push(
      "En cas de cession d'actions pendant la durée de l'engagement de conservation, le cédant s'engage à en informer immédiatement la Société et l'administration fiscale, et reconnaît que la remise en cause de l'engagement de conservation entraînera la déchéance du régime de faveur prévu par l'article 787 B du Code général des impôts."
    );
    lines.push("");
  }

  // ── Article 14 — Location d'actions ──
  lines.push("### Article 14 — Location d'actions");
  lines.push("");
  lines.push(
    "Conformément aux dispositions de l'article L. 239-2 du Code de commerce, les actions de la Société peuvent faire l'objet d'une location au profit de toute personne physique ou morale."
  );
  lines.push("");
  lines.push(
    "Le contrat de location d'actions est constaté par un acte écrit enregistré, comportant les mentions obligatoires prévues par les dispositions réglementaires en vigueur."
  );
  lines.push("");
  lines.push(
    "Pendant la durée de la location, le droit de vote attaché aux actions louées est exercé de la manière suivante :"
  );
  lines.push("");
  lines.push(
    "- Le locataire exerce le droit de vote pour toutes les décisions relevant des décisions ordinaires, et notamment l'approbation des comptes annuels et l'affectation du résultat ;"
  );
  lines.push(
    "- Le bailleur conserve le droit de vote pour toutes les décisions emportant modification des statuts, y compris les augmentations et réductions de capital, les fusions, scissions, apports partiels d'actif, ainsi que la dissolution de la Société."
  );
  lines.push("");
  lines.push(
    "Les dividendes et toutes distributions de bénéfices décidées pendant la durée de la location reviennent au locataire, sauf convention contraire entre le bailleur et le locataire."
  );
  lines.push("");
  lines.push(
    "La sous-location d'actions est interdite. Toute sous-location consentie en violation de la présente clause est nulle et non avenue."
  );
  lines.push("");
  lines.push(
    "Le locataire ne peut céder le bénéfice de la location à un tiers sans l'accord exprès du bailleur."
  );
  lines.push("");

  // ── Article 15 — Nantissement des actions ──
  lines.push("### Article 15 — Nantissement des actions");
  lines.push("");

  if (v.nantissementAutorise) {
    lines.push(
      "Le nantissement des actions de la Société est autorisé. Il est constitué et réalisé conformément aux dispositions des articles L. 228-23 et suivants du Code de commerce."
    );
    lines.push("");
    lines.push(
      "Le nantissement est constaté par un acte authentique ou sous seing privé, signifié à la Société dans les conditions prévues à l'article L. 228-1 du Code de commerce, ou par la remise à la Société d'un exemplaire de l'acte constitutif du nantissement."
    );
    lines.push("");
    lines.push(
      "Le nantissement est inscrit sur le registre des mouvements de titres tenu par la Société. L'inscription mentionne l'identité du titulaire des actions et du créancier nanti, le nombre d'actions nanties et la date de constitution du nantissement."
    );
    lines.push("");
    lines.push(
      "L'associé dont les actions sont nanties conserve l'exercice du droit de vote attaché à ses actions."
    );
    lines.push("");
    lines.push(
      "En cas de pluralité d'associés, la réalisation du nantissement emportant cession des actions au profit du créancier nanti est soumise à la procédure d'agrément prévue à l'article 13 des présents statuts."
    );
  } else {
    lines.push(
      "Le nantissement des actions de la Société est interdit."
    );
    lines.push("");
    lines.push(
      "Tout nantissement consenti en violation de la présente clause est nul et non avenu, et ne saurait être opposable à la Société ni aux tiers."
    );
    lines.push("");
    lines.push(
      "Cette interdiction s'applique à toute forme de sûreté portant sur les actions de la Société, qu'il s'agisse d'un nantissement conventionnel, judiciaire ou légal, d'un gage ou de toute autre sûreté réelle mobilière portant sur lesdites actions."
    );
  }

  return lines.join("\n");
}

export function buildTitre4(v: V): string {
  const lines: string[] = [];

  lines.push("## TITRE 4 — DIRECTION DE LA SOCIÉTÉ");
  lines.push("");

  // ── Article 16 — Nomination des Dirigeants ──
  lines.push("### Article 16 — Nomination des Dirigeants");
  lines.push("");
  lines.push("**16.1 — Président**");
  lines.push("");
  lines.push(
    "La Société est dirigée par un Président, personne physique ou personne morale, associé ou non associé de la Société."
  );
  lines.push("");
  lines.push(
    `Est nommé(e) en qualité de premier Président de la Société, pour une durée ${v.dureeMandat}, ${v.mandatRenouvelable} :`
  );
  lines.push("");
  lines.push(v.presidentNomination);
  lines.push("");
  lines.push(
    "Le Président est nommé et ses fonctions sont renouvelées par décision de l'associé unique ou, en cas de pluralité d'associés, par décision collective des associés."
  );
  lines.push("");

  if (v.hasDG) {
    lines.push("**16.2 — Directeur Général**");
    lines.push("");
    lines.push(
      "L'associé unique ou, en cas de pluralité d'associés, la collectivité des associés peut nommer un ou plusieurs Directeurs Généraux, personnes physiques, chargés d'assister le Président dans la direction de la Société."
    );
    lines.push("");
    lines.push(
      "Est nommé(e) en qualité de premier Directeur Général de la Société :"
    );
    lines.push("");
    lines.push(v.dgNomination);
    lines.push("");
    lines.push(
      `Le Directeur Général est nommé pour une durée ${v.dureeMandat}, ${v.mandatRenouvelable}. Son mandat est renouvelé par décision de l'associé unique ou, en cas de pluralité d'associés, par décision collective des associés.`
    );
    lines.push("");
  }

  // ── Article 17 — Pouvoirs des Dirigeants ──
  lines.push("### Article 17 — Pouvoirs des Dirigeants");
  lines.push("");
  lines.push("**17.1 — Pouvoirs du Président**");
  lines.push("");
  lines.push(
    "Le Président est investi des pouvoirs les plus étendus pour agir en toutes circonstances au nom de la Société, dans la limite de l'objet social et sous réserve des pouvoirs que la loi attribue expressément à l'associé unique ou, en cas de pluralité d'associés, à la collectivité des associés."
  );
  lines.push("");
  lines.push(
    "Le Président représente la Société à l'égard des tiers. La Société est engagée même par les actes du Président qui ne relèvent pas de l'objet social, à moins qu'elle ne prouve que le tiers savait que l'acte dépassait cet objet ou qu'il ne pouvait l'ignorer compte tenu des circonstances, étant exclu que la seule publication des statuts suffise à constituer cette preuve."
  );
  lines.push("");
  lines.push(
    "Les limitations statutaires ou conventionnelles des pouvoirs du Président sont inopposables aux tiers."
  );
  lines.push("");

  if (v.limitationPouvoirs) {
    lines.push("**Limitations internes des pouvoirs du Président**");
    lines.push("");
    lines.push(
      "Dans les rapports entre associés et dans l'ordre interne uniquement, le Président doit obtenir l'autorisation préalable de l'associé unique ou, en cas de pluralité d'associés, de la collectivité des associés, avant de réaliser les opérations suivantes :"
    );
    lines.push("");
    lines.push(
      `- Toute acquisition, cession ou échange de biens immobiliers ou de fonds de commerce d'un montant supérieur à ${v.montantLimitation} euros ;`
    );
    lines.push(
      `- Tout emprunt, prêt ou ouverture de crédit d'un montant supérieur à ${v.montantLimitation} euros ;`
    );
    lines.push(
      `- Toute constitution de sûretés (hypothèques, nantissements, cautionnements, avals et garanties) d'un montant supérieur à ${v.montantLimitation} euros ;`
    );
    lines.push(
      `- Toute conclusion, modification ou résiliation de contrats, conventions ou engagements d'un montant supérieur à ${v.montantLimitation} euros ;`
    );
    lines.push(
      "- Toute embauche ou licenciement de cadres dirigeants de la Société."
    );
    lines.push("");
    lines.push(
      "Ces limitations sont purement internes et ne sont pas opposables aux tiers. Leur méconnaissance par le Président ne peut constituer une cause de nullité des actes accomplis, mais est susceptible d'engager la responsabilité du Président à l'égard de la Société."
    );
  } else {
    lines.push(
      "Dans l'ordre interne, le Président exerce ses pouvoirs sans aucune limitation autre que celles résultant de la loi et des présents statuts. Il n'est soumis à aucune autorisation préalable de l'associé unique pour la réalisation des actes de gestion courante ou exceptionnelle."
    );
  }
  lines.push("");

  if (v.hasDG) {
    lines.push("**17.2 — Pouvoirs du Directeur Général**");
    lines.push("");

    if (v.dgPouvoirs === "representation") {
      lines.push(
        "Le Directeur Général dispose des mêmes pouvoirs que le Président. Il est investi des pouvoirs les plus étendus pour agir en toutes circonstances au nom de la Société, dans la limite de l'objet social et sous réserve des pouvoirs attribués par la loi à l'associé unique ou à la collectivité des associés, et de ceux expressément réservés au Président par les présents statuts."
      );
      lines.push("");
      lines.push(
        "Le Directeur Général représente la Société à l'égard des tiers dans les mêmes conditions que le Président. Les limitations de ses pouvoirs sont inopposables aux tiers."
      );
    } else {
      lines.push(
        "Le Directeur Général assiste le Président dans la gestion et l'administration de la Société. Il dispose, dans l'ordre interne, des pouvoirs de gestion les plus étendus pour agir au nom de la Société, dans la limite de l'objet social et sous réserve des pouvoirs réservés par la loi à l'associé unique ou à la collectivité des associés, et de ceux expressément dévolus au Président."
      );
      lines.push("");
      lines.push(
        "Le Directeur Général ne dispose pas du pouvoir de représentation de la Société à l'égard des tiers, lequel est exclusivement réservé au Président. Le Directeur Général ne peut engager la Société vis-à-vis des tiers que dans le cadre d'une délégation de pouvoirs expressément consentie par le Président."
      );
    }
    lines.push("");
  }

  if (v.managementFees) {
    lines.push("**Convention de management fees**");
    lines.push("");
    lines.push(
      `Conformément à la décision de l'associé unique, une convention de prestations de services (management fees) pourra être conclue entre la Société et son associé unique ou toute société du groupe, portant sur des prestations de direction, de gestion administrative, comptable, financière, juridique, commerciale et stratégique. La rémunération de ces prestations sera fixée à ${v.managementFeesPct} % du chiffre d'affaires hors taxes de la Société, ou à tout autre montant déterminé par l'associé unique.`
    );
    lines.push("");
    lines.push(
      "Cette convention devra être conclue à des conditions normales et faire l'objet des formalités de contrôle prévues par les articles L. 227-10 et suivants du Code de commerce relatives aux conventions réglementées. Elle devra correspondre à des prestations effectives, distinctes des fonctions de direction exercées par les mandataires sociaux, et être rémunérée à un prix conforme aux conditions de marché."
    );
    lines.push("");
  }

  // ── Article 18 — Cumul mandat social et contrat de travail ──
  lines.push("### Article 18 — Cumul mandat social et contrat de travail");
  lines.push("");
  lines.push(
    "Le Président ou le Directeur Général peut cumuler son mandat social avec un contrat de travail au sein de la Société, sous réserve que les conditions suivantes soient réunies :"
  );
  lines.push("");
  lines.push(
    "- Le contrat de travail doit correspondre à un emploi effectif, c'est-à-dire à des fonctions techniques distinctes de celles exercées dans le cadre du mandat social ;"
  );
  lines.push(
    "- Le dirigeant doit se trouver dans un lien de subordination effective à l'égard de la Société, caractérisé par l'exercice d'un contrôle hiérarchique et la soumission à des directives et instructions ;"
  );
  lines.push(
    "- Le contrat de travail doit donner lieu au versement d'une rémunération distincte de celle perçue au titre du mandat social."
  );
  lines.push("");
  lines.push(
    "Le contrat de travail conclu entre la Société et un dirigeant est soumis aux dispositions des articles L. 227-10 et suivants du Code de commerce relatives aux conventions réglementées."
  );
  lines.push("");
  lines.push(
    "En cas de cessation du mandat social, pour quelque cause que ce soit, le contrat de travail subsiste dans tous ses effets. La révocation du mandat social n'entraîne pas la rupture du contrat de travail, et inversement."
  );
  lines.push("");

  // ── Article 19 — Révocation, démission et responsabilité ──
  lines.push("### Article 19 — Révocation, démission et responsabilité");
  lines.push("");
  lines.push("**19.1 — Révocation**");
  lines.push("");
  lines.push(
    "Le Président peut être révoqué à tout moment par décision de l'associé unique."
  );
  lines.push("");

  if (v.revocationPresident === "libre") {
    lines.push(
      "La révocation du Président peut intervenir librement, sans qu'il soit nécessaire d'invoquer un juste motif ni de respecter un préavis. Elle n'ouvre droit à aucune indemnité, sauf disposition contraire résultant d'un engagement particulier de la Société."
    );
  } else {
    lines.push(
      "La révocation du Président ne peut intervenir que pour un juste motif, caractérisé notamment par une faute de gestion, une violation des dispositions légales, réglementaires ou statutaires, une mésentente grave compromettant le fonctionnement de la Société, ou tout autre motif légitime apprécié souverainement par l'associé unique ou la collectivité des associés."
    );
    lines.push("");
    lines.push(
      "Toute révocation intervenue sans juste motif ouvre droit au versement de dommages et intérêts au profit du Président révoqué, sans préjudice de toute autre action en responsabilité."
    );
  }
  lines.push("");

  lines.push(
    `En cas de pluralité d'associés, la révocation du Président est prononcée par décision collective des associés statuant à la majorité de ${v.majoritePresident} des voix des associés disposant du droit de vote.`
  );
  lines.push("");

  if (v.hasDG) {
    lines.push(
      "Le Directeur Général peut être révoqué dans les mêmes conditions que celles applicables au Président."
    );
    lines.push("");
  }

  lines.push("**19.2 — Démission**");
  lines.push("");
  lines.push(
    "Le Président peut démissionner de ses fonctions à tout moment, sous réserve de respecter un préavis de trois (3) mois, notifié à la Société par lettre recommandée avec demande d'avis de réception."
  );
  lines.push("");
  lines.push(
    "Ce délai de préavis peut être réduit ou supprimé par décision de l'associé unique ou, en cas de pluralité d'associés, par décision collective des associés."
  );
  lines.push("");
  lines.push(
    "La démission ne prend effet qu'à l'expiration du délai de préavis, sauf accord de l'associé unique ou de la collectivité des associés pour une prise d'effet immédiate ou à une date antérieure."
  );
  lines.push("");

  if (v.hasDG) {
    lines.push(
      "Le Directeur Général peut démissionner de ses fonctions dans les mêmes conditions que celles applicables au Président."
    );
    lines.push("");
  }

  lines.push("**19.3 — Responsabilité**");
  lines.push("");
  lines.push(
    "Le Président et, le cas échéant, le Directeur Général sont responsables, individuellement ou solidairement selon les cas, envers la Société et envers les tiers :"
  );
  lines.push("");
  lines.push(
    "- Des infractions aux dispositions législatives et réglementaires applicables aux sociétés par actions simplifiées ;"
  );
  lines.push(
    "- Des violations des dispositions des présents statuts ;"
  );
  lines.push(
    "- Des fautes commises dans leur gestion, appréciées au regard de la diligence d'un dirigeant normalement prudent et avisé placé dans les mêmes circonstances ;"
  );
  lines.push(
    "- Des actes de fraude, d'abus de biens sociaux, d'abus de pouvoir ou d'abus de voix commis dans l'exercice de leurs fonctions."
  );
  lines.push("");
  lines.push(
    "L'action en responsabilité contre les dirigeants, tant sociale qu'individuelle, se prescrit par trois (3) ans à compter du fait dommageable ou, s'il a été dissimulé, de sa révélation, conformément aux dispositions de l'article L. 225-254 du Code de commerce, applicable par renvoi de l'article L. 227-8 du même code."
  );
  lines.push("");

  // ── Article 20 — Rémunération des Dirigeants ──
  lines.push("### Article 20 — Rémunération des Dirigeants");
  lines.push("");

  if (v.presidentRemunere === "non") {
    lines.push(
      "Le Président exerce ses fonctions à titre gratuit. Il ne perçoit aucune rémunération au titre de son mandat social."
    );
    lines.push("");
    lines.push(
      "L'associé unique pourra, par décision ultérieure, décider d'attribuer une rémunération au Président et en fixer le montant, la périodicité et les modalités de versement."
    );
  } else if (v.presidentRemunere === "possible") {
    lines.push(
      "Le Président pourra percevoir une rémunération au titre de ses fonctions de mandataire social, dont le montant, la périodicité et les modalités de versement seront fixés par décision de l'associé unique ou, en cas de pluralité d'associés, par décision collective des associés."
    );
    lines.push("");
    lines.push(
      "Jusqu'à décision contraire de l'associé unique, le Président exerce ses fonctions à titre gratuit."
    );
  } else {
    lines.push(
      "Le Président perçoit une rémunération au titre de ses fonctions de mandataire social, dont le montant, la périodicité et les modalités de versement sont fixés par décision de l'associé unique ou, en cas de pluralité d'associés, par décision collective des associés."
    );
    lines.push("");
    lines.push(
      "La rémunération du Président peut être fixe, proportionnelle au chiffre d'affaires ou au résultat de la Société, ou comporter une part fixe et une part variable. Elle peut être modifiée à tout moment par décision de l'associé unique ou de la collectivité des associés."
    );
  }
  lines.push("");

  if (v.hasDG) {
    lines.push(
      "Le Directeur Général pourra percevoir une rémunération au titre de ses fonctions, dont le montant et les modalités seront fixés par décision de l'associé unique ou, en cas de pluralité d'associés, par décision collective des associés."
    );
    lines.push("");
  }

  lines.push(
    "Le Président et, le cas échéant, le Directeur Général ont droit au remboursement de leurs frais de déplacement et de représentation engagés dans l'intérêt de la Société, sur présentation de justificatifs et dans les conditions fixées par l'associé unique ou la collectivité des associés."
  );
  lines.push("");

  // ── Article 21 — Clause de non-concurrence ──
  lines.push("### Article 21 — Clause de non-concurrence");
  lines.push("");

  if (v.nonConcurrence) {
    lines.push(
      `Le Président et, le cas échéant, le Directeur Général s'engagent, pendant toute la durée de leurs fonctions et pendant une durée de ${v.dureeNonConcurrence} an(s) suivant la cessation de celles-ci, pour quelque cause que ce soit, à ne pas exercer, directement ou indirectement, une activité concurrente de celle de la Société sur le territoire suivant : ${v.perimetreNonConcurrence}.`
    );
    lines.push("");
    lines.push(
      "Cette obligation de non-concurrence couvre notamment les activités suivantes :"
    );
    lines.push("");
    lines.push(
      "- La création, l'acquisition, la gérance ou la direction d'une entreprise exerçant une activité concurrente de celle de la Société ;"
    );
    lines.push(
      "- La prise de participation, directe ou indirecte, dans toute société ou entreprise exerçant une activité concurrente de celle de la Société, à l'exception de la détention de participations purement financières n'excédant pas 5 % du capital d'une société cotée sur un marché réglementé ;"
    );
    lines.push(
      "- L'exercice d'une activité salariée, de conseil ou de prestation de services au profit d'une entreprise concurrente de la Société ;"
    );
    lines.push(
      "- Le démarchage, la sollicitation ou le détournement de clients ou de fournisseurs de la Société, directement ou par personne interposée ;"
    );
    lines.push(
      "- L'embauche ou la sollicitation de salariés ou de collaborateurs de la Société en vue de les affecter à une activité concurrente."
    );
    lines.push("");

    if (v.indemniteNonConcurrence) {
      lines.push(
        `En contrepartie de cette obligation de non-concurrence post-mandat, le dirigeant percevra une indemnité mensuelle d'un montant de ${v.montantIndemniteNC} euros bruts, versée pendant toute la durée de l'obligation de non-concurrence suivant la cessation des fonctions. Cette indemnité est due quelle que soit la cause de la cessation des fonctions (révocation, démission, non-renouvellement).`
      );
    } else {
      lines.push(
        "La contrepartie de cette obligation de non-concurrence est intégrée dans la rémunération globale du dirigeant au titre de son mandat social et ne donne lieu à aucune indemnité spécifique distincte lors de la cessation des fonctions."
      );
    }
    lines.push("");

    lines.push(
      "En cas de violation de la présente clause de non-concurrence, le dirigeant sera redevable envers la Société d'une pénalité d'un montant égal à la rémunération brute perçue au titre de ses fonctions pendant les douze (12) derniers mois d'exercice de son mandat, sans préjudice du droit pour la Société de demander la réparation intégrale de son préjudice et la cessation de l'activité concurrente par voie de référé."
    );
    lines.push("");
    lines.push(
      "La Société pourra, à tout moment, libérer le dirigeant de son obligation de non-concurrence, par décision de l'associé unique ou de la collectivité des associés, notifiée par lettre recommandée avec demande d'avis de réception dans un délai de trente (30) jours suivant la cessation des fonctions. Dans ce cas, aucune indemnité de non-concurrence ne sera due."
    );
  } else {
    lines.push(
      "Les présents statuts ne comportent pas de clause de non-concurrence à l'égard des dirigeants de la Société."
    );
    lines.push("");
    lines.push(
      "Il est toutefois rappelé que les dirigeants sont tenus, pendant toute la durée de leurs fonctions, d'une obligation de loyauté à l'égard de la Société qui leur interdit d'exercer une activité concurrente susceptible de porter atteinte aux intérêts de celle-ci."
    );
    lines.push("");
    lines.push(
      "Une clause de non-concurrence pourra être prévue dans un acte séparé, conclu entre la Société et le dirigeant concerné, aux conditions et selon les modalités qui y seront définies."
    );
  }

  return lines.join("\n");
}

export function buildTitre5(v: V): string {
  const s: string[] = [];

  s.push("## TITRE 5 — DÉCISIONS DE L'ASSOCIÉ UNIQUE");

  // ── Article 22 — Conventions réglementées ──
  s.push("");
  s.push("### Article 22 — Conventions réglementées");
  s.push("");
  s.push("Conformément à l'article L. 227-10 du Code de commerce, les conventions intervenues directement ou par personne interposée entre la Société et son Président, l'un de ses dirigeants, l'un de ses associés disposant d'une fraction des droits de vote supérieure à 10 % ou, s'il s'agit d'une société associée, la société la contrôlant au sens de l'article L. 233-3 du Code de commerce, doivent faire l'objet d'un rapport spécial établi par le Président ou, le cas échéant, par le Commissaire aux comptes.");
  s.push("");
  s.push("L'Associé unique statue sur ce rapport à l'occasion de l'approbation des comptes annuels de chaque exercice.");
  s.push("");
  s.push("Les conventions non approuvées produisent néanmoins leurs effets, à charge pour la personne intéressée et, éventuellement, pour le Président, d'en supporter les conséquences dommageables pour la Société.");
  s.push("");
  s.push("Les conventions portant sur des opérations courantes et conclues à des conditions normales sont dispensées de la procédure prévue ci-dessus. Toutefois, ces conventions sont communiquées au Commissaire aux comptes, le cas échéant.");
  s.push("");
  s.push("Conformément aux dispositions de l'article L. 227-12 du Code de commerce, les interdictions prévues à l'article L. 225-43 du Code de commerce sont applicables au Président et aux dirigeants de la Société. En conséquence, il est interdit au Président et aux dirigeants de contracter, sous quelque forme que ce soit, des emprunts auprès de la Société, de se faire consentir par elle un découvert en compte courant ou autrement, ainsi que de faire cautionner ou avaliser par la Société leurs engagements envers les tiers. Cette interdiction s'applique également aux représentants permanents des personnes morales dirigeantes, à leur conjoint, ascendants et descendants ainsi qu'à toute personne interposée.");

  // ── Article 23 — Compétences exclusives de l'Associé unique ──
  s.push("");
  s.push("### Article 23 — Compétences exclusives de l'Associé unique");
  s.push("");
  s.push("Conformément à l'article L. 227-9 du Code de commerce, l'Associé unique exerce les pouvoirs dévolus aux assemblées d'actionnaires par les dispositions applicables aux sociétés par actions simplifiées et, plus généralement, par les stipulations des présents Statuts.");
  s.push("");
  s.push("L'Associé unique est seul compétent pour prendre les décisions suivantes :");
  s.push("");
  s.push("- la nomination et la révocation du Président et, le cas échéant, du Directeur Général et des autres dirigeants de la Société ;");
  s.push("- la nomination et la révocation du Commissaire aux comptes, le cas échéant ;");
  s.push("- l'approbation des comptes annuels et l'affectation du résultat ;");
  s.push("- l'approbation des conventions réglementées visées à l'article 22 ci-dessus ;");
  s.push("- toute modification des Statuts, y compris le changement de dénomination sociale, d'objet social et de siège social ;");
  s.push("- les opérations portant sur le capital social, notamment les augmentations et réductions de capital, les émissions de valeurs mobilières ;");
  s.push("- l'agrément des cessions et transmissions d'actions dans les conditions prévues aux présents Statuts ;");
  s.push("- les opérations de fusion, scission, apport partiel d'actif et toute autre opération de restructuration ;");
  s.push("- la transformation de la Société ;");
  s.push("- la prorogation de la durée de la Société ;");
  s.push("- la dissolution anticipée de la Société et les modalités de sa liquidation.");
  s.push("");
  s.push("Ces compétences ne peuvent faire l'objet d'aucune délégation.");

  // ── Article 24 — Forme des décisions de l'Associé unique ──
  s.push("");
  s.push("### Article 24 — Forme des décisions de l'Associé unique");
  s.push("");
  s.push("L'Associé unique exerce les pouvoirs qui lui sont dévolus par la loi et les présents Statuts sous forme de décisions unilatérales prises par écrit, sur support papier ou électronique.");
  s.push("");
  s.push("Les décisions de l'Associé unique sont consignées dans un registre spécial tenu au siège social, coté et paraphé, sur lequel sont reportées, dans l'ordre chronologique, l'ensemble des décisions prises. Ce registre peut être tenu sous forme électronique dans les conditions prévues par la loi.");
  s.push("");
  s.push("L'approbation des comptes annuels et la décision d'affectation du résultat doivent intervenir dans le délai de six (6) mois suivant la clôture de l'exercice social.");
  s.push("");
  s.push("Le rapport de gestion, les comptes annuels et, le cas échéant, le rapport du Commissaire aux comptes sont adressés à l'Associé unique au moins un (1) mois avant l'expiration du délai prévu pour l'approbation des comptes.");

  // ── Article 25 — Décisions collectives en cas de pluralité future d'associés ──
  s.push("");
  s.push("### Article 25 — Décisions collectives en cas de pluralité future d'associés");
  s.push("");
  s.push("En cas de pluralité d'associés, les dispositions du présent article se substitueront de plein droit aux dispositions de l'article 24 ci-dessus relatives aux décisions de l'Associé unique.");
  s.push("");

  // 25.1 — Convocation
  s.push("**25.1 — Convocation**");
  s.push("");
  s.push("Les décisions collectives des associés sont prises en assemblée générale ou par voie de consultation écrite, au choix du Président.");
  s.push("");
  s.push("L'assemblée générale est convoquée par le Président, ou à défaut par le Commissaire aux comptes s'il en existe un, par lettre recommandée avec accusé de réception adressée à chaque associé au moins quinze (15) jours avant la date de la réunion. La convocation indique l'ordre du jour, la date, l'heure et le lieu de la réunion.");
  s.push("");
  s.push("La réunion d'une assemblée générale est obligatoire lorsqu'elle est demandée par un ou plusieurs associés représentant au moins vingt-cinq pour cent (25 %) du capital social.");
  s.push("");

  // 25.2 — Représentation
  s.push("**25.2 — Représentation et droit de communication**");
  s.push("");
  s.push("Chaque associé peut se faire représenter aux assemblées générales par son conjoint, son partenaire lié par un pacte civil de solidarité ou par un autre associé, muni d'un pouvoir spécial. Le mandataire doit justifier de son mandat.");
  s.push("");
  s.push("Tout associé a le droit d'obtenir communication des documents nécessaires pour lui permettre de se prononcer en connaissance de cause sur les résolutions proposées, au moins quinze (15) jours avant la date prévue pour la décision. Ces documents comprennent notamment le rapport de gestion, les comptes annuels, le texte des résolutions proposées et, le cas échéant, le rapport du Commissaire aux comptes.");
  s.push("");

  // 25.3 — Décisions ordinaires
  s.push("**25.3 — Décisions ordinaires**");
  s.push("");
  s.push("Les décisions ordinaires sont adoptées par un ou plusieurs associés représentant plus de la moitié du capital social (majorité simple).");
  s.push("");
  s.push("Sur première convocation, les décisions ne sont valablement prises que si les associés présents ou représentés possèdent au moins vingt-cinq pour cent (25 %) des actions ayant le droit de vote.");
  s.push("");
  s.push("Sur deuxième convocation, aucun quorum n'est requis.");
  s.push("");

  // 25.4 — Décisions extraordinaires
  s.push("**25.4 — Décisions extraordinaires**");
  s.push("");
  s.push("Les décisions extraordinaires sont adoptées à la majorité des deux tiers (2/3) des voix des associés présents ou représentés.");
  s.push("");
  s.push("Sur première convocation, les décisions ne sont valablement prises que si les associés présents ou représentés possèdent au moins la moitié (50 %) des actions ayant le droit de vote.");
  s.push("");
  s.push("Sur deuxième convocation, le quorum est ramené à vingt-cinq pour cent (25 %) des actions ayant le droit de vote.");
  s.push("");

  // 25.5 — Unanimité
  s.push("**25.5 — Décisions requérant l'unanimité**");
  s.push("");
  s.push("Les décisions suivantes requièrent l'unanimité des associés :");
  s.push("");
  s.push("- l'adoption ou la modification de clauses d'inaliénabilité des actions (article L. 227-13 du Code de commerce) ;");
  s.push("- l'adoption ou la modification de clauses d'agrément (article L. 227-14 du Code de commerce) ;");
  s.push("- l'adoption ou la modification de clauses d'exclusion (article L. 227-16 du Code de commerce) ;");
  s.push("- l'adoption ou la modification de clauses de suspension des droits non pécuniaires (article L. 227-17 du Code de commerce) ;");
  s.push("- toute décision ayant pour effet d'augmenter les engagements de l'ensemble des associés ;");
  s.push("- le transfert du siège social à l'étranger ;");
  s.push("- la transformation de la Société en société en nom collectif ;");
  s.push("- la dissolution anticipée de la Société.");
  s.push("");

  // 25.6 — Procès-verbaux
  s.push("**25.6 — Procès-verbaux**");
  s.push("");
  s.push("Les délibérations des assemblées générales sont constatées par des procès-verbaux inscrits sur un registre spécial tenu au siège social, coté et paraphé. Les procès-verbaux sont signés par le président de séance et par le secrétaire de séance, le cas échéant.");
  s.push("");
  s.push("Chaque procès-verbal indique la date et le lieu de la réunion, l'ordre du jour, l'identité des associés présents ou représentés, le nombre d'actions détenues par chacun, les documents et rapports soumis à l'assemblée, un résumé des débats, le texte des résolutions mises aux voix et le résultat des votes.");
  s.push("");
  s.push("Les copies ou extraits de procès-verbaux sont valablement certifiés par le Président ou par un fondé de pouvoir habilité à cet effet.");

  // ── Article 26 — Comptes courants d'associés ──
  s.push("");
  s.push("### Article 26 — Comptes courants d'associés");
  s.push("");
  s.push("L'Associé unique peut mettre à la disposition de la Société toutes sommes dont celle-ci peut avoir besoin, sous forme d'avances en compte courant.");
  s.push("");
  s.push("Les conditions de fonctionnement des comptes courants d'associés, et notamment leurs modalités de rémunération et de remboursement, sont déterminées comme suit :");
  s.push("");

  if (v.tauxCC === "legal") {
    s.push("Les sommes ainsi mises à la disposition de la Société sont rémunérées à un taux d'intérêt égal au taux d'intérêt légal en vigueur, dans la limite de la déductibilité fiscale prévue à l'article 39, 1-3° du Code général des impôts.");
  } else if (v.tauxCC === "fixe") {
    s.push(`Les sommes ainsi mises à la disposition de la Société sont rémunérées à un taux d'intérêt fixe de ${v.tauxCCValeur} % par an, dans la limite de la déductibilité fiscale prévue à l'article 39, 1-3° du Code général des impôts.`);
  } else {
    s.push("Les sommes ainsi mises à la disposition de la Société ne donneront lieu à aucune rémunération. Les avances en compte courant seront consenties à titre gratuit.");
  }

  s.push("");

  if (v.plafondCC) {
    s.push(`Le montant total des sommes laissées ou mises à la disposition de la Société au titre des comptes courants d'associés ne pourra excéder la somme de ${v.montantPlafondCC} euros.`);
    s.push("");
  }

  s.push("Le remboursement des avances en compte courant intervient en fonction de la trésorerie disponible de la Société, sur simple demande de l'Associé titulaire du compte, sous réserve que ce remboursement ne compromette pas l'équilibre financier de la Société.");
  s.push("");
  s.push("Conformément aux dispositions de l'article L. 225-43 du Code de commerce, applicables en vertu de l'article L. 227-12 du même code, il est interdit au Président et aux dirigeants de la Société de contracter, sous quelque forme que ce soit, des emprunts auprès de la Société, de se faire consentir par elle un découvert en compte courant ou autrement, ainsi que de faire cautionner ou avaliser par la Société leurs engagements envers les tiers. Cette interdiction s'applique aux représentants permanents des personnes morales dirigeantes, à leur conjoint, ascendants et descendants ainsi qu'à toute personne interposée.");

  return s.join("\n");
}
export function buildTitre6(v: V): string {
  const s: string[] = [];

  s.push("## TITRE 6 — EXERCICE SOCIAL, COMPTES ET RÉSULTATS");

  // ── Article 27 — Exercice social ──
  s.push("");
  s.push("### Article 27 — Exercice social");
  s.push("");
  s.push("Chaque exercice social a une durée de douze (12) mois.");
  s.push("");
  s.push(`Il commence le 1er janvier et se termine le ${v.clotureExercice} de chaque année.`);
  s.push("");
  if (v.clotureProlongee) {
    s.push(`Par exception, le premier exercice social commencera à compter de la date d'immatriculation de la Société au Registre du Commerce et des Sociétés et se terminera le ${v.clotureExercice} de l'année suivant celle de l'immatriculation.`);
  } else {
    s.push(`Par exception, le premier exercice social commencera à compter de la date d'immatriculation de la Société au Registre du Commerce et des Sociétés et se terminera le ${v.clotureExercice} suivant.`);
  }

  // ── Article 28 — Comptes annuels ──
  s.push("");
  s.push("### Article 28 — Comptes annuels");
  s.push("");
  s.push("À la clôture de chaque exercice social, le Président établit un inventaire des divers éléments de l'actif et du passif de la Société, ainsi que les comptes annuels comprenant le bilan, le compte de résultat et l'annexe, conformément aux dispositions légales et réglementaires en vigueur.");
  s.push("");
  s.push("Le Président établit également un rapport de gestion exposant la situation de la Société durant l'exercice écoulé, son évolution prévisible, les événements importants survenus entre la date de clôture de l'exercice et la date à laquelle le rapport est établi, ainsi que les activités en matière de recherche et de développement.");
  s.push("");
  s.push("Les comptes annuels, le rapport de gestion et, le cas échéant, le rapport du Commissaire aux comptes sont soumis à l'approbation de l'Associé unique dans le délai de six (6) mois suivant la clôture de l'exercice social.");
  s.push("");
  s.push("Les comptes annuels régulièrement approuvés sont déposés au greffe du Tribunal de commerce compétent, conformément aux dispositions légales en vigueur relatives au dépôt des comptes au Registre du Commerce et des Sociétés.");

  // ── Article 29 — Affectation et répartition du résultat ──
  s.push("");
  s.push("### Article 29 — Affectation et répartition du résultat");
  s.push("");
  s.push("Le bénéfice distribuable est constitué par le bénéfice de l'exercice, diminué des pertes antérieures et de la dotation à la réserve légale, et augmenté du report bénéficiaire.");
  s.push("");
  s.push("Sur le bénéfice de l'exercice, diminué le cas échéant des pertes antérieures, il est prélevé cinq pour cent (5 %) pour constituer le fonds de réserve légale. Ce prélèvement cesse d'être obligatoire lorsque la réserve légale atteint le dixième (10 %) du capital social ; il reprend son cours lorsque, pour une cause quelconque, la réserve légale est descendue au-dessous de ce dixième.");
  s.push("");
  s.push("Le bénéfice distribuable est, sur décision de l'Associé unique :");
  s.push("");
  s.push("- affecté à un ou plusieurs postes de réserves facultatives, dont l'Associé unique règle l'affectation et l'emploi ;");
  s.push("- reporté à nouveau sur l'exercice suivant ;");
  s.push("- distribué à l'Associé unique sous forme de dividendes.");
  s.push("");
  s.push("L'Associé unique peut décider la mise en distribution de sommes prélevées sur les réserves dont il a la disposition, en indiquant expressément les postes de réserves sur lesquels les prélèvements sont effectués.");
  s.push("");
  s.push("Aucune distribution ne peut être faite lorsque les capitaux propres sont, ou deviendraient à la suite de celle-ci, inférieurs au montant du capital social augmenté des réserves que la loi ou les Statuts ne permettent pas de distribuer.");
  s.push("");
  s.push("La Société peut procéder à la distribution d'acomptes sur dividendes dans les conditions prévues par la loi, sur la base d'un bilan intermédiaire certifié par le Commissaire aux comptes, le cas échéant, faisant apparaître un bénéfice distribuable d'un montant au moins égal à celui des acomptes.");
  s.push("");
  s.push("Les dividendes sont mis en paiement dans le délai maximal de neuf (9) mois à compter de la clôture de l'exercice, sauf prorogation de ce délai par décision de justice.");

  // ── Article 30 — Capitaux propres inférieurs à la moitié du capital social ──
  s.push("");
  s.push("### Article 30 — Capitaux propres inférieurs à la moitié du capital social");
  s.push("");
  s.push("Si, du fait de pertes constatées dans les documents comptables, les capitaux propres de la Société deviennent inférieurs à la moitié du capital social, le Président est tenu, dans les quatre (4) mois qui suivent l'approbation des comptes ayant fait apparaître cette perte, de consulter l'Associé unique à l'effet de décider s'il y a lieu à dissolution anticipée de la Société.");
  s.push("");
  s.push("Si la dissolution n'est pas prononcée, la Société est tenue, au plus tard à la clôture du deuxième exercice suivant celui au cours duquel la constatation des pertes est intervenue, de réduire son capital d'un montant au moins égal à celui des pertes qui n'ont pu être imputées sur les réserves, si dans ce délai les capitaux propres n'ont pas été reconstitués à concurrence d'une valeur au moins égale à la moitié du capital social.");
  s.push("");
  s.push("Dans les deux cas, la décision de l'Associé unique est publiée dans les conditions légales et réglementaires en vigueur.");

  // ── Article 31 — Commissaires aux comptes ──
  s.push("");
  s.push("### Article 31 — Commissaires aux comptes");
  s.push("");
  s.push("Conformément aux dispositions de l'article L. 227-9-1 du Code de commerce, la désignation d'un Commissaire aux comptes n'est pas obligatoire lors de la constitution de la Société, sous réserve que celle-ci ne dépasse pas, à la clôture d'un exercice social, deux des trois seuils suivants fixés par décret.");
  s.push("");
  s.push("La désignation d'un Commissaire aux comptes devient obligatoire lorsque la Société vient à dépasser, à la clôture d'un exercice social, deux des trois seuils fixés par décret en Conseil d'État. Dans ce cas, le Commissaire aux comptes est nommé par décision de l'Associé unique.");
  s.push("");

  if (v.nommerCAC) {
    s.push("L'Associé unique, lors de la constitution de la Société, a décidé de nommer en qualité de Commissaire aux comptes titulaire :");
    s.push("");
    s.push(`**${v.cacDenomination}**, dont le siège est situé à ${v.cacAdresse}.`);
    s.push("");
    s.push("Le Commissaire aux comptes est nommé pour une durée de six (6) exercices, soit jusqu'à l'issue de la décision de l'Associé unique statuant sur les comptes du sixième exercice clos après sa nomination.");
  } else {
    s.push("Lors de la constitution de la Société, l'Associé unique n'a pas jugé nécessaire de nommer un Commissaire aux comptes, la Société ne dépassant pas les seuils légaux rendant cette nomination obligatoire.");
  }

  // ── Article 32 — Option pour l'imposition des bénéfices ──
  s.push("");
  s.push("### Article 32 — Option pour l'imposition des bénéfices");
  s.push("");

  if (v.regimeFiscal === "is") {
    s.push("La Société est soumise à l'impôt sur les sociétés (IS) dans les conditions de droit commun prévues aux articles 205 et suivants du Code général des impôts.");
    s.push("");
    s.push("Cette option pour l'impôt sur les sociétés est irrévocable.");
  } else {
    s.push("Conformément aux dispositions de l'article 239 bis AB du Code général des impôts, la Société opte pour le régime fiscal des sociétés de personnes (impôt sur le revenu) pour une durée maximale de cinq (5) exercices.");
    s.push("");
    s.push("En conséquence, les bénéfices de la Société seront imposés directement entre les mains de l'Associé unique, dans la catégorie correspondant à l'activité de la Société, proportionnellement à ses droits dans la Société.");
    s.push("");
    s.push("Cette option est subordonnée au respect des conditions d'éligibilité prévues par la loi, et notamment :");
    s.push("");
    s.push("- la Société exerce à titre principal une activité commerciale, artisanale, agricole ou libérale, à l'exclusion de la gestion de son propre patrimoine mobilier ou immobilier ;");
    s.push("- la Société n'est pas cotée sur un marché réglementé ;");
    s.push("- la Société emploie moins de cinquante (50) salariés et réalise un chiffre d'affaires annuel ou a un total de bilan inférieur à dix (10) millions d'euros ;");
    s.push("- la Société a été créée depuis moins de cinq (5) ans à la date de l'option.");
    s.push("");
    s.push("L'option pourra être révoquée dans les conditions prévues par la loi. En cas de révocation ou d'expiration du délai de cinq exercices, la Société sera de plein droit soumise à l'impôt sur les sociétés.");
  }

  return s.join("\n");
}
export function buildTitre7(v: V): string {
  const s: string[] = [];

  s.push("## TITRE 7 — DISSOLUTION, LIQUIDATION ET DISPOSITIONS FINALES");

  // ── Article 33 — Transformation ──
  s.push("");
  s.push("### Article 33 — Transformation");
  s.push("");
  s.push("La Société peut être transformée en société de toute autre forme par décision de l'Associé unique, sous réserve du respect des conditions légales et réglementaires applicables à la forme nouvelle adoptée.");
  s.push("");
  s.push("La transformation en société en nom collectif requiert l'accord unanime des associés. La transformation en société à responsabilité limitée ou en société anonyme est décidée dans les conditions prévues par la loi pour chacune de ces formes sociales.");
  s.push("");
  s.push("La transformation ne donne pas lieu à la création d'une personne morale nouvelle. Elle n'entraîne ni dissolution ni création d'un être moral nouveau.");

  // ── Article 34 — Dissolution et liquidation ──
  s.push("");
  s.push("### Article 34 — Dissolution et liquidation");
  s.push("");
  s.push("**34.1 — Dissolution en présence d'un Associé unique personne morale**");
  s.push("");
  s.push("Si l'Associé unique est une personne morale, la dissolution de la Société entraîne la transmission universelle du patrimoine de la Société à l'Associé unique, conformément aux dispositions de l'article 1844-5 du Code civil, sans qu'il y ait lieu à liquidation.");
  s.push("");
  s.push("Les créanciers de la Société peuvent faire opposition à cette transmission dans un délai de trente (30) jours à compter de la publication de la dissolution. Le cas échéant, le tribunal compétent peut rejeter l'opposition ou ordonner le remboursement des créances ou la constitution de garanties suffisantes.");
  s.push("");
  s.push("La transmission universelle du patrimoine n'est effective qu'à l'expiration du délai d'opposition ou, le cas échéant, lorsque l'opposition a été rejetée en première instance ou que le remboursement des créances a été effectué ou les garanties constituées.");
  s.push("");
  s.push("**34.2 — Dissolution en présence de plusieurs associés**");
  s.push("");
  s.push("En cas de pluralité d'associés, la dissolution de la Société entraîne sa liquidation dans les conditions prévues par les articles L. 237-1 et suivants du Code de commerce.");
  s.push("");
  s.push("Un ou plusieurs liquidateurs sont nommés par la décision collective des associés qui prononce la dissolution. Le liquidateur représente la Société. Il est investi des pouvoirs les plus étendus pour réaliser l'actif, payer le passif et répartir le solde disponible.");
  s.push("");
  s.push("Le produit net de la liquidation, après apurement du passif et remboursement aux associés du montant nominal de leurs actions, est réparti entre les associés proportionnellement au nombre d'actions détenues par chacun d'eux.");

  // ── Article 35 — Contestations ──
  s.push("");
  s.push("### Article 35 — Contestations");
  s.push("");
  s.push("Toutes les contestations qui pourraient s'élever pendant la durée de la Société ou lors de sa liquidation, soit entre l'Associé unique ou les associés et la Société, soit entre les associés eux-mêmes, relativement aux affaires sociales, seront soumises à la juridiction des tribunaux compétents du ressort du siège social de la Société.");
  s.push("");
  s.push("Préalablement à toute action judiciaire, les parties s'efforceront de résoudre leur différend à l'amiable, le cas échéant par voie de médiation conventionnelle. La durée de la médiation ne pourra excéder trois (3) mois, renouvelable une fois d'un commun accord.");

  // ── Article 36 — Personnalité morale ──
  s.push("");
  s.push("### Article 36 — Personnalité morale");
  s.push("");
  s.push("La Société jouira de la personnalité morale à compter de son immatriculation au Registre du Commerce et des Sociétés.");
  s.push("");
  s.push("Le Président est chargé d'accomplir toutes les formalités nécessaires à l'immatriculation de la Société, et notamment le dépôt des Statuts et des pièces annexes au greffe du Tribunal de commerce compétent.");
  s.push("");
  s.push("La signature des présents Statuts par l'Associé unique emporte approbation et reprise automatique des engagements souscrits et des actes accomplis pour le compte de la Société en formation, tels que décrits dans l'état annexé aux présents Statuts ou dans les Statuts eux-mêmes. Ces engagements et actes seront réputés avoir été souscrits et accomplis par la Société dès l'origine, à compter de son immatriculation.");

  // ── Article 37 — Protection des données personnelles (RGPD) ──
  s.push("");
  s.push("### Article 37 — Protection des données personnelles (RGPD)");
  s.push("");
  s.push("La Société s'engage à respecter la réglementation en vigueur applicable au traitement de données à caractère personnel, et notamment le Règlement (UE) 2016/679 du Parlement européen et du Conseil du 27 avril 2016 (Règlement Général sur la Protection des Données — RGPD) ainsi que la loi n° 78-17 du 6 janvier 1978 relative à l'informatique, aux fichiers et aux libertés, dans sa version modifiée.");
  s.push("");
  s.push("Les données à caractère personnel traitées dans le cadre de la constitution et du fonctionnement de la Société comprennent notamment les données d'identité (nom, prénoms, date et lieu de naissance, nationalité), les coordonnées personnelles et professionnelles (adresse postale, adresse électronique, numéro de téléphone) et les informations relatives à la participation au capital.");
  s.push("");
  s.push("Le traitement de ces données est fondé sur :");
  s.push("");
  s.push("- l'obligation légale à laquelle la Société est soumise, notamment en matière de tenue des registres sociaux, de déclarations auprès du greffe et des administrations compétentes ;");
  s.push("- l'intérêt légitime de la Société pour la gestion de ses associés et de ses organes de direction.");
  s.push("");
  s.push("Les données personnelles sont conservées pendant toute la durée de la vie sociale de la Société, augmentée des délais de prescription légale applicables.");
  s.push("");
  s.push("Conformément à la réglementation applicable, toute personne concernée dispose d'un droit d'accès, de rectification, d'effacement, d'opposition, de limitation du traitement et de portabilité de ses données, qu'elle peut exercer en adressant une demande écrite au Président de la Société à l'adresse du siège social.");

  // ── Article 38 — Publicité ──
  s.push("");
  s.push("### Article 38 — Publicité");
  s.push("");
  s.push("Tous pouvoirs sont donnés au porteur d'un original ou d'une copie certifiée conforme des présents Statuts pour effectuer toutes les formalités de publicité prescrites par la loi.");
  s.push("");
  s.push("Tous pouvoirs sont également conférés à la société LegalCorners, Société par Actions Simplifiée, immatriculée au Registre du Commerce et des Sociétés de Paris sous le numéro 988 485 405, dont le siège social est situé 78 avenue des Champs-Élysées, Bureau 326, 75008 Paris, à l'effet d'accomplir toutes les formalités de publicité requises par la loi, et notamment la publication d'un avis de constitution dans un journal d'annonces légales habilité dans le département du siège social de la Société.");

  // ── Article 39 — État des actes accomplis pour la Société en formation ──
  s.push("");
  s.push("### Article 39 — État des actes accomplis pour la Société en formation");
  s.push("");

  if (v.hasDepenses) {
    s.push("Conformément aux dispositions de l'article L. 210-6 du Code de commerce, un état des actes accomplis pour le compte de la Société en formation, avec l'indication pour chacun d'eux de l'engagement qui en résulterait pour la Société, est annexé aux présents Statuts.");
    s.push("");
    s.push("La signature des présents Statuts par l'Associé unique emportera reprise automatique de ces engagements par la Société, qui en sera tenue dès son immatriculation au Registre du Commerce et des Sociétés comme si elle les avait souscrits dès l'origine.");
  } else {
    s.push("L'Associé unique déclare qu'aucun acte n'a été accompli pour le compte de la Société en formation antérieurement à la signature des présents Statuts.");
  }

  // ── Article 40 — Mandat de constitution ──
  s.push("");
  s.push("### Article 40 — Mandat de constitution");
  s.push("");
  s.push("L'Associé unique donne expressément mandat à la société LegalCorners, Société par Actions Simplifiée, immatriculée au Registre du Commerce et des Sociétés de Paris sous le numéro 988 485 405, dont le siège social est situé 78 avenue des Champs-Élysées, Bureau 326, 75008 Paris, à l'effet d'accomplir, au nom et pour le compte de la Société en formation, toutes les formalités nécessaires à la constitution de la Société, et notamment :");
  s.push("");
  s.push("- la publication d'un avis de constitution dans un journal d'annonces légales ;");
  s.push("- le dépôt du dossier d'immatriculation auprès du guichet unique compétent ;");
  s.push("- l'accomplissement de toute démarche administrative nécessaire à l'immatriculation de la Société au Registre du Commerce et des Sociétés.");
  s.push("");
  s.push("Les actes et engagements accomplis dans le cadre de ce mandat seront réputés avoir été accomplis par la Société dès son immatriculation au Registre du Commerce et des Sociétés.");

  return s.join("\n");
}
export function buildSignatures(v: V): string {
  const s: string[] = [];

  s.push("---");
  s.push("");
  s.push(`Fait à ${v.lieuSignature}, le ${v.dateSignature}.`);
  s.push("");
  s.push("**Signature de l'Associé unique**");
  s.push("");
  s.push("_______________________________");
  s.push(v.signatureAssocie);

  if (!v.isPresidentAssocie) {
    s.push("");
    s.push("**Signature du Président**");
    s.push("_Bon pour acceptation des fonctions de Président(e)_");
    s.push("");
    s.push("_______________________________");
    s.push(v.presidentNomination);
  }

  if (v.hasDG) {
    s.push("");
    s.push("**Signature du Directeur Général**");
    s.push("_Bon pour acceptation des fonctions de Directeur Général_");
    s.push("");
    s.push("_______________________________");
    s.push(v.dgNomination);
  }

  return s.join("\n");
}

// ── Main export ──────────────────────────────────────────────────────────────

export function buildStatutsComplets(answers: Answers): string {
  const v = prep(answers);
  return [
    buildCouverture(v),
    buildSommaire(v),
    buildDeclarations(v),
    buildTitre1(v),
    buildTitre2(v),
    buildTitre3(v),
    buildTitre4(v),
    buildTitre5(v),
    buildTitre6(v),
    buildTitre7(v),
    buildSignatures(v),
  ].filter(Boolean).join("\n\n");
}
