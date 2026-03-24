import {
  TEMPLATE_ATTESTATION_ORIGINE,
  TEMPLATE_DISPENSE_CAA,
  TEMPLATE_NON_CONDAMNATION,
  TEMPLATE_ATTESTATION_HEBERGEMENT,
  TEMPLATE_ATTESTATION_BIENS_COMMUNS,
} from "./templates";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Answers = Record<string, any>;

/** Convertit un nombre en lettres (simplifié) */
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

function formatDate(date?: string): string {
  if (!date) return new Date().toLocaleDateString("fr-FR");
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString("fr-FR");
}

function civilite(answers: Answers): string {
  return answers.assoc_genre === "F" ? "Madame" : "Monsieur";
}

// ── Attestation d'origine patrimoniale des apports ──────────────────────────
export function buildAttestationOrigine(answers: Answers): string {
  const isMarieCommunaute =
    answers.situation_matrimoniale === "marie" &&
    (answers.regime_matrimonial === "communaute_reduite" ||
      answers.regime_matrimonial === "communaute_universelle" ||
      answers.regime_matrimonial === "participation_acquets");
  const isPacseIndivision = answers.situation_matrimoniale === "pacse";

  // Bloc apport numéraire
  let blocNumeraire = "";
  if (answers.apport_numeraire && Number(answers.montant_numeraire) > 0) {
    const montant = Number(answers.montant_numeraire);
    const montantLettres = numberToWords(montant);
    blocNumeraire = `### Origine de l'apport en numéraire

La somme de **${montant} euros** (${montantLettres} euros), apportée au capital social de la société dénommée **${answers.nom_societe || "[DÉNOMINATION]"}** :

• Constitue un **bien propre**, relevant exclusivement de mon patrimoine personnel.${isPacseIndivision ? "\n• Provient de biens personnels dans le cadre d'un PACS, conformément à mon régime patrimonial." : ""}`;
  }

  // Bloc apports en nature
  let blocNature = "";
  if (answers.apport_nature && answers.apports_nature_liste?.length > 0) {
    const items = answers.apports_nature_liste
      .map((apport: { description: string; valeur: number; bien_type?: string }, idx: number) => {
        const val = Number(apport.valeur);
        const valLettres = numberToWords(val);
        let bienType = "• Il constitue un **bien propre**, appartenant exclusivement à mon patrimoine personnel.";
        if (isMarieCommunaute && apport.bien_type === "commun") {
          bienType = "• Il constitue un **bien commun** — j'ai informé mon conjoint de l'utilisation de ce bien.";
        }
        if (isPacseIndivision) {
          bienType += "\n• Dans le cadre d'un PACS, il constitue un bien relevant uniquement de mon patrimoine personnel.";
        }
        return `**Bien N° ${idx + 1}**
**Description :** ${apport.description}
**Valeur déclarée :** ${val} € (${valLettres} euros)
${bienType}`;
      })
      .join("\n\n");

    blocNature = `### Origine des apports en nature

${items}`;
  }

  let text = TEMPLATE_ATTESTATION_ORIGINE;
  text = text.replace("{CiviliteAssocie}", civilite(answers));
  text = text.replace("{PrenomAssocie}", answers.assoc_prenom || "[PRÉNOM]");
  text = text.replace("{NomAssocie}", answers.assoc_nom || "[NOM]");
  text = text.replace("{AdresseComplete-Associe}", answers.assoc_adresse || "[ADRESSE]");
  text = text.replace("{DateNaissance-Associe}", formatDate(answers.assoc_date_naissance));
  text = text.replace("{LieuNaissance-Associe}", answers.assoc_lieu_naissance || "[LIEU]");
  text = text.replace("{BLOC_APPORT_NUMERAIRE}", blocNumeraire);
  text = text.replace("{BLOC_APPORT_NATURE}", blocNature);
  text = text.replace("{VilleSignature}", answers.ville_signature || "[VILLE]");
  text = text.replace("{CurrentDateTime}", formatDate(answers.date_signature));
  // signature block
  text = text.replace(
    /\{CiviliteAssocie\}/g,
    civilite(answers)
  );
  text = text.replace(/\{PrenomAssocie\}/g, answers.assoc_prenom || "[PRÉNOM]");
  text = text.replace(/\{NomAssocie\}/g, answers.assoc_nom || "[NOM]");

  return text;
}

