import { FormData } from "../types/form";

function n(v?: string) {
  return v || "[À COMPLÉTER]";
}

export function generatePV(data: FormData): string {
  const s = data.societe;
  const pv = data.pv;
  const cedant = data.cedant;
  const cessionnaire = data.cessionnaire;

  const nomCedant =
    cedant.typePersonne === "physique" && cedant.physique
      ? `${cedant.physique.civilite} ${cedant.physique.nom} ${cedant.physique.prenom}`
      : cedant.morale?.denomination || "[CÉDANT]";

  const nomCessionnaire =
    cessionnaire.typePersonne === "physique" && cessionnaire.physique
      ? `${cessionnaire.physique.civilite} ${cessionnaire.physique.nom} ${cessionnaire.physique.prenom}`
      : cessionnaire.morale?.denomination || "[CESSIONNAIRE]";

  const typeTitre = ["SARL", "EURL", "SNC", "SCI"].includes(s.formeJuridique || "")
    ? "parts sociales"
    : "actions";

  const nbTitres = n(cedant.nombreTitresCedes);
  const totalTitres = n(s.nombreTitresTotal);
  const pct = s.nombreTitresTotal && cedant.nombreTitresCedes
    ? ((parseInt(cedant.nombreTitresCedes) / parseInt(s.nombreTitresTotal)) * 100).toFixed(2)
    : "[XX]";

  let doc = "";

  // En-tête société
  doc += `${n(s.denomination)}\n`;
  doc += `${n(s.formeJuridique)} — Capital : ${n(s.capital)} — RCS ${n(s.rcsVille)} n° ${n(s.rcsNumero)}\n`;
  doc += `Siège social : ${n(s.adresse)}\n\n`;
  doc += `${"═".repeat(60)}\n`;

  // Titre du PV selon type
  if (pv.typeAssemblee === "AGE") {
    doc += `PROCÈS-VERBAL D'ASSEMBLÉE GÉNÉRALE EXTRAORDINAIRE\n`;
  } else if (pv.typeAssemblee === "associe_unique") {
    doc += `PROCÈS-VERBAL DE L'ASSOCIÉ UNIQUE\n`;
  } else {
    doc += `DÉCISIONS UNANIMES DES ASSOCIÉS\n`;
  }
  doc += `${"═".repeat(60)}\n`;
  doc += `Fait à ${n(pv.ville)}, le ${n(pv.date)}\n\n`;

  // Ouverture de séance
  doc += `${"─".repeat(60)}\n`;
  doc += `OUVERTURE DE LA SÉANCE\n`;
  doc += `${"─".repeat(60)}\n\n`;

  if (pv.typeAssemblee === "AGE") {
    doc += `Le ${n(pv.date)} à ${n(pv.heure)}, à ${n(pv.ville)}, les associés de la société ${n(s.denomination)} se sont réunis en Assemblée Générale Extraordinaire.\n\n`;
    doc += `Les associés ont été convoqués par ${n(pv.convocationMode)} en date du ${n(pv.convocationDate)}.\n\n`;
    doc += `Les associés présents et, le cas échéant, représentés, totalisent ${totalTitres} ${typeTitre} sur un total de ${totalTitres} ${typeTitre}. Les conditions de quorum sont remplies.\n\n`;
    doc += `L'Assemblée est présidée par ${pv.presidentCivilite || "M./Mme"} ${n(pv.presidentNom)} ${n(pv.presidentPrenom)}, en sa qualité de ${n(pv.presidentQualite)}.\n\n`;
    doc += `Le Président constate que l'Assemblée, régulièrement constituée, peut valablement délibérer.\n\n`;
    if (pv.questionsEcrites) {
      doc += `Les questions écrites adressées préalablement à la présente Assemblée ont été lues et prises en compte.\n\n`;
    } else {
      doc += `Aucune question écrite n'a été posée par les associés préalablement à la présente Assemblée.\n\n`;
    }
  } else {
    doc += `Le ${n(pv.date)}, l'associé unique / la totalité des associés de la société ${n(s.denomination)}, représentant l'intégralité du capital social, ont pris unanimement les décisions suivantes :\n\n`;
  }

  // Ordre du jour
  doc += `Ordre du jour :\n`;
  if (pv.changementDirigeant) {
    doc += `• Fin des fonctions de dirigeant de ${pv.presidentCivilite || ""} ${n(pv.ancienDirigeantNom)} ${n(pv.ancienDirigeantPrenom)} ;\n`;
    doc += `• Nomination en tant que ${n(pv.nouveauDirigeantFonction)} de ${pv.nouveauDirigeantCivilite || ""} ${n(pv.nouveauDirigeantNom)} ${n(pv.nouveauDirigeantPrenom)} ;\n`;
  }
  if (!data.cessionnaireIsSocieteCible) {
    doc += `• Approbation de la qualité de nouvel associé à ${nomCessionnaire} ;\n`;
  }
  doc += `• Agrément à la cession des ${typeTitre} ;\n`;
  doc += `• Constatation de la cession ;\n`;
  doc += `• Délégation des pouvoirs en vue des formalités.\n\n`;

  let resNum = 1;

  // Résolution – Démission du dirigeant (si applicable)
  if (pv.changementDirigeant) {
    doc += `${"─".repeat(60)}\n`;
    doc += `RÉSOLUTION ${resNum} — DÉMISSION DU DIRIGEANT\n`;
    doc += `${"─".repeat(60)}\n\n`;
    const titrePresidente = pv.typeAssemblee === "AGE" ? "L'Assemblée" : pv.typeAssemblee === "associe_unique" ? "L'Associé unique" : "L'unanimité des associés";
    doc += `${titrePresidente} prend acte de la démission de ${pv.ancienDirigeantCivilite || "M./Mme"} ${n(pv.ancienDirigeantNom)} ${n(pv.ancienDirigeantPrenom)}, né(e) le ${n(pv.ancienDirigeantDateNaissance)}, de ses fonctions de ${n(pv.ancienDirigeantFonction)} de la Société, à compter du jour de la cession.\n\n`;
    doc += `${titrePresidente} lui donne quitus entier et définitif de sa gestion pour toute la durée de ses fonctions.\n\n`;
    doc += `La résolution est adoptée à l'unanimité des associés présents ou représentés.\n\n`;
    resNum++;

    // Nomination nouveau dirigeant
    doc += `${"─".repeat(60)}\n`;
    doc += `RÉSOLUTION ${resNum} — NOMINATION DU NOUVEAU DIRIGEANT\n`;
    doc += `${"─".repeat(60)}\n\n`;
    doc += `${titrePresidente} décide de nommer :\n\n`;
    if (cessionnaire.typePersonne === "physique" && cessionnaire.physique) {
      const p = cessionnaire.physique;
      doc += `${p.civilite} ${p.nom} ${p.prenom}, né(e) le ${n(p.dateNaissance)}, demeurant ${n(p.adresse)},\n\n`;
    } else if (cessionnaire.morale) {
      doc += `La société ${cessionnaire.morale.denomination}, immatriculée au RCS de ${n(cessionnaire.morale.rcsVille)} sous le numéro ${n(cessionnaire.morale.rcsNumero)},\n\n`;
    }
    doc += `en qualité de ${n(pv.nouveauDirigeantFonction)} de la Société, à compter du jour de la cession, pour une durée ${n(pv.dureeMandat)}.\n\n`;
    doc += `La résolution est adoptée à l'unanimité des associés présents ou représentés.\n\n`;
    resNum++;
  }

  const titreAss = pv.typeAssemblee === "AGE" ? "L'Assemblée" : pv.typeAssemblee === "associe_unique" ? "L'Associé unique" : "L'unanimité des associés";

  // Résolution – Approbation du nouvel associé (pas applicable si rachat par la société)
  if (!data.cessionnaireIsSocieteCible) {
    doc += `${"─".repeat(60)}\n`;
    doc += `RÉSOLUTION ${resNum} — APPROBATION DE LA QUALITÉ DE NOUVEL ASSOCIÉ\n`;
    doc += `${"─".repeat(60)}\n\n`;
    doc += `${titreAss} décide de donner la qualité d'associé de la Société à :\n\n`;
    if (cessionnaire.typePersonne === "physique" && cessionnaire.physique) {
      const p = cessionnaire.physique;
      doc += `${p.civilite} ${p.nom} ${p.prenom}, né(e) le ${n(p.dateNaissance)}, demeurant ${n(p.adresse)},\n\n`;
    } else if (cessionnaire.morale) {
      doc += `La société ${cessionnaire.morale.denomination}, immatriculée au RCS de ${n(cessionnaire.morale.rcsVille)} sous le numéro ${n(cessionnaire.morale.rcsNumero)},\n\n`;
    }
    doc += `à compter du jour de la cession.\n\n`;
    doc += `La résolution est adoptée à l'unanimité des associés présents ou représentés.\n\n`;
    resNum++;
  }

  // Résolution – Agrément / Autorisation rachat
  doc += `${"─".repeat(60)}\n`;
  if (data.cessionnaireIsSocieteCible) {
    doc += `RÉSOLUTION ${resNum} — AUTORISATION DU RACHAT DE ${typeTitre.toUpperCase()} PROPRES\n`;
    doc += `${"─".repeat(60)}\n\n`;
    doc += `${titreAss}, après avoir pris connaissance du projet de rachat de ${typeTitre} propres formé entre :\n`;
    doc += `• Le Cédant : ${nomCedant}\n`;
    doc += `• La Société (Cessionnaire) : ${n(s.denomination)}\n\n`;
    doc += `portant sur le rachat de ${nbTitres} ${typeTitre} représentant ${pct} % du capital social, autorise expressément ce rachat conformément aux dispositions légales applicables et aux termes de l'acte signé ce jour.\n\n`;
  } else {
    doc += `RÉSOLUTION ${resNum} — AGRÉMENT DE LA CESSION\n`;
    doc += `${"─".repeat(60)}\n\n`;
    doc += `${titreAss}, après avoir pris connaissance du projet de cession formé entre :\n`;
    doc += `• Le Cédant : ${nomCedant}\n`;
    doc += `• Le Cessionnaire : ${nomCessionnaire}\n\n`;
    doc += `portant sur la cession de ${nbTitres} ${typeTitre} de la Société, représentant ${pct} % du capital social, autorise expressément cette cession dans les conditions prévues aux statuts et aux termes de l'acte de cession signé ce jour.\n\n`;
  }
  doc += `La résolution est adoptée à l'unanimité des associés présents ou représentés.\n\n`;
  resNum++;

  // Résolution – Constatation
  doc += `${"─".repeat(60)}\n`;
  if (data.cessionnaireIsSocieteCible) {
    doc += `RÉSOLUTION ${resNum} — CONSTATATION DU RACHAT ET ANNULATION DES TITRES\n`;
    doc += `${"─".repeat(60)}\n\n`;
    doc += `${titreAss} approuve et constate le rachat de ${nbTitres} ${typeTitre} propres intervenu ce jour entre le Cédant (${nomCedant}) et la Société, conformément à l'acte signé concomitamment aux présentes.\n\n`;
    doc += `Les ${typeTitre} rachetées sont annulées. Suite à cette opération, le capital social de la Société est réduit et la répartition du capital est désormais la suivante :\n\n`;
    const restantTitres = s.nombreTitresTotal && cedant.nombreTitresCedes
      ? String(parseInt(s.nombreTitresTotal) - parseInt(cedant.nombreTitresCedes))
      : "[À COMPLÉTER]";
    const pctRestant = s.nombreTitresTotal && cedant.nombreTitresCedes
      ? (((parseInt(s.nombreTitresTotal) - parseInt(cedant.nombreTitresCedes)) / parseInt(s.nombreTitresTotal)) * 100).toFixed(2)
      : "[XX]";
    doc += `┌${"─".repeat(40)}┬${"─".repeat(12)}┬${"─".repeat(10)}┐\n`;
    doc += `│ Associé${" ".repeat(33)}│ Nb titres  │ % capital│\n`;
    doc += `├${"─".repeat(40)}┼${"─".repeat(12)}┼${"─".repeat(10)}┤\n`;
    doc += `│ ${nomCedant.padEnd(39)}│ ${restantTitres.padEnd(11)}│ ${pctRestant} % │\n`;
    doc += `├${"─".repeat(40)}┼${"─".repeat(12)}┼${"─".repeat(10)}┤\n`;
    doc += `│ TOTAL${" ".repeat(35)}│ ${restantTitres.padEnd(11)}│ 100 %    │\n`;
    doc += `└${"─".repeat(40)}┴${"─".repeat(12)}┴${"─".repeat(10)}┘\n\n`;
  } else {
    doc += `RÉSOLUTION ${resNum} — CONSTATATION DE LA CESSION\n`;
    doc += `${"─".repeat(60)}\n\n`;
    doc += `${titreAss} approuve et constate la cession de ${nbTitres} ${typeTitre} intervenue ce jour entre le Cédant et le Cessionnaire, conformément à l'acte de cession signé concomitamment aux présentes.\n\n`;
    doc += `Suite à cette cession, la répartition du capital de la Société est désormais la suivante :\n\n`;
    doc += `┌${"─".repeat(40)}┬${"─".repeat(12)}┬${"─".repeat(10)}┐\n`;
    doc += `│ Associé${" ".repeat(33)}│ Nb titres  │ % capital│\n`;
    doc += `├${"─".repeat(40)}┼${"─".repeat(12)}┼${"─".repeat(10)}┤\n`;
    doc += `│ ${nomCessionnaire.padEnd(39)}│ ${nbTitres.padEnd(11)}│ ${pct} %  │\n`;
    doc += `├${"─".repeat(40)}┼${"─".repeat(12)}┼${"─".repeat(10)}┤\n`;
    doc += `│ TOTAL${" ".repeat(35)}│ ${totalTitres.padEnd(11)}│ 100 %    │\n`;
    doc += `└${"─".repeat(40)}┴${"─".repeat(12)}┴${"─".repeat(10)}┘\n\n`;
  }
  doc += `La résolution est adoptée à l'unanimité des associés présents ou représentés.\n\n`;
  resNum++;

  // Résolution – Délégation de pouvoirs
  doc += `${"─".repeat(60)}\n`;
  doc += `RÉSOLUTION ${resNum} — DÉLÉGATION DE POUVOIRS EN VUE DES FORMALITÉS\n`;
  doc += `${"─".repeat(60)}\n\n`;
  doc += `${titreAss} donne tous pouvoirs à la société LEGALCORNERS, société domiciliée au 78 Avenue des Champs-Élysées, 75008 Paris, et plus généralement au porteur d'une copie ou d'un extrait certifié conforme du présent procès-verbal, à l'effet d'accomplir toutes les formalités légales nécessaires, et notamment :\n\n`;
  doc += `• L'enregistrement du présent acte auprès du service des impôts compétent ;\n`;
  doc += `• Le dépôt au Greffe du Tribunal de Commerce de toute pièce requise ;\n`;
  doc += `• La publication légale dans un journal d'annonces légales si requise ;\n`;
  doc += `• La modification des statuts de la Société si nécessaire ;\n`;
  doc += `• Toute autre formalité administrative ou juridique consécutive à la présente cession.\n\n`;
  doc += `La résolution est adoptée à l'unanimité des associés présents ou représentés.\n\n`;

  // Clôture
  doc += `${"─".repeat(60)}\n`;
  doc += `L'ordre du jour étant épuisé, la séance est levée. De tout ce qui est décidé ci-dessus, il a été dressé le présent procès-verbal, signé par le(s) soussigné(s).\n\n`;
  doc += `Fait à ${n(pv.ville)}, le ${n(pv.date)}\n\n`;

  // Signatures
  if (pv.typeAssemblee === "associe_unique") {
    doc += `LE PRÉSIDENT / GÉRANT\n\n`;
    doc += `${nomCedant}\n`;
    doc += `Date : _________________\n`;
    doc += `Signature : _____________\n\n`;
  } else {
    doc += `LE PRÉSIDENT DE SÉANCE\n\n`;
    doc += `${pv.presidentCivilite || ""} ${n(pv.presidentNom)} ${n(pv.presidentPrenom)}\n`;
    doc += `Date : _________________\n`;
    doc += `Signature : _____________\n\n`;
    doc += `L'ASSOCIÉ / LE CESSIONNAIRE\n\n`;
    doc += `${nomCessionnaire}\n`;
    doc += `Date : _________________\n`;
    doc += `Signature : _____________\n\n`;
  }

  doc += `${"─".repeat(60)}\n`;
  doc += `Document confidentiel — Template LegalTech Professionnel — Ne constitue pas un conseil juridique\n`;

  return doc;
}
