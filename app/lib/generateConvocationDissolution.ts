
function n(v?: string) {
  return v?.trim() || "[À COMPLÉTER]";
}

export interface ConvocationDissolutionData {
  denomination: string;
  formeJuridique: string;
  capital: string;
  rcsVille: string;
  rcsNumero: string;
  adresse: string;
  modeConvocation: "lrar" | "lettre_simple" | "electronique" | "main_propre";
  dateAssemblee: string;
  heureAssemblee: string;
  lieuAssemblee: string; // "siege" ou adresse custom
  lieuAssembleeAdresse?: string;
  emailQuestions?: string;
  dirigeantQualite: string; // "Gérant" ou "Président"
}

export function generateConvocationDissolution(data: ConvocationDissolutionData): string {
  const modeLabel = {
    lrar: "lettre recommandée avec accusé de réception",
    lettre_simple: "lettre simple",
    electronique: "voie électronique",
    main_propre: "remise en mains propres",
  }[data.modeConvocation];

  const lieu = data.lieuAssemblee === "siege"
    ? `à l'adresse du siège social`
    : `au ${n(data.lieuAssembleeAdresse)}`;

  let doc = "";

  doc += `${n(data.denomination)}\n`;
  doc += `${n(data.formeJuridique)} au capital de ${n(data.capital)} euros\n`;
  doc += `dont le siège social est situé au ${n(data.adresse)}\n`;
  doc += `Immatriculée au RCS de ${n(data.rcsVille)} sous le numéro ${n(data.rcsNumero)}\n\n`;

  doc += `Convocation adressée par ${modeLabel}\n\n`;

  doc += `${"═".repeat(60)}\n`;
  doc += `CONVOCATION DES ASSOCIÉS À L'ASSEMBLÉE GÉNÉRALE EXTRAORDINAIRE\n`;
  doc += `${"═".repeat(60)}\n\n`;

  doc += `Cher(e) associé(e),\n\n`;

  doc += `Nous avons l'honneur de vous informer que les associés de notre Société sont convoqués, le ${n(data.dateAssemblee)} en Assemblée Générale Extraordinaire ${lieu} à ${n(data.heureAssemblee)}.\n\n`;

  doc += `Les points suivants seront à l'ordre du jour :\n`;
  doc += `- la dissolution de la société,\n`;
  doc += `- la nomination d'un liquidateur.\n\n`;

  doc += `Vous trouverez ci-joint le texte des résolutions proposées à l'assemblée.\n\n`;

  doc += `Au cas où vous ne pourriez assister personnellement à cette assemblée, vous pourrez vous y faire représenter en remettant une procuration à un autre associé.\n\n`;

  if (data.emailQuestions) {
    doc += `Nous vous rappelons que vous pouvez, à compter de la présente, poser par écrit des questions à l'assemblée à l'adresse email suivante : ${data.emailQuestions}, auxquelles il sera répondu au cours de cette réunion.\n\n`;
  }

  doc += `Nous vous prions d'agréer l'expression de nos sentiments distingués.\n\n`;

  doc += `Le ${n(data.dirigeantQualite)}\n\n`;

  doc += `Vous en souhaitant bonne réception,\n`;
  doc += `Cordialement.\n`;

  return doc;
}

export interface ConvocationLiquidationData {
  denomination: string;
  formeJuridique: string;
  capital: string;
  rcsVille: string;
  rcsNumero: string;
  adresse: string;
  modeConvocation: "lrar" | "lettre_simple" | "electronique" | "main_propre";
  dateAssemblee: string;
  heureAssemblee: string;
  lieuAssemblee: string;
  lieuAssembleeAdresse?: string;
  emailQuestions?: string;
  dirigeantQualite: string;
}

export function generateConvocationLiquidation(data: ConvocationLiquidationData): string {
  const modeLabel = {
    lrar: "lettre recommandée avec accusé de réception",
    lettre_simple: "lettre simple",
    electronique: "voie électronique",
    main_propre: "remise en mains propres",
  }[data.modeConvocation];

  const lieu = data.lieuAssemblee === "siege"
    ? `à l'adresse du siège social`
    : `au ${n(data.lieuAssembleeAdresse)}`;

  let doc = "";

  doc += `${n(data.denomination)}\n`;
  doc += `${n(data.formeJuridique)} au capital de ${n(data.capital)} euros\n`;
  doc += `dont le siège social est situé au ${n(data.adresse)}\n`;
  doc += `Immatriculée au RCS de ${n(data.rcsVille)} sous le numéro ${n(data.rcsNumero)}\n\n`;

  doc += `Convocation adressée par ${modeLabel}\n\n`;

  doc += `${"═".repeat(60)}\n`;
  doc += `CONVOCATION DES ASSOCIÉS À L'ASSEMBLÉE GÉNÉRALE EXTRAORDINAIRE\n`;
  doc += `${"═".repeat(60)}\n\n`;

  doc += `Cher(e) associé(e),\n\n`;

  doc += `Nous avons l'honneur de vous informer que les associés de notre Société sont convoqués, le ${n(data.dateAssemblee)} en Assemblée Générale Extraordinaire ${lieu} à ${n(data.heureAssemblee)}.\n\n`;

  doc += `Les points suivants seront à l'ordre du jour :\n`;
  doc += `- Approbation des comptes de liquidation,\n`;
  doc += `- Répartition du solde de liquidation,\n`;
  doc += `- La clôture définitive des opérations de liquidation.\n\n`;

  doc += `Vous trouverez ci-joint le texte des résolutions proposées à l'assemblée.\n\n`;

  doc += `Au cas où vous ne pourriez assister personnellement à cette assemblée, vous pourrez vous y faire représenter en remettant une procuration à un autre associé.\n\n`;

  if (data.emailQuestions) {
    doc += `Nous vous rappelons que vous pouvez, à compter de la présente, poser par écrit des questions à l'assemblée à l'adresse email suivante : ${data.emailQuestions}, auxquelles il sera répondu au cours de cette réunion.\n\n`;
  }

  doc += `Nous vous prions d'agréer l'expression de nos sentiments distingués.\n\n`;

  doc += `Le ${n(data.dirigeantQualite)}\n\n`;

  doc += `Vous en souhaitant bonne réception,\n`;
  doc += `Cordialement.\n`;

  return doc;
}