// ── Déclaration de dispense de nomination d'un commissaire aux apports ──────
export function buildDispenseCAA(answers: Answers): string {
  const isPersonnePhysique = answers.type_associe !== "morale";

  // Bloc identité associé
  let blocIdentite = "";
  if (isPersonnePhysique) {
    blocIdentite = `**Civilité :** ${civilite(answers)}
**Nom :** ${answers.assoc_nom || "[NOM]"}
**Prénom :** ${answers.assoc_prenom || "[PRÉNOM]"}
**Date et lieu de naissance :** ${formatDate(answers.assoc_date_naissance)} à ${answers.assoc_lieu_naissance || "[LIEU]"}
**Nationalité :** ${answers.assoc_nationalite || "Française"}
**Adresse personnelle :** ${answers.assoc_adresse || "[ADRESSE]"}`;
  } else {
    blocIdentite = `**Dénomination sociale :** ${answers.assoc_pm_denomination || "[DÉNOMINATION]"}
**Forme juridique :** ${answers.assoc_pm_forme || "[FORME]"}
**Capital social :** ${answers.assoc_pm_capital || "[CAPITAL]"} €
**Siège social :** ${answers.assoc_pm_siege || "[ADRESSE]"}
**RCS / Registre :** ${answers.assoc_pm_siren || "[SIREN]"}
**Ville d'immatriculation :** ${answers.assoc_pm_ville_rcs || "[VILLE RCS]"}

Représentée par :
**Nom et prénom :** ${answers.assoc_pm_representant_civilite || ""} ${answers.assoc_pm_representant_prenom || "[PRÉNOM]"} ${answers.assoc_pm_representant_nom || "[NOM]"}
**Qualité :** ${answers.assoc_pm_representant_qualite || "[QUALITÉ]"}`;
  }

  // Bloc liste apports nature
  let blocApports = "";
  let totalNature = 0;
  if (answers.apports_nature_liste?.length > 0) {
    blocApports = answers.apports_nature_liste
      .map((apport: { description: string; valeur: number }, idx: number) => {
        const val = Number(apport.valeur);
        totalNature += val;
        return `**Apport N° ${idx + 1}**
**Description :** ${apport.description}
**Valeur déclarée :** ${val} €`;
      })
      .join("\n\n");
  }

  // Bloc signature
  let blocSignature = "";
  if (isPersonnePhysique) {
    blocSignature = `L'ASSOCIÉ(E) UNIQUE
${civilite(answers)} ${answers.assoc_prenom || "[PRÉNOM]"} ${answers.assoc_nom || "[NOM]"}

Signature :`;
  } else {
    blocSignature = `L'ASSOCIÉ UNIQUE
**Nom, prénom et qualité du signataire :** ${answers.assoc_pm_representant_civilite || ""} ${answers.assoc_pm_representant_prenom || "[PRÉNOM]"} ${answers.assoc_pm_representant_nom || "[NOM]"}, ${answers.assoc_pm_representant_qualite || "[QUALITÉ]"}

Signature et cachet :`;
  }

  let text = TEMPLATE_DISPENSE_CAA;
  text = text.replace("{Denomination-Sociale}", answers.nom_societe || "[DÉNOMINATION]");
  text = text.replace("{montant-capital-chiffre}", answers.capital_social || "[MONTANT]");
  text = text.replace("{Adresse-Complete}", answers.adresse_siege || "[ADRESSE]");
  text = text.replace("{BLOC_IDENTITE_ASSOCIE}", blocIdentite);
  text = text.replace("{BLOC_LISTE_APPORTS_NATURE}", blocApports);
  text = text.replace("{montant-nature-total-chiffre}", String(totalNature));
  text = text.replace("{VilleSignature}", answers.ville_signature || "[VILLE]");
  text = text.replace("{CurrentDateTime}", formatDate(answers.date_signature));
  text = text.replace("{BLOC_SIGNATURE_ASSOCIE}", blocSignature);

  return text;
}

