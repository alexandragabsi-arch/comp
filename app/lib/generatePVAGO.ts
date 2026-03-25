// ── PV AGO (Assemblée Générale Ordinaire) — Approbation des comptes ──────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataAGO = Record<string, any>;

function fmtDate(date?: string): string {
  if (!date) return new Date().toLocaleDateString("fr-FR");
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString("fr-FR");
}

function fmtDateLong(date?: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function fmtNum(n: number): string {
  return n.toLocaleString("fr-FR");
}

export function buildPVAGO(data: DataAGO): string {
  const denomination = data.denomination || data.company_name || "[DÉNOMINATION]";
  const formeJuridique = data.forme_juridique || "SAS";
  const capital = data.capital || "[CAPITAL]";
  const siege = data.adresse_siege || "[ADRESSE]";
  const rcs = data.rcs || data.siren || "[RCS]";
  const villeRCS = data.ville_rcs || "Paris";

  const dateAG = data.date_ag || data.date_cloture || "";
  const dateAGLong = fmtDateLong(dateAG);
  const dateAGShort = fmtDate(dateAG);
  const heureOuverture = data.heure_ouverture || "10h00";
  const heureCloture = data.heure_cloture || "11h30";
  const lieuAG = data.lieu_ag || siege;

  const presidentSeance = data.president_seance || data.president_nom || "[NOM DU PRÉSIDENT]";
  const fonctionPresident = data.fonction_president || "Président de la Société";

  const dateCloture = fmtDate(data.date_cloture);
  const dateDebutExercice = fmtDate(data.date_debut);

  const nbParts = data.nb_parts || data.nb_actions || "1 000";
  const totalParts = data.total_parts || nbParts;

  const resultat = Number(data.resultat) || 0;
  const isBenefice = resultat >= 0;
  const resultatLabel = isBenefice ? "bénéfice net" : "perte nette";
  const resultatMontant = fmtNum(Math.abs(resultat));

  // Affectation du résultat
  const reserveLegale = Number(data.reserve_legale) || 0;
  const reserveStatutaire = Number(data.reserve_statutaire) || 0;
  const reportNouveau = Number(data.report_nouveau) || 0;
  const dividendes = Number(data.dividendes) || 0;

  // Historique dividendes
  const divN1 = data.dividendes_n1 || "—";
  const divN2 = data.dividendes_n2 || "—";
  const divN3 = data.dividendes_n3 || "—";

  const modeVersement = data.mode_versement || "virement bancaire";

  const lines: string[] = [];

  // ── TITRE ──
  lines.push("# PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE ORDINAIRE");
  lines.push("");
  lines.push(`Réunie le ${dateAGLong}`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(`**${denomination}**`);
  lines.push(`${formeJuridique} au capital de ${fmtNum(Number(capital))} €`);
  lines.push(`${siege}`);
  lines.push(`RCS ${villeRCS} n° ${rcs}`);
  lines.push("");
  lines.push("---");

  // ── I. CONSTITUTION ──
  lines.push("");
  lines.push("## I. CONSTITUTION DE L'ASSEMBLÉE");
  lines.push("");
  lines.push(`**Date de réunion** : ${dateAGShort}`);
  lines.push("");
  lines.push(`**Heure d'ouverture** : ${heureOuverture}`);
  lines.push("");
  lines.push(`**Lieu** : ${lieuAG}`);
  lines.push("");
  lines.push(`**Président de séance** : ${presidentSeance} — ${fonctionPresident}`);
  lines.push("");
  lines.push("L'Assemblée a été convoquée par le Président. Les convocations ont été adressées en mains propres contre émargement.");
  lines.push("");
  lines.push(`Les associés présents et représentés totalisent ${fmtNum(Number(nbParts))} parts sociales sur un total de ${fmtNum(Number(totalParts))}, soit 100 % du capital.`);
  lines.push("");
  lines.push("Les conditions de quorum nécessaires pour cette Assemblée sont remplies. L'Assemblée peut valablement délibérer.");

  // ── II. DOCUMENTS ──
  lines.push("");
  lines.push("## II. DOCUMENTS MIS À LA DISPOSITION DES ASSOCIÉS");
  lines.push("");
  lines.push("Le Président dépose sur le bureau et met à la disposition des associés :");
  lines.push("");
  lines.push("- La copie de la lettre de convocation adressée à chaque associé");
  lines.push("- La feuille de présence");
  lines.push("- Un exemplaire des statuts à jour");
  lines.push(`- Les comptes annuels de l'exercice clos le ${dateCloture}`);
  lines.push("- Le texte des résolutions proposées à l'Assemblée");
  lines.push("- Le rapport de gestion du Président");
  lines.push("");
  lines.push("Il est procédé à la lecture du rapport du Président.");

  // ── III. QUESTIONS ──
  lines.push("");
  lines.push("## III. QUESTIONS PRÉALABLES");
  lines.push("");
  lines.push("Aucune question écrite n'a été posée par les associés préalablement à l'Assemblée.");

  // ── IV. ORDRE DU JOUR ──
  lines.push("");
  lines.push("## IV. ORDRE DU JOUR");
  lines.push("");
  lines.push("L'Assemblée est réunie à l'effet de délibérer sur l'ordre du jour suivant :");
  lines.push("");
  lines.push("1. Approbation des comptes annuels");
  lines.push("2. Affectation du résultat de l'exercice");
  lines.push("3. Délégation de pouvoirs en vue des formalités légales");

  // ── RÉSOLUTIONS ──
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## RÉSOLUTIONS");

  // ── Résolution 1 ──
  lines.push("");
  lines.push("### RÉSOLUTION N°1 — APPROBATION DES COMPTES ANNUELS");
  lines.push("");
  lines.push(`L'Assemblée approuve les comptes annuels de l'exercice clos le ${dateCloture}.`);
  lines.push("");
  lines.push(`Ces comptes se traduisent par un ${resultatLabel} de **${resultatMontant} €**.`);
  lines.push("");
  lines.push("L'Assemblée approuve l'ensemble des opérations traduites dans ces comptes et donne quitus au Président de sa gestion pour l'exercice écoulé.");
  lines.push("");
  lines.push("*La résolution est adoptée à l'unanimité.*");

  // ── Résolution 2 ──
  lines.push("");
  lines.push("### RÉSOLUTION N°2 — AFFECTATION DU RÉSULTAT");
  lines.push("");

  if (isBenefice) {
    lines.push(`L'Assemblée décide que le ${resultatLabel} de l'exercice clos le ${dateCloture}, d'un montant de **${resultatMontant} €**, sera réparti comme suit :`);
    lines.push("");
    lines.push(`| Affectation | Montant |`);
    lines.push(`|---|---|`);
    lines.push(`| Réserve légale | ${fmtNum(reserveLegale)} € |`);
    lines.push(`| Réserve statutaire | ${fmtNum(reserveStatutaire)} € |`);
    lines.push(`| Report à nouveau | ${fmtNum(reportNouveau)} € |`);
    lines.push(`| Dividendes distribués aux associés | ${fmtNum(dividendes)} € |`);
    lines.push("");

    if (dividendes > 0) {
      lines.push(`Les dividendes d'un montant de **${fmtNum(dividendes)} €** seront versés aux associés par ${modeVersement}.`);
      lines.push("");
      lines.push("Conformément aux dispositions légales, il est rappelé ci-dessous le montant des dividendes distribués au titre des trois derniers exercices :");
      lines.push("");
      lines.push("| Exercice N-1 | Exercice N-2 | Exercice N-3 |");
      lines.push("|---|---|---|");
      lines.push(`| ${divN1} | ${divN2} | ${divN3} |`);
      lines.push("");
    }
  } else {
    lines.push(`L'Assemblée constate que l'exercice clos le ${dateCloture} se solde par une perte de **${resultatMontant} €**.`);
    lines.push("");
    lines.push(`L'Assemblée décide d'affecter cette perte en totalité au compte « Report à nouveau débiteur ».`);
    lines.push("");
  }

  lines.push("*La résolution est adoptée à l'unanimité.*");

  // ── Résolution 3 ──
  lines.push("");
  lines.push("### RÉSOLUTION N°3 — DÉLÉGATION DE POUVOIRS EN VUE DES FORMALITÉS");
  lines.push("");
  lines.push("L'Assemblée confère tous pouvoirs au porteur d'une copie ou d'un extrait du présent procès-verbal à l'effet d'accomplir toutes les formalités légales requises.");
  lines.push("");
  lines.push("*La résolution est adoptée à l'unanimité.*");

  // ── CLÔTURE ──
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## CLÔTURE DE LA SÉANCE");
  lines.push("");
  lines.push(`L'ordre du jour étant épuisé, la séance est levée à ${heureCloture}.`);
  lines.push("");
  lines.push("De tout ce qui précède, il a été dressé le présent procès-verbal, signé par le Président de séance.");
  lines.push("");
  lines.push("");
  lines.push(`**LE PRÉSIDENT DE SÉANCE**`);
  lines.push("");
  lines.push(`${presidentSeance}`);
  lines.push(`${fonctionPresident}`);
  lines.push("");
  lines.push("");
  lines.push("");
  lines.push("_______________________________");
  lines.push("Signature");
  lines.push("");
  lines.push("");
  lines.push(`Fait à ${lieuAG},`);
  lines.push(`le ${dateAGShort}`);

  return lines.join("\n");
}
