
function n(v?: string) {
  return v?.trim() || "[À COMPLÉTER]";
}

export interface AnnonceDissolutionData {
  denomination: string;
  formeJuridique: string;
  capital: string;
  adresse: string;
  rcsNumero: string;
  rcsVille: string;
  dateDecision: string;
  datePriseEffet: string;
  liquidateurNom: string;
  liquidateurAdresse: string;
  siegeLiquidation: "siege" | "domicile" | "autre";
  adresseLiquidationAutre?: string;
}

export function generateAnnonceDissolution(data: AnnonceDissolutionData): string {
  let siege = "";
  if (data.siegeLiquidation === "siege") siege = "au siège social";
  else if (data.siegeLiquidation === "domicile") siege = "au domicile du liquidateur";
  else siege = `à l'adresse suivante : ${n(data.adresseLiquidationAutre)}`;

  let doc = "";
  doc += `${n(data.denomination)}\n`;
  doc += `${n(data.formeJuridique)} au capital de ${n(data.capital)} euros\n`;
  doc += `Siège social : ${n(data.adresse)}\n`;
  doc += `${n(data.rcsNumero)} RCS ${n(data.rcsVille)}\n\n`;

  doc += `Le ${n(data.dateDecision)}, l'assemblée générale a décidé la dissolution anticipée de la société à compter du ${n(data.datePriseEffet)}, nommé liquidateur ${n(data.liquidateurNom)} résidant ${n(data.liquidateurAdresse)} et fixé le siège de la liquidation ${siege}.\n\n`;

  doc += `Mention au RCS de ${n(data.rcsVille)}.\n`;

  return doc;
}

export interface AnnonceLiquidationData {
  denomination: string;
  formeJuridique: string;
  capital: string;
  adresse: string;
  rcsNumero: string;
  rcsVille: string;
  dateDecisionDissolution: string;
  dateClotureLiquidation: string;
  liquidateurNom: string;
  liquidateurAdresse: string;
  siegeLiquidation: "siege" | "domicile" | "autre";
  adresseLiquidationAutre?: string;
}

export function generateAnnonceLiquidation(data: AnnonceLiquidationData): string {
  let doc = "";
  doc += `${n(data.denomination)}\n`;
  doc += `${n(data.formeJuridique)} en liquidation au capital de ${n(data.capital)} euros\n`;
  doc += `Siège social : ${n(data.adresse)}\n`;
  doc += `${n(data.rcsNumero)} RCS ${n(data.rcsVille)}\n\n`;

  doc += `Le ${n(data.dateClotureLiquidation)}, l'AGE a approuvé les comptes de liquidation, donné quitus de sa gestion au liquidateur, et prononcé la clôture des opérations de liquidation à compter du ${n(data.dateClotureLiquidation)}. Radiation au RCS de ${n(data.rcsVille)}.\n`;

  return doc;
}

export interface AnnonceDissolutionLiquidationData {
  denomination: string;
  formeJuridique: string;
  capital: string;
  adresse: string;
  rcsNumero: string;
  rcsVille: string;
  dateDecisionDissolution: string;
  datePriseEffet: string;
  liquidateurNom: string;
  liquidateurAdresse: string;
  siegeLiquidation: "siege" | "domicile" | "autre";
  adresseLiquidationAutre?: string;
  dateClotureLiquidation: string;
}

export function generateAnnonceDissolutionLiquidation(data: AnnonceDissolutionLiquidationData): string {
  let siege = "";
  if (data.siegeLiquidation === "siege") siege = "au siège social";
  else if (data.siegeLiquidation === "domicile") siege = "au domicile du liquidateur";
  else siege = `à l'adresse suivante : ${n(data.adresseLiquidationAutre)}`;

  let doc = "";
  doc += `${n(data.denomination)}\n`;
  doc += `${n(data.formeJuridique)} au capital de ${n(data.capital)} euros\n`;
  doc += `Siège social : ${n(data.adresse)}\n`;
  doc += `${n(data.rcsNumero)} RCS ${n(data.rcsVille)}\n\n`;

  doc += `Le ${n(data.dateDecisionDissolution)}, l'assemblée générale a décidé la dissolution anticipée de la société à compter du ${n(data.datePriseEffet)}, nommé liquidateur ${n(data.liquidateurNom)} résidant ${n(data.liquidateurAdresse)} et fixé le siège de la liquidation ${siege}.\n\n`;

  doc += `Le ${n(data.dateClotureLiquidation)}, l'AGE a approuvé les comptes de liquidation, donné quitus de sa gestion au liquidateur, et prononcé la clôture des opérations de liquidation à compter du ${n(data.dateClotureLiquidation)}. Radiation au RCS de ${n(data.rcsVille)}.\n`;

  return doc;
}