// ── Déclaration de non-condamnation et de filiation ─────────────────────────
export function buildNonCondamnation(answers: Answers): string {
  const isPersonnePhysique = answers.type_associe !== "morale";

  // Bloc identité
  let blocIdentite = "";
  if (isPersonnePhysique) {
    blocIdentite = `Je soussigné(e) : **${civilite(answers)} ${answers.assoc_prenom || "[PRÉNOM]"} ${answers.assoc_nom || "[NOM]"}**, demeurant à ${answers.assoc_adresse || "[ADRESSE]"}, né${answers.assoc_genre === "F" ? "e" : ""} le ${formatDate(answers.assoc_date_naissance)} à ${answers.assoc_lieu_naissance || "[LIEU]"}, de nationalité ${answers.assoc_nationalite || "française"}.`;
  } else {
    blocIdentite = `Je soussigné(e) : **${answers.assoc_pm_representant_civilite || ""} ${answers.assoc_pm_representant_prenom || "[PRÉNOM]"} ${answers.assoc_pm_representant_nom || "[NOM]"}**, demeurant à ${answers.assoc_pm_representant_adresse || "[ADRESSE]"}, né(e) le ${formatDate(answers.assoc_pm_representant_date_naissance)} à ${answers.assoc_pm_representant_lieu_naissance || "[LIEU]"}.

Agissant en qualité de représentant permanent de la société **${answers.assoc_pm_denomination || "[DÉNOMINATION]"}**, elle-même nommée dirigeant de la Société.`;
  }

  // Bloc signature
  let blocSignature = "";
  if (isPersonnePhysique) {
    blocSignature = `${civilite(answers)} ${answers.assoc_prenom || "[PRÉNOM]"} ${answers.assoc_nom || "[NOM]"}`;
  } else {
    blocSignature = `La société dénommée **${answers.assoc_pm_denomination || "[DÉNOMINATION]"}**`;
  }

  let text = TEMPLATE_NON_CONDAMNATION;
  text = text.replace("{BLOC_IDENTITE_DECLARANT}", blocIdentite);
  text = text.replace("{PrenomPere}", answers.prenom_pere || "[PRÉNOM PÈRE]");
  text = text.replace("{NomPere}", answers.nom_pere || "[NOM PÈRE]");
  text = text.replace("{PrenomMere}", answers.prenom_mere || "[PRÉNOM MÈRE]");
  text = text.replace("{NomMere}", answers.nom_mere || "[NOM MÈRE]");
  text = text.replace("{VilleSignature}", answers.ville_signature || "[VILLE]");
  text = text.replace("{CurrentDateTime}", formatDate(answers.date_signature));
  text = text.replace("{BLOC_SIGNATURE_DECLARANT}", blocSignature);

  return text;
}

// ── Attestation de mise à disposition / hébergement de locaux ────────────────
export function buildAttestationHebergement(answers: Answers): string {
  const isHebergeurPhysique = answers.hebergeur_type !== "morale";

  // Bloc identité hébergeur
  let blocIdentite = "";
  if (isHebergeurPhysique) {
    blocIdentite = `**Civilité :** ${answers.hebergeur_civilite || "Monsieur"}
**Nom :** ${answers.hebergeur_nom || "[NOM]"}
**Prénom :** ${answers.hebergeur_prenom || "[PRÉNOM]"}
**Date et lieu de naissance :** ${formatDate(answers.hebergeur_date_naissance)} à ${answers.hebergeur_lieu_naissance || "[LIEU]"}
**Adresse personnelle :** ${answers.adresse_siege || "[ADRESSE]"}`;
  } else {
    blocIdentite = `**Dénomination sociale :** ${answers.hebergeur_denomination || "[DÉNOMINATION]"}
**Forme juridique :** ${answers.hebergeur_forme || "[FORME]"}
**Capital social :** ${answers.hebergeur_capital || "[CAPITAL]"} €
**Siège social :** ${answers.hebergeur_siege || "[ADRESSE]"}
**Numéro RCS :** ${answers.hebergeur_siren || "[SIREN]"} — Ville : ${answers.hebergeur_ville_rcs || "[VILLE]"}

Représentée par :
**Civilité, Nom et prénom :** ${answers.hebergeur_representant_prenom || "[PRÉNOM]"} ${answers.hebergeur_representant_nom || "[NOM]"}
**Qualité :** ${answers.hebergeur_representant_qualite || "[QUALITÉ]"}`;
  }

  // Nature des locaux
  const natureMap: Record<string, string> = {
    habitation: "Logement à usage d'habitation",
    bureau: "Bureau / local professionnel",
    commercial: "Local commercial",
  };
  const nature = answers.nature_locaux ? (natureMap[answers.nature_locaux] || answers.nature_locaux_autre || "[À PRÉCISER]") : "[À PRÉCISER]";

  // Titre d'occupation
  const titreMap: Record<string, string> = {
    proprietaire: "**Propriétaire**",
    locataire: "**Locataire**",
    sous_locataire: "**Sous-locataire autorisé**",
  };
  const titre = answers.titre_occupation ? (titreMap[answers.titre_occupation] || answers.titre_occupation_autre || "[À PRÉCISER]") : "[À PRÉCISER]";

  // Modalités
  const modaliteMap: Record<string, string> = {
    hebergement_gratuit: "**Hébergement à titre gratuit** (domiciliation au domicile du metteur à disposition — sans contrepartie financière)",
    mise_dispo_gratuit: "**Mise à disposition de locaux à titre gratuit** (hors domicile personnel)",
    mise_dispo_onereux: "**Mise à disposition de locaux à titre onéreux**",
  };
  const modalite = answers.modalite_mise_dispo ? (modaliteMap[answers.modalite_mise_dispo] || "[À PRÉCISER]") : "[À PRÉCISER]";

  // Usage autorisé
  const usageMap: Record<string, string> = {
    siege_seul: "**Domiciliation du siège social uniquement**",
    siege_activite: "**Domiciliation du siège social et exercice de l'activité**",
  };
  const usage = answers.usage_locaux ? (usageMap[answers.usage_locaux] || "[À PRÉCISER]") : "[À PRÉCISER]";

  // Bloc signature
  let blocSignature = "";
  if (isHebergeurPhysique) {
    blocSignature = `Metteur à disposition / Hébergeur — Personne physique
${answers.hebergeur_civilite || "Monsieur"} ${answers.hebergeur_prenom || "[PRÉNOM]"} ${answers.hebergeur_nom || "[NOM]"}

Signature :`;
  } else {
    blocSignature = `Metteur à disposition / Hébergeur — Personne morale
**Nom, prénom et qualité du signataire :** ${answers.hebergeur_representant_prenom || "[PRÉNOM]"} ${answers.hebergeur_representant_nom || "[NOM]"}, ${answers.hebergeur_representant_qualite || "[QUALITÉ]"}

Signature et cachet :`;
  }

  let text = TEMPLATE_ATTESTATION_HEBERGEMENT;
  text = text.replace("{Denomination-Sociale}", answers.nom_societe || "[DÉNOMINATION]");
  text = text.replace("{montant-capital-chiffre}", answers.capital_social || "[MONTANT]");
  text = text.replace(/\{Adresse-Complete\}/g, answers.adresse_siege || "[ADRESSE]");
  text = text.replace("{BLOC_IDENTITE_HEBERGEUR}", blocIdentite);
  text = text.replace("{NatureLocaux}", nature);
  text = text.replace("{TitreOccupation}", titre);
  text = text.replace("{ModalitesMiseDisposition}", modalite);
  text = text.replace("{UsageAutorise}", usage);
  text = text.replace("{VilleSignature}", answers.ville_signature || "[VILLE]");
  text = text.replace("{CurrentDateTime}", formatDate(answers.date_signature));
  text = text.replace("{BLOC_SIGNATURE_HEBERGEUR}", blocSignature);

  return text;
}

