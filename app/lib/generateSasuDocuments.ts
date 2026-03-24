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
