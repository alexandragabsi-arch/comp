import { FormData } from "../types/form";

function n(v?: string) {
  return v || "[À COMPLÉTER]";
}

function nomComplet(data: FormData["cedant"] | FormData["cessionnaire"], role: "cedant" | "cessionnaire") {
  const d = data as FormData["cedant"];
  if (d.typePersonne === "physique" && d.physique) {
    return `${d.physique.civilite} ${d.physique.nom} ${d.physique.prenom}`;
  } else if (d.typePersonne === "morale" && d.morale) {
    return d.morale.denomination;
  }
  return role === "cedant" ? "[CÉDANT]" : "[CESSIONNAIRE]";
}

export function generateActeCession(data: FormData): string {
  const cedant = data.cedant;
  const cessionnaire = data.cessionnaire;
  const societe = data.societe;
  const prix = data.prix;
  const gap = data.gap;
  const nc = data.nonConcurrence;
  const cc = data.comptesCourants;
  const nature = data.natureCession;

  const nomCedant = nomComplet(cedant, "cedant");
  const nomCessionnaire = nomComplet(cessionnaire, "cessionnaire");
  const nbTitres = n(cedant.nombreTitresCedes);
  const typeTitre = ["SARL", "EURL", "SNC", "SCI"].includes(societe.formeJuridique || "")
    ? "parts sociales"
    : "actions";

  let acte = "";

  // En-tête
  acte += `CESSION D'ACTIONS / DE PARTS SOCIALES\n`;
  acte += `${"─".repeat(60)}\n\n`;
  acte += `Entre ${nomCedant} — Cédant\n`;
  acte += `ET\n`;
  acte += `Au profit de ${nomCessionnaire} — Cessionnaire\n`;
  acte += `Société cible : ${n(societe.denomination)}\n`;
  acte += `Fait à ${n(data.ville)}, le ${n(data.date)}\n\n`;

  // Article 1 – Identification des parties
  acte += `${"═".repeat(60)}\n`;
  acte += `ARTICLE 1 – IDENTIFICATION DES PARTIES\n`;
  acte += `${"═".repeat(60)}\n\n`;

  acte += `1.1 Le Cédant\n\n`;
  if (cedant.typePersonne === "physique" && cedant.physique) {
    const p = cedant.physique;
    acte += `${p.civilite} ${p.nom} ${p.prenom}, né(e) le ${n(p.dateNaissance)} à ${n(p.villeNaissance)}, de nationalité ${n(p.nationalite)}, demeurant ${n(p.adresse)},\n\n`;
    if (p.regime === "communaute") {
      acte += `Marié(e) sous le régime de la ${n(p.typeRegime)} avec ${p.conjointCivilite || ""} ${n(p.conjointNom)} ${n(p.conjointPrenom)}.\n\n`;
    } else if (p.regime === "separation") {
      acte += `Marié(e)/Pacsé(e) sous le régime de la séparation de biens avec ${p.conjointCivilite || ""} ${n(p.conjointNom)} ${n(p.conjointPrenom)}. Aucune intervention du conjoint n'est requise.\n\n`;
    } else {
      acte += `Déclare n'être ni marié(e) ni pacsé(e) à la date de signature des présentes.\n\n`;
    }
  } else if (cedant.typePersonne === "morale" && cedant.morale) {
    const m = cedant.morale;
    acte += `La société ${m.denomination}, ${m.formeJuridique}, au capital de ${n(m.capital)}, dont le siège social est situé ${n(m.adresse)}, immatriculée au RCS de ${n(m.rcsVille)} sous le numéro ${n(m.rcsNumero)}, représentée par ${m.representantCivilite} ${m.representantNom} ${m.representantPrenom}, en qualité de ${n(m.representantQualite)}, qui déclare être dûment habilité(e) à l'effet des présentes,\n\n`;
  }
  acte += `Propriétaire de ${nbTitres} ${typeTitre} de la Société, ci-après dénommé(e) le « Cédant ».\n\n`;
  acte += `D'UNE PART,\n\n`;

  acte += `1.2 Le Cessionnaire\n\n`;
  if (cessionnaire.typePersonne === "physique" && cessionnaire.physique) {
    const p = cessionnaire.physique;
    acte += `${p.civilite} ${p.nom} ${p.prenom}, né(e) le ${n(p.dateNaissance)} à ${n(p.villeNaissance)}, de nationalité ${n(p.nationalite)}, demeurant ${n(p.adresse)},\n\n`;
    if (p.regime === "communaute") {
      acte += `Marié(e) sous le régime de la ${n(p.typeRegime)} avec ${p.conjointCivilite || ""} ${n(p.conjointNom)} ${n(p.conjointPrenom)}.\n\n`;
      if (cessionnaire.acquisitionBiens === "propres") {
        acte += `L'acquisition est effectuée avec ses biens propres, le conjoint en ayant été dûment informé.\n\n`;
      } else {
        acte += `Le Cessionnaire acquiert les Titres avec des biens communs du ménage.\n\n`;
      }
    } else if (p.regime === "separation") {
      acte += `Marié(e)/Pacsé(e) sous le régime de la séparation de biens avec ${p.conjointCivilite || ""} ${n(p.conjointNom)} ${n(p.conjointPrenom)}. L'acquisition est effectuée avec ses biens propres.\n\n`;
    } else {
      acte += `Déclare n'être ni marié(e) ni pacsé(e) à la date de signature des présentes.\n\n`;
    }
  } else if (cessionnaire.typePersonne === "morale" && cessionnaire.morale) {
    const m = cessionnaire.morale;
    acte += `La société ${m.denomination}, ${m.formeJuridique}, au capital de ${n(m.capital)}, dont le siège social est situé ${n(m.adresse)}, immatriculée au RCS de ${n(m.rcsVille)} sous le numéro ${n(m.rcsNumero)}, représentée par ${m.representantCivilite} ${m.representantNom} ${m.representantPrenom}, en qualité de ${n(m.representantQualite)}, qui déclare être dûment habilité(e) à l'effet des présentes,\n\n`;
  }
  acte += `Ci-après dénommé(e) le « Cessionnaire ».\n\nD'AUTRE PART,\n\n`;

  acte += `1.3 La Société Cible\n\n`;
  acte += `La présente cession porte sur les titres de la société dénommée ${n(societe.denomination)}, ${n(societe.formeJuridique)}, au capital de ${n(societe.capital)}, divisé en ${n(societe.nombreTitresTotal)} ${typeTitre} de ${n(societe.valeurNominale)} chacune, dont le siège social est situé ${n(societe.adresse)}, immatriculée au RCS de ${n(societe.rcsVille)} sous le numéro ${n(societe.rcsNumero)}.\n\n`;

  if (societe.estSPI) {
    acte += `La Société est à prépondérance immobilière au sens de l'article 219-I-a sexies-0 bis du CGI.\n\n`;
  }

  // Article 2
  acte += `${"═".repeat(60)}\n`;
  acte += `ARTICLE 2 – DÉCLARATIONS PRÉALABLES DES PARTIES\n`;
  acte += `${"═".repeat(60)}\n\n`;
  acte += `2.1 Déclarations du Cédant\n\n`;
  acte += `• Exactitude et exhaustivité des informations le concernant figurant aux présentes ;\n`;
  acte += `• Pleine capacité juridique d'aliéner les Titres et absence d'obstacle à la cession ;\n`;
  acte += `• Absence de procédure collective, de cessation de paiement ou de mesure d'interdiction ;\n`;
  acte += `• Titres cédés libres de tout nantissement, gage, saisie-attribution ou droit de préemption ;\n`;
  acte += `• Communication préalable de l'ensemble des informations nécessaires à une décision éclairée du Cessionnaire ;\n`;
  acte += `• Société régulièrement constituée, en activité et à jour de l'ensemble de ses obligations légales.\n\n`;

  acte += `2.2 Déclarations du Cessionnaire\n\n`;
  acte += `• Exactitude et exhaustivité des informations le concernant figurant aux présentes ;\n`;
  acte += `• Pleine capacité juridique et pouvoirs nécessaires à l'acquisition des Titres ;\n`;
  acte += `• Prise de connaissance complète des éléments juridiques, financiers et comptables de la Société ;\n`;
  acte += `• Absence d'interdiction, d'empêchement ou de procédure collective.\n\n`;

  // Article 3
  acte += `${"═".repeat(60)}\n`;
  acte += `ARTICLE 3 – OBJET ET CONDITIONS DE LA CESSION\n`;
  acte += `${"═".repeat(60)}\n\n`;
  acte += `Le Cédant cède, sous les garanties ordinaires et de droit commun, au Cessionnaire qui accepte, ${nbTitres} ${typeTitre} entièrement libérées.\n\n`;

  acte += `3.1 Nature du transfert\n\n`;
  if (!nature.type || nature.type === "pleine_propriete") {
    acte += `Le Cessionnaire sera propriétaire EN PLEINE PROPRIÉTÉ des Titres cédés et subrogé dans tous les droits et obligations y attachés à compter de la Date d'Effet.\n\n`;
  } else {
    const typeStr = nature.type === "usufruit" ? "l'usufruit" : "la nue-propriété";
    acte += `Le Cédant cède à ${nomCessionnaire} ${typeStr} de ${nbTitres} Titres numérotés de ${n(nature.numeroDe)} à ${n(nature.numeroA)}. Le Cessionnaire sera subrogé dans les droits et obligations attachés à cette quote-part.\n\n`;
  }

  // Article 4
  acte += `${"═".repeat(60)}\n`;
  acte += `ARTICLE 4 – PRIX DE CESSION, PAIEMENT ET QUITTANCE\n`;
  acte += `${"═".repeat(60)}\n\n`;
  acte += `4.1 Prix ferme\n\n`;
  acte += `La présente cession est consentie moyennant le prix de ${n(prix.prixTotal)}, soit [XXX,00 €] par ${typeTitre === "actions" ? "action" : "part sociale"}.\n\n`;
  acte += `Les Parties affirment, sous les peines édictées par l'article 1837 du Code général des impôts, que le présent acte exprime l'intégralité du prix convenu entre elles.\n\n`;

  acte += `4.2 Modalités de paiement\n\n`;
  if (prix.typePaiement === "comptant") {
    acte += `Le Cessionnaire a payé ce jour la somme de ${n(prix.prixTotal)} au Cédant, par virement bancaire, dont le Cédant reconnaît la réception et donne quittance entière, définitive et sans réserve au Cessionnaire.\n\n`;
  } else if (prix.typePaiement === "echelonne" && prix.echeances) {
    acte += `Le prix total est réglé selon l'échéancier suivant :\n\n`;
    prix.echeances.forEach((e) => {
      acte += `• ${n(e.montant)} — exigible le ${n(e.date)} — par virement\n`;
    });
    acte += `\nTout retard de paiement donnera lieu, de plein droit, à des intérêts de retard au taux légal en vigueur.\n\n`;
    acte += `Clause de déchéance du terme : En cas de défaut de paiement non régularisé dans les 15 jours suivant mise en demeure par LRAR, l'intégralité des sommes restant dues deviendra immédiatement exigible de plein droit.\n\n`;
  }

  // Article 5
  acte += `${"═".repeat(60)}\n`;
  acte += `ARTICLE 5 – PLUS-VALUE DE CESSION — RÉGIME FISCAL\n`;
  acte += `${"═".repeat(60)}\n\n`;
  acte += `5.1 Calcul de la plus-value\n\n`;
  acte += `La présente cession est réalisée pour un prix de ${n(prix.prixTotal)}. Le Cédant reconnaît qu'il lui appartient personnellement de s'entretenir avec son conseil fiscal préalablement aux présentes. En conséquence, le Cessionnaire et le rédacteur du présent acte sont expressément dégagés de toute responsabilité quant au traitement fiscal de la plus-value réalisée par le Cédant.\n\n`;

  acte += `5.2 Régime fiscal applicable\n\n`;
  if (cedant.typePersonne === "physique") {
    acte += `La plus-value de cession est soumise, sauf option contraire, au Prélèvement Forfaitaire Unique (PFU) au taux global de 30 % (12,8 % IR + 17,2 % PS), conformément aux articles 150-0 A et suivants du CGI. Option possible pour le barème progressif de l'impôt sur le revenu si plus favorable.\n\n`;
  } else {
    acte += `La plus-value de cession est intégrée au résultat imposable de la société cédante et soumise à l'IS au taux de droit commun. Le régime des plus-values à long terme (taux de 0 % avec quote-part de frais de 12 %) s'applique aux titres de participation détenus depuis plus de 2 ans, sous conditions.\n\n`;
  }

  acte += `5.3 Droits d'enregistrement\n\n`;
  const fj = societe.formeJuridique;
  if (fj === "SA" || fj === "SAS" || fj === "SASU") {
    acte += `Conformément à l'article 726 du CGI, la présente cession est soumise aux droits d'enregistrement au taux de 0,1 % du prix de cession, à la charge du ${n(data.fraisALaCharge)}.\n\n`;
  } else {
    acte += `Conformément à l'article 726 du CGI, la présente cession est soumise aux droits d'enregistrement au taux de 3 % du prix, après application d'un abattement de 23 000 € proratisé au nombre de parts cédées, à la charge du ${n(data.fraisALaCharge)}.\n\n`;
  }

  // Article 6 – Régime matrimonial
  acte += `${"═".repeat(60)}\n`;
  acte += `ARTICLE 6 – RÉGIME MATRIMONIAL\n`;
  acte += `${"═".repeat(60)}\n\n`;

  acte += `6.1 Cédant\n\n`;
  if (cedant.typePersonne === "physique" && cedant.physique) {
    const p = cedant.physique;
    if (p.regime === "communaute") {
      acte += `Le Cédant déclare être marié(e)/pacsé(e) sous le régime de la communauté de biens avec ${p.conjointCivilite || ""} ${n(p.conjointNom)} ${n(p.conjointPrenom)}. Son époux(se)/partenaire commun(e) en biens, intervenant aux présentes, déclare avoir pris connaissance de la présente cession et y donner son consentement exprès.\n\n`;
    } else if (p.regime === "separation") {
      acte += `Le Cédant déclare être marié(e)/pacsé(e) sous le régime de la séparation de biens avec ${p.conjointCivilite || ""} ${n(p.conjointNom)} ${n(p.conjointPrenom)}. Aucune intervention de son conjoint n'est requise.\n\n`;
    } else {
      acte += `Le Cédant déclare n'être ni marié(e) ni pacsé(e) à la date de signature des présentes.\n\n`;
    }
  } else {
    acte += `Sans objet (personne morale).\n\n`;
  }

  acte += `6.2 Cessionnaire\n\n`;
  if (cessionnaire.typePersonne === "physique" && cessionnaire.physique) {
    const p = cessionnaire.physique;
    if (p.regime === "communaute") {
      const biens = cessionnaire.acquisitionBiens === "communs" ? "biens communs du ménage" : "ses biens propres";
      acte += `Le Cessionnaire déclare être marié(e)/pacsé(e) sous le régime de la communauté de biens avec ${p.conjointCivilite || ""} ${n(p.conjointNom)} ${n(p.conjointPrenom)}. L'acquisition est effectuée avec ${biens}.\n\n`;
    } else if (p.regime === "separation") {
      acte += `Le Cessionnaire déclare acquérir les Titres avec ses biens propres sous le régime de la séparation de biens.\n\n`;
    } else {
      acte += `Le Cessionnaire déclare n'être ni marié(e) ni pacsé(e) à la date de signature des présentes.\n\n`;
    }
  } else {
    acte += `Sans objet (personne morale).\n\n`;
  }

  // Article 7
  acte += `${"═".repeat(60)}\n`;
  acte += `ARTICLE 7 – AGRÉMENT DE LA CESSION\n`;
  acte += `${"═".repeat(60)}\n\n`;
  const pvDate = n(data.pv.date);
  if (data.pv.typeAssemblee === "associe_unique") {
    acte += `Aux termes de la décision de l'associé unique en date du ${pvDate}, la présente cession a été autorisée dans les formes et conditions prévues par les statuts.\n\n`;
  } else {
    acte += `Aux termes de la délibération de l'assemblée générale des associés en date du ${pvDate}, la présente cession a été autorisée à la majorité requise par les statuts.\n\n`;
  }

  // Article 8
  acte += `${"═".repeat(60)}\n`;
  acte += `ARTICLE 8 – COMPTES COURANTS D'ASSOCIÉS\n`;
  acte += `${"═".repeat(60)}\n\n`;
  if (cc.option === "absent") {
    acte += `Le Cédant déclare ne pas posséder de compte courant d'associé dans la Société, ou y renoncer expressément au profit de la Société.\n\n`;
  } else if (cc.option === "cede") {
    acte += `Le Cédant cède au Cessionnaire, qui accepte, son compte courant d'associé dont le solde créditeur s'élève à ${n(cc.solde)} à la date des présentes. Le Cessionnaire est subrogé dans tous les droits et obligations qui y sont attachés.\n\n`;
  } else if (cc.option === "conserve") {
    acte += `Le Cédant conserve son compte courant d'associé (solde : ${n(cc.solde)}). Ce montant lui sera remboursé par la Société dans un délai de ${n(cc.delaiRemboursementMois)} mois à compter de la Date d'Effet.\n\n`;
  }

  // Article 9
  acte += `${"═".repeat(60)}\n`;
  acte += `ARTICLE 9 – TRANSFERT DE PROPRIÉTÉ ET JOUISSANCE\n`;
  acte += `${"═".repeat(60)}\n\n`;
  acte += `Le Cessionnaire devient propriétaire des Titres cédés à compter de la Date d'Effet, avec tous les droits et obligations qui y sont attachés. Le Cédant le subroge dans l'ensemble de ses droits et actions attachés aux Titres cédés. Le Cessionnaire reconnaît avoir reçu communication d'un exemplaire des statuts de la Société en vigueur.\n\n`;

  // Article 10 – GAP
  acte += `${"═".repeat(60)}\n`;
  acte += `ARTICLE 10 – GARANTIE D'ACTIF ET DE PASSIF (GAP)\n`;
  acte += `${"═".repeat(60)}\n\n`;

  if (gap.active) {
    acte += `10.1 Déclarations et garanties du Cédant\n\n`;
    acte += `Le Cédant déclare et garantit au Cessionnaire que, à la Date d'Effet :\n`;
    acte += `• La Société exerce son activité en totale conformité avec les lois et règlements applicables ;\n`;
    acte += `• Les Titres ne font l'objet d'aucun engagement susceptible d'affecter leur propriété ;\n`;
    acte += `• La Société n'est ni en état de cessation de paiement, ni en procédure collective ;\n`;
    acte += `• La Société est à jour de l'ensemble de ses dettes fiscales, sociales et commerciales ;\n`;
    acte += `• Les comptes annuels communiqués donnent une image fidèle et sincère de la situation financière.\n\n`;

    acte += `10.2 Étendue, plafond, seuil et durée\n\n`;
    acte += `Seuil de déclenchement : ${n(gap.seuilParSinistre)} par sinistre et ${n(gap.seuilAnnuel)} en cumul annuel.\n`;
    acte += `Plafond global : ${n(gap.plafond)}.\n`;
    acte += `Durée : ${n(gap.dureeAnnees)} années à compter de la Date d'Effet.\n\n`;

    if (gap.escrow) {
      acte += `10.3 Mécanisme de séquestre (Escrow)\n\n`;
      acte += `Une somme de ${n(gap.escrowMontant)} sera séquestrée entre les mains de ${n(gap.escrowBeneficiaire)}, conformément à une convention de séquestre signée concomitamment. Les fonds seront libérés à l'expiration de la durée de la GAP.\n\n`;
    }

    acte += `10.4 Procédure de mise en œuvre\n\n`;
    acte += `Le Cessionnaire notifiera le Cédant de toute demande d'indemnisation par LRAR dans un délai de ${n(gap.notificationDelaiMois)} mois à compter de la découverte du fait générateur, sous peine de forclusion.\n\n`;
  } else {
    acte += `Les Parties déclarent expressément ne pas souhaiter mettre en place de Garantie d'Actif et de Passif dans le cadre de la présente cession.\n\n`;
  }

  // Article 11 – Non-concurrence
  acte += `${"═".repeat(60)}\n`;
  acte += `ARTICLE 11 – CLAUSES DE NON-CONCURRENCE ET NON-SOLLICITATION\n`;
  acte += `${"═".repeat(60)}\n\n`;

  if (nc.active) {
    acte += `11.1 Obligation du Cédant\n\n`;
    acte += `Le Cédant s'interdit expressément, pendant ${n(nc.dureeAns)} ans à compter de la Date d'Effet, de participer ou de s'intéresser directement ou indirectement à toute activité concurrente à celle de la Société dans la zone géographique suivante : ${n(nc.zoneGeographique)}.\n\n`;
    acte += `11.2 Non-sollicitation\n\n`;
    acte += `Le Cédant s'interdit, pendant la même durée, de débaucher ou solliciter tout salarié, prestataire ou client de la Société.\n\n`;
    if (nc.appliqueAuCessionnaire) {
      acte += `Le Cessionnaire s'interdit également, pendant ${n(nc.dureeAnsCessionnaire)} ans, d'exercer une activité concurrente dans : ${n(nc.zoneGeoCessionnaire)}.\n\n`;
    }
  } else {
    acte += `Les Parties déclarent expressément ne pas souhaiter insérer de clause de non-concurrence dans le cadre de la présente cession.\n\n`;
  }

  // Article 12
  acte += `${"═".repeat(60)}\n`;
  acte += `ARTICLE 12 – OPPOSABILITÉ ET FORMALITÉS LÉGALES\n`;
  acte += `${"═".repeat(60)}\n\n`;
  acte += `12.1 Signification à la Société\n\n`;
  acte += `Pour être opposable à la Société, la présente cession lui sera signifiée conformément aux dispositions de l'article 1690 du Code civil.\n\n`;
  acte += `12.2 Pouvoirs pour formalités\n\n`;
  acte += `Tous pouvoirs sont donnés au porteur d'un original ou d'une copie certifiée conforme des présentes pour effectuer l'ensemble des formalités légales consécutives à la présente cession.\n\n`;
  acte += `12.3 Enregistrement fiscal\n\n`;
  acte += `La présente cession sera enregistrée auprès du service des impôts des entreprises dans le délai d'un mois. Les droits d'enregistrement sont à la charge du ${n(data.fraisALaCharge)}.\n\n`;

  // Article 13
  acte += `${"═".repeat(60)}\n`;
  acte += `ARTICLE 13 – DISPOSITIONS GÉNÉRALES\n`;
  acte += `${"═".repeat(60)}\n\n`;
  acte += `13.1 Tous les frais, droits et taxes liés aux présentes seront supportés par le ${n(data.fraisALaCharge)}.\n`;
  acte += `13.2 Toute stipulation reconnue nulle sera réputée non écrite sans affecter les autres dispositions.\n`;
  acte += `13.3 Le présent acte ne pourra être modifié que par un avenant écrit et signé par l'ensemble des Parties.\n`;
  acte += `13.4 Le présent acte est exclusivement soumis au droit français.\n`;
  acte += `13.5 En cas de litige, compétence exclusive est attribuée aux tribunaux du ressort de ${n(data.ville)}.\n`;
  acte += `13.6 Le présent acte est établi en 3 exemplaires originaux.\n\n`;

  // Signatures
  acte += `${"═".repeat(60)}\n`;
  acte += `SIGNATURES\n`;
  acte += `${"═".repeat(60)}\n\n`;
  acte += `Fait à ${n(data.ville)}, le ${n(data.date)}.\n\n`;
  acte += `LE CÉDANT\n`;
  acte += `"Lu et approuvé. Bon pour cession. Bon pour quittance."\n\n`;
  acte += `${nomCedant}\n`;
  acte += `Date : _________________\n`;
  acte += `Signature : _____________\n\n`;
  acte += `LE CESSIONNAIRE\n`;
  acte += `"Lu et approuvé. Bon pour acceptation de la cession."\n\n`;
  acte += `${nomCessionnaire}\n`;
  acte += `Date : _________________\n`;
  acte += `Signature : _____________\n\n`;

  if (
    cedant.typePersonne === "physique" &&
    cedant.physique?.regime === "communaute"
  ) {
    acte += `LE CONJOINT COMMUN EN BIENS DU CÉDANT\n`;
    acte += `${cedant.physique?.conjointCivilite || ""} ${n(cedant.physique?.conjointNom)} ${n(cedant.physique?.conjointPrenom)}\n`;
    acte += `Date : _________________\n`;
    acte += `Signature : _____________\n\n`;
  }

  acte += `${"─".repeat(60)}\n`;
  acte += `Document confidentiel — Usage strictement réservé aux professionnels — Ne constitue pas un conseil juridique ou fiscal\n`;

  return acte;
}