// ── Attestation d'origine de biens communs des apports ──────────────────────
export function buildAttestationBiensCommuns(answers: Answers): string {
  // Bloc apport numéraire
  let blocNumeraire = "";
  if (answers.apport_numeraire && Number(answers.apport_numeraire) > 0) {
    const montant = Number(answers.apport_numeraire);
    const montantLettres = numberToWords(montant);
    blocNumeraire = `### Apport en numéraire

La somme de **${montant} euros** (${montantLettres} euros) apportée au capital :

• **Bien commun** (mariage ou PACS avec mise en commun) — j'ai informé mon conjoint / partenaire de l'utilisation de cette somme.`;
  }

  // Bloc apports en nature
  let blocNature = "";
  if (answers.apports_nature_liste?.length > 0) {
    const items = answers.apports_nature_liste
      .map((apport: { description: string; valeur: number }, idx: number) => {
        const val = Number(apport.valeur);
        const valLettres = numberToWords(val);
        return `**Bien N° ${idx + 1}**
**Description :** ${apport.description}
**Valeur déclarée :** ${val} € (${valLettres} euros)
• **Bien commun** — j'ai informé mon conjoint / partenaire.`;
      })
      .join("\n\n");

    blocNature = `### Apport(s) en nature

${items}`;
  }

  // Qualité conjoint
  const qualiteConjoint = answers.situation_matrimoniale === "pacse" ? "Partenaire de PACS" : "Conjoint(e)";

  let text = TEMPLATE_ATTESTATION_BIENS_COMMUNS;
  text = text.replace(/\{CiviliteAssocie\}/g, civilite(answers));
  text = text.replace(/\{PrenomAssocie\}/g, answers.assoc_prenom || "[PRÉNOM]");
  text = text.replace(/\{NomAssocie\}/g, answers.assoc_nom || "[NOM]");
  text = text.replace("{AdressePersonnelle}", answers.assoc_adresse || "[ADRESSE]");
  text = text.replace("{DateNaissance-Associe}", formatDate(answers.assoc_date_naissance));
  text = text.replace("{LieuNaissance-Associe}", answers.assoc_lieu_naissance || "[LIEU]");
  text = text.replace(/\{Denomination-Sociale\}/g, answers.nom_societe || "[DÉNOMINATION]");
  text = text.replace("{BLOC_APPORT_NUMERAIRE}", blocNumeraire);
  text = text.replace("{BLOC_APPORT_NATURE}", blocNature);
  text = text.replace(/\{VilleSignature\}/g, answers.ville_signature || "[VILLE]");
  text = text.replace(/\{CurrentDateTime\}/g, formatDate(answers.date_signature));
  text = text.replace("{CiviliteConjoint}", answers.conjoint_civilite || "[CIVILITÉ]");
  text = text.replace("{PrenomConjoint}", answers.conjoint_prenom || "[PRÉNOM]");
  text = text.replace("{NomConjoint}", answers.conjoint_nom || "[NOM]");
  text = text.replace("{QualiteConjoint}", qualiteConjoint);

  return text;
}

