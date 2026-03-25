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
    if (t === 7 || t === 9) return tens[t] + "-" + units[10 + u];
    if (t === 8 && u === 0) return "quatre-vingts";
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
    `Capital social : **${capital} euros**`,
    `Siège social : **${v.siege}**`,
    "",
    "===",
  ].join("\n");
}
export function buildSommaire(v: V): string {
  const lines: string[] = [
    "## SOMMAIRE",
    "",
    "DÉCLARATIONS PRÉLIMINAIRES ET TERMINOLOGIE",
    "",
    "TITRE 1 — CARACTÉRISTIQUES DE LA SOCIÉTÉ",
    "Art. 1 — Forme de la Société",
    "Art. 2 — Objet social",
    "Art. 3 — Dénomination sociale",
    "Art. 4 — Siège social",
    "Art. 5 — Durée de la Société",
    "",
    "TITRE 2 — APPORTS — CAPITAL SOCIAL — ACTIONS",
    "Art. 6 — Apports",
    "Art. 7 — Capital social",
  ];

  if (v.isCapitalVariable) {
    lines.push("Art. 8 — Variabilité du capital");
  } else {
    lines.push("Art. 8 — Augmentation et réduction du capital");
  }

  lines.push(
    "Art. 9 — Actions",
    "Art. 10 — Libération des actions",
    "Art. 11 — Droits et obligations attachés aux actions",
    "Art. 12 — Indivisibilité des actions",
    "",
    "TITRE 3 — CESSION ET TRANSMISSION DES ACTIONS",
    "Art. 13 — Cession des actions",
    "Art. 14 — Agrément",
    "Art. 15 — Transmission des actions",
    "Art. 16 — Nantissement des actions",
    "Art. 17 — Location des actions",
    "",
    "TITRE 4 — DIRECTION ET ADMINISTRATION DE LA SOCIÉTÉ",
    "Art. 18 — Président",
    "Art. 19 — Pouvoirs du Président",
    "Art. 20 — Rémunération du Président",
    "Art. 21 — Responsabilité du Président",
  );

  if (v.hasDG) {
    lines.push(
      "Art. 22 — Directeur Général",
      "Art. 23 — Pouvoirs du Directeur Général",
    );
  } else {
    lines.push(
      "Art. 22 — Directeur Général (réservé)",
      "Art. 23 — Pouvoirs du Directeur Général (réservé)",
    );
  }

  lines.push(
    "Art. 24 — Conventions réglementées",
    "",
    "TITRE 5 — DÉCISIONS DE L'ASSOCIÉ UNIQUE",
    "Art. 25 — Compétence de l'Associé unique",
    "Art. 26 — Modalités des décisions",
    "Art. 27 — Droit de communication",
    "Art. 28 — Registre des décisions",
    "",
    "TITRE 6 — COMPTES SOCIAUX — AFFECTATION DU RÉSULTAT",
    "Art. 29 — Exercice social",
    "Art. 30 — Comptes annuels",
    "Art. 31 — Affectation et répartition du résultat",
    "Art. 32 — Dividendes",
    "Art. 33 — Comptes courants d'associé",
  );

  if (v.nommerCAC) {
    lines.push("Art. 34 — Commissaire aux comptes");
  } else {
    lines.push("Art. 34 — Commissaire aux comptes (réservé)");
  }

  lines.push(
    "",
    "TITRE 7 — DISPOSITIONS DIVERSES",
    "Art. 35 — Non-concurrence",
    "Art. 36 — Transformation de la Société",
    "Art. 37 — Dissolution — Liquidation",
    "Art. 38 — Contestations",
    "Art. 39 — Actes accomplis pour le compte de la Société en formation",
    "Art. 40 — Formalités",
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
      lines.push(
        "Conformément aux dispositions de l'article L.227-1 du Code de commerce, des apports en industrie pourront être effectués au profit de la Société."
      );
      lines.push("");
      lines.push(
        "Les actions émises en contrepartie d'apports en industrie sont des actions inaliénables, qui ne concourent pas à la formation du capital social. Elles donnent toutefois droit à une quote-part des bénéfices et confèrent le droit de participer aux décisions collectives, dans les conditions déterminées par les présents statuts."
      );
      lines.push("");
      lines.push(
        "L'apporteur en industrie est tenu d'exécuter sa prestation personnellement et de manière effective. En cas de manquement grave à cette obligation, l'Associé unique pourra décider le rachat forcé des actions d'industrie dans les conditions prévues aux présents statuts."
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
export function buildTitre3(v: V): string { return ""; }
export function buildTitre4(v: V): string { return ""; }
export function buildTitre5(v: V): string { return ""; }
export function buildTitre6(v: V): string { return ""; }
export function buildTitre7(v: V): string { return ""; }
export function buildSignatures(v: V): string { return ""; }

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
