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
export function buildTitre1(v: V): string { return ""; }
export function buildTitre2(v: V): string { return ""; }
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