// ── Annonce légale SASU ─────────────────────────────────────────────────────
export function buildAnnonceLegaleSASU(answers: Answers): string {
  const isHolding = answers.type_structure === "holding_passive" || answers.type_structure === "holding_animatrice";
  const typeLabel = isHolding ? "SASU Holding" : "SASU";

  const presidentInfo = answers.president_type === "associe"
    ? (answers.type_associe === "morale"
      ? `${answers.assoc_pm_denomination || "[DÉNOMINATION]"} — ${answers.assoc_pm_siren || "[SIREN]"} — Représentée par ${answers.assoc_pm_representant_civilite || ""} ${answers.assoc_pm_representant_prenom || "[PRÉNOM]"} ${answers.assoc_pm_representant_nom || "[NOM]"} (${answers.assoc_pm_representant_qualite || "[QUALITÉ]"})`
      : `${civilite(answers)} ${answers.assoc_prenom || "[PRÉNOM]"} ${answers.assoc_nom || "[NOM]"} — ${answers.assoc_adresse || "[ADRESSE]"}`)
    : answers.president_type === "tiers_physique"
      ? `${answers.president_civilite || "Monsieur"} ${answers.president_prenom || "[PRÉNOM]"} ${answers.president_nom || "[NOM]"} — ${answers.president_adresse || "[ADRESSE]"}`
      : `${answers.president_pm_denomination || "[DÉNOMINATION]"} — ${answers.president_pm_siren || "[SIREN]"}`;

  const duree = answers.duree_societe === "personnalisee"
    ? (answers.duree_societe_annees || "99")
    : "99";

  const contenu = `CONSTITUTION DE ${typeLabel.toUpperCase()}

===

Par acte SSP en date du **${formatDate(answers.date_signature)}**, il a été constitué une ${typeLabel} présentant les caractéristiques suivantes :

---

**Dénomination :** ${answers.nom_societe || "[DÉNOMINATION]"}

**Siège social :** ${answers.adresse_siege || "[ADRESSE]"}

**Capital social :** ${answers.capital_social || "[MONTANT]"} €

**Objet social :** ${answers.objet_social || "[OBJET SOCIAL]"}

**Présidence :** ${presidentInfo}

**Durée :** ${duree} ans à compter de son immatriculation au RCS.`;

  return contenu;
}

// ── Statuts SASU (modèle complet) ─────────────────────────────────────────
export function buildStatutsSASU(answers: Answers): string {
  const denomination = answers.nom_societe || "[DÉNOMINATION]";
  const sigle = answers.sigle || "";
  const enseigne = answers.enseigne || "";
  const nomCommercial = answers.nom_commercial || "";
  const siege = answers.adresse_siege || "[ADRESSE DU SIÈGE]";
  const capital = Number(answers.capital_social) || 1;
  const capitalLetters = numberToWords(capital);
  const isSimplifiee = answers.formule_capital === "simplifiee";
  const valeurAction = isSimplifiee ? 1 : (Number(answers.valeur_action) || 1);
  const nbActions = Math.floor(capital / valeurAction);
  const isVariable = answers.type_capital === "variable";
  const capitalMin = Number(answers.capital_minimum) || capital;
  const capitalMinLetters = numberToWords(capitalMin);
  const capitalMax = Number(answers.capital_maximum) || capital * 10;
  const capitalMaxLetters = numberToWords(capitalMax);
  const duree = answers.duree_societe === "personnalisee" ? (answers.duree_societe_annees || "99") : "99";
  const dureeLetters = numberToWords(Number(duree));
  const dateSignature = formatDate(answers.date_signature);
  const lieuSignature = answers.lieu_signature_type === "siege" ? siege : (answers.lieu_signature_autre || siege);
  const objet = answers.objet_social || "[OBJET SOCIAL]";

  // Flags
  const isAssociePhysique = answers.type_associe !== "morale";
  const isHoldingPassive = answers.type_structure === "holding_passive";
  const isHoldingAnimatrice = answers.type_structure === "holding_animatrice";
  const hasDG = answers.nommer_dg === "oui";
  const isPresidentAssocie = answers.president_option === "associe";
  const isPresidentPM = answers.president_type === "morale";
  const hasManagementFees = answers.management_fees === "oui";
  const isVersementPartiel = answers.versement_capital === "partiel";
  const pourcentageVerse = answers.pourcentage_verse || "50";
  const hasApportNature = answers.apport_nature === "oui" || (answers.apports_nature_liste?.length > 0);
  const hasApportIndustrie = answers.apport_industrie === "oui";
  const montantNumeraire = Number(answers.capital_social) || 1;

  // Associé unique
  const associeIdentite = isAssociePhysique
    ? `${answers.associe_civilite === "Mme" ? "Madame" : "Monsieur"} ${answers.associe_prenom || "[PRÉNOM]"} ${answers.associe_nom || "[NOM]"}, demeurant à ${answers.associe_adresse || "[ADRESSE]"}, né(e) le ${formatDate(answers.associe_date_naissance)} à ${answers.associe_lieu_naissance || "[LIEU]"}, de nationalité ${answers.associe_nationalite || "française"}.`
    : `La société dénommée ${answers.associe_societe_nom || "[DÉNOMINATION]"}, ${answers.associe_societe_forme || "[FORME]"}, au capital de ${answers.associe_societe_capital || "[CAPITAL]"} euros, siège social à ${answers.associe_societe_adresse || "[ADRESSE]"}, immatriculée au RCS sous le n° ${answers.associe_societe_siren || "[SIREN]"}, représentée par ${answers.associe_societe_representant || "[REPRÉSENTANT]"}.`;

  // Situation matrimoniale
  let situationMatrimoniale = "";
  if (isAssociePhysique) {
    const sit = answers.situation_matrimoniale;
    if (sit === "celibataire") situationMatrimoniale = "Célibataire, ni marié(e) ni pacsé(e).";
    else if (sit === "marie") {
      const regime = answers.regime_matrimonial;
      const regimeLabel = regime === "communaute_reduite" ? "la communauté réduite aux acquêts"
        : regime === "separation_biens" ? "la séparation de biens (contrat de mariage signé)"
        : regime === "participation_acquets" ? "la participation aux acquêts"
        : regime === "communaute_universelle" ? "la communauté universelle"
        : "[RÉGIME]";
      situationMatrimoniale = `Marié(e) à ${answers.conjoint_nom || "[CONJOINT]"}, sous le régime de ${regimeLabel}.`;
    } else if (sit === "pacse") situationMatrimoniale = `Pacsé(e) à ${answers.conjoint_nom || "[PARTENAIRE]"}.`;
    else if (sit === "divorce") situationMatrimoniale = "Divorcé(e) et non remarié(e).";
    else if (sit === "veuf") situationMatrimoniale = "Veuf/Veuve.";
  }

  // Président
  let presidentNomination = "";
  if (isPresidentAssocie && isAssociePhysique) {
    presidentNomination = `${answers.associe_civilite === "Mme" ? "Madame" : "Monsieur"} ${answers.associe_prenom || "[PRÉNOM]"} ${answers.associe_nom || "[NOM]"}, né(e) le ${formatDate(answers.associe_date_naissance)}, domicilié(e) à ${answers.associe_adresse || "[ADRESSE]"}.`;
  } else if (isPresidentAssocie && !isAssociePhysique) {
    presidentNomination = `La société ${answers.associe_societe_nom || "[DÉNOMINATION]"}, immatriculée au RCS sous le n° ${answers.associe_societe_siren || "[SIREN]"}, représentée par son représentant permanent ${answers.associe_societe_representant || "[REPRÉSENTANT]"}.`;
  } else if (answers.president_type === "physique") {
    presidentNomination = `${answers.president_civilite === "Mme" ? "Madame" : "Monsieur"} ${answers.president_prenom || "[PRÉNOM]"} ${answers.president_nom || "[NOM]"}, né(e) le ${formatDate(answers.president_date_naissance)}, domicilié(e) à ${answers.president_adresse || "[ADRESSE]"}.`;
  } else {
    presidentNomination = `La société ${answers.president_pm_nom || "[DÉNOMINATION]"}, immatriculée au RCS sous le n° ${answers.president_pm_siren || "[SIREN]"}, représentée par son représentant permanent ${answers.president_rp_civilite === "Mme" ? "Madame" : "Monsieur"} ${answers.president_rp_prenom || "[PRÉNOM]"} ${answers.president_rp_nom || "[NOM]"}.`;
  }

  const dureeMandat = answers.duree_mandat === "determinee"
    ? `pour une durée de ${answers.duree_mandat_annees || "[X]"} ans`
    : "pour une durée indéterminée";
  const mandatRenouvelable = answers.mandat_renouvelable === "non" ? "non renouvelable" : "renouvelable";

  // DG
  let dgNomination = "";
  if (hasDG) {
    dgNomination = `${answers.dg_civilite === "Mme" ? "Madame" : "Monsieur"} ${answers.dg_prenom || "[PRÉNOM]"} ${answers.dg_nom || "[NOM]"}, né(e) le ${formatDate(answers.dg_date_naissance)}, domicilié(e) à ${answers.dg_adresse || "[ADRESSE]"}.`;
  }

  // Signature associe
  const signatureAssocie = isAssociePhysique
    ? `${answers.associe_prenom || "[PRÉNOM]"} ${answers.associe_nom || "[NOM]"} — Associé(e) unique${isPresidentAssocie ? " et Président(e)" : ""}`
    : `${answers.associe_societe_nom || "[DÉNOMINATION]"} — Associé(e) unique${isPresidentAssocie ? " et Président(e)" : ""}`;

  return `STATUTS DE LA SOCIÉTÉ
${denomination.toUpperCase()}${sigle}
SOCIÉTÉ PAR ACTIONS SIMPLIFIÉE UNIPERSONNELLE
AU CAPITAL${isVariable ? " VARIABLE" : ""} DE ${capital.toLocaleString("fr-FR")} EUROS

===

ENTRE LES SOUSSIGNÉS :

${associeIdentite}

Ci-après dénommé(e) « l'Associé unique »,

IL A ÉTÉ ÉTABLI AINSI QU'IL SUIT LES STATUTS DE LA SOCIÉTÉ PAR ACTIONS SIMPLIFIÉE UNIPERSONNELLE DEVANT ÊTRE IMMATRICULÉE AU REGISTRE DU COMMERCE ET DES SOCIÉTÉS.

---

TITRE I — FORME – OBJET – DÉNOMINATION – SIÈGE – DURÉE

---

**Article 1 — Forme**

Il est constitué par les présentes une Société par Actions Simplifiée Unipersonnelle (SASU) régie par les articles L. 227-1 et suivants du Code de commerce, ainsi que par les présents statuts.

**Article 2 — Objet social**

La Société a pour objet, en France et à l'étranger :

${objet}

Et plus généralement, toutes opérations industrielles, commerciales, financières, civiles, mobilières ou immobilières, pouvant se rattacher directement ou indirectement à l'objet social ou à tout objet similaire, connexe ou complémentaire.

**Article 3 — Dénomination sociale**

La Société est dénommée : **${denomination}**${sigle}.

Dans tous les actes et documents émanant de la Société et destinés aux tiers, la dénomination sociale doit toujours être précédée ou suivie des mots « Société par Actions Simplifiée Unipersonnelle » ou du sigle « SASU », du montant du capital social et du numéro d'immatriculation au Registre du Commerce et des Sociétés.

**Article 4 — Siège social**

Le siège social est fixé au : **${siege}**.

Il pourra être transféré en tout autre endroit par décision de l'Associé unique.

**Article 5 — Durée**

La durée de la Société est fixée à **${duree} ans** à compter de son immatriculation au Registre du Commerce et des Sociétés, sauf dissolution anticipée ou prorogation.

---

TITRE II — APPORTS – CAPITAL SOCIAL

---

**Article 6 — Apports**

Lors de la constitution, l'Associé unique a effectué un apport en numéraire d'un montant de **${capital.toLocaleString("fr-FR")} euros**, intégralement libéré.

Cette somme a été déposée sur un compte bloqué ouvert au nom de la Société en formation auprès de ${answers.etablissement_depot || "[ÉTABLISSEMENT BANCAIRE]"}.

**Article 7 — Capital social**

${isVariable
    ? `Le capital social est variable. Il est fixé à ${capital.toLocaleString("fr-FR")} euros (${capitalLetters} euros). Il ne peut être inférieur à ${capitalMin.toLocaleString("fr-FR")} euros ni supérieur à ${capitalMax.toLocaleString("fr-FR")} euros. Il est divisé en ${nbActions.toLocaleString("fr-FR")} actions d'une valeur nominale de ${valeurAction} euro${valeurAction > 1 ? "s" : ""} chacune, entièrement souscrites et libérées.`
    : `Le capital social est fixé à la somme de ${capital.toLocaleString("fr-FR")} euros (${capitalLetters} euros). Il est divisé en ${nbActions.toLocaleString("fr-FR")} actions d'une valeur nominale de ${valeurAction} euro${valeurAction > 1 ? "s" : ""} chacune, entièrement souscrites et libérées.`}

Les actions sont nominatives. Elles sont indivisibles à l'égard de la Société.

**Article 8 — Modifications du capital social**

Le capital social peut être augmenté ou réduit par décision de l'Associé unique, dans les conditions prévues par la loi.

---

TITRE III — ADMINISTRATION ET DIRECTION

---

**Article 9 — Président**

La Société est dirigée par un Président, personne physique ou morale, associé ou non.

Est nommé(e) en qualité de premier Président :

${presidentNomination}

Le Président est nommé pour une durée ${answers.duree_mandat === "determinee" ? `de ${answers.duree_mandat_annees || "[X]"} ans` : "indéterminée"}.

Le Président représente la Société à l'égard des tiers. Il est investi des pouvoirs les plus étendus pour agir en toute circonstance au nom de la Société, dans la limite de l'objet social et sous réserve des pouvoirs que la loi attribue expressément à l'Associé unique.
${hasDG ? `
**Article 10 — Directeur Général**

Est nommé(e) en qualité de premier Directeur Général :

${dgNomination}

Le Directeur Général dispose des mêmes pouvoirs que le Président à l'égard des tiers.
` : ""}
**Article ${hasDG ? "11" : "10"} — Rémunération des dirigeants**

Le Président${hasDG ? " et le Directeur Général" : ""} ${answers.president_remunere === "oui" ? "exercera ses fonctions à titre rémunéré. Les conditions de sa rémunération seront fixées par décision de l'Associé unique" : "exercera ses fonctions à titre gratuit"}.

---

TITRE IV — DÉCISIONS DE L'ASSOCIÉ UNIQUE

---

**Article ${hasDG ? "12" : "11"} — Décisions de l'Associé unique**

L'Associé unique exerce les pouvoirs dévolus à l'assemblée des actionnaires. Ses décisions sont consignées dans un registre spécial.

L'Associé unique ne peut déléguer ses pouvoirs. Il prend toutes les décisions de sa compétence unilatéralement et les consigne dans un procès-verbal.

**Article ${hasDG ? "13" : "12"} — Comptes sociaux et affectation des résultats**

À la clôture de chaque exercice, le Président établit les comptes annuels. L'Associé unique statue sur les comptes et décide de l'affectation du résultat.

Sur le bénéfice de l'exercice, diminué des pertes antérieures, il est prélevé 5 % pour constituer le fonds de réserve légale. Ce prélèvement cesse d'être obligatoire lorsque la réserve atteint le dixième du capital social.

Le solde, augmenté du report à nouveau bénéficiaire, est à la libre disposition de l'Associé unique.

---

TITRE V — EXERCICE SOCIAL – COMPTES

---

**Article ${hasDG ? "14" : "13"} — Exercice social**

Chaque exercice social a une durée de douze mois. Il commence le 1er janvier et se termine le 31 décembre de chaque année.

Exceptionnellement, le premier exercice comprendra le temps écoulé entre la date d'immatriculation de la Société et le 31 décembre de l'année en cours${answers.cloture_prolongee === "oui" ? ", prolongé jusqu'au 31 décembre de l'année suivante" : ""}.

---

TITRE VI — DISSOLUTION – LIQUIDATION

---

**Article ${hasDG ? "15" : "14"} — Dissolution**

La Société est dissoute dans les cas prévus par la loi ou par décision de l'Associé unique. La dissolution entraîne la liquidation de la Société.

**Article ${hasDG ? "16" : "15"} — Liquidation**

En cas de dissolution, l'Associé unique règle le mode de liquidation et nomme un liquidateur dont il détermine les pouvoirs. Le liquidateur dispose des pouvoirs les plus étendus pour réaliser l'actif et payer le passif.

---

TITRE VII — RÉGIME FISCAL

---

**Article ${hasDG ? "17" : "16"} — Régime fiscal**

La Société est soumise à ${answers.regime_fiscal === "ir" ? "l'impôt sur le revenu (option temporaire — 5 ans max)" : "l'impôt sur les sociétés"}.

---

TITRE VIII — DISPOSITIONS DIVERSES

---

**Article ${hasDG ? "18" : "17"} — Contestations**

Toutes les contestations qui pourraient s'élever pendant la durée de la Société ou lors de sa liquidation entre l'Associé unique et la Société seront soumises à la juridiction des tribunaux compétents.

**Article ${hasDG ? "19" : "18"} — Frais**

Les frais, droits et honoraires des présentes et de leurs suites seront pris en charge par la Société au titre des frais de constitution.

**Article ${hasDG ? "20" : "19"} — Pouvoirs**

Tous pouvoirs sont donnés au Président pour accomplir les formalités de publicité et d'immatriculation prescrites par la loi.

---

Fait à ${lieuSignature}, le ${dateSignature}.

En un exemplaire original.


**L'Associé unique :**


_______________________________
${isAssociePhysique ? `${answers.associe_prenom || "[PRÉNOM]"} ${answers.associe_nom || "[NOM]"}` : `${answers.associe_societe_nom || "[DÉNOMINATION]"}, représentée par ${answers.associe_societe_representant || "[REPRÉSENTANT]"}`}
`;
}
