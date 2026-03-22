import { NextRequest, NextResponse } from "next/server";
import type { PVData } from "@/app/api/dissolution/pv/route";
import type { ConvocationData } from "@/app/api/dissolution/convocation/route";
import type { PVLiquidationData } from "@/app/api/dissolution/pv-liquidation/route";
import type { ConvocationLiquidationData } from "@/app/api/dissolution/convocation-liquidation/route";

const LEGALCORNERS_CLAUSE =
  "à la société LEGALCORNERS, dont le siège social est situé au 78 Avenue des Champs-Élysées, 75008 Paris, immatriculée au Registre du Commerce et des Sociétés de Paris sous le numéro 988 485 405, ainsi qu'à tout porteur d'une copie ou d'un extrait du présent procès-verbal";

// ── CSS commun ─────────────────────────────────────────────────────────────
const CSS = `
  body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.6; color: #0D2459; background: white; margin: 0; padding: 0; }
  .page { padding: 2.5cm 2.8cm; min-height: 29.7cm; }
  h1 { font-size: 13pt; text-align: center; text-decoration: underline; font-weight: bold; margin: 20px 0 8px; }
  h2 { font-size: 11pt; text-align: center; text-decoration: underline; font-weight: bold; margin: 18px 0 6px; }
  .center { text-align: center; }
  .justify { text-align: justify; }
  p { margin: 0 0 8px; text-align: justify; }
  ul { margin: 4px 0 8px 20px; }
  li { margin-bottom: 3px; }
  .resolution { margin-top: 18px; }
  .vote { font-style: italic; }
  .sig-block { margin-top: 40px; }
  .sig-line { margin-bottom: 30px; border-bottom: 1px solid #555; width: 55%; }
  .sig-name { font-size: 10pt; color: #333; }
  .table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  .table td, .table th { border: 1px solid #aaa; padding: 4px 8px; font-size: 10pt; }
  .table th { background: #f0f0f0; font-weight: bold; text-align: center; }
  hr { border: none; border-top: 1px solid #ddd; margin: 14px 0; }
`;

function wrap(body: string, title: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${title}</title><style>${CSS}</style></head><body><div class="page">${body}</div></body></html>`;
}

function esc(s: string | undefined | null): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─────────────────────────────────────────────────────────────────────────────
// PV Dissolution
// ─────────────────────────────────────────────────────────────────────────────
function getLiquidateurText(d: PVData): string {
  const liq = d.liquidateur;
  if (liq.type === "personne") {
    const name = `${liq.prenom} ${liq.nom}`;
    const qualite = liq.estGerantActuel
      ? `, ${d.formeJuridique.toUpperCase().includes("SAS") ? "président" : "gérant"} de la Société`
      : "";
    return `${name}${qualite}, demeurant au ${liq.adresse}`;
  }
  return `la société dénommée ${liq.societeNom}, inscrite au RCS de ${liq.societeRCSVille} sous le numéro ${liq.societeRCSNumero}, représentée par ${liq.societeRepresentantPar}`;
}

function getSiegeLiquidation(d: PVData): string {
  if (d.siegeLiquidation === "siege_social") return "au siège de la Société";
  if (d.siegeLiquidation === "domicile_liquidateur") return "au domicile du liquidateur";
  return `à l'adresse suivante : ${d.siegeLiquidationAdresse}`;
}

function voteHtml(r: { unanimite: boolean; pour?: string; contre?: string; abstentions?: string }): string {
  if (r.unanimite) return `<p class="vote">La résolution est adoptée à l'unanimité.</p>`;
  return `<p class="vote">La résolution est adoptée avec ${esc(r.pour)} votes en faveur, ${esc(r.contre)} votes contre et ${esc(r.abstentions)} abstentions.</p>`;
}

function generatePVHtml(d: PVData): string {
  const decision =
    d.decisionType === "associe_unique"
      ? "L'associé unique"
      : d.decisionType === "unanimite"
        ? "L'unanimité des associés"
        : "L'assemblée des associés";

  const confere = d.decisionType === "associe_unique" ? "confère" : "confèrent";
  const decisionPluriel = d.decisionType === "associe_unique" ? "décide" : "décident";
  const nomme = d.decisionType === "associe_unique" ? "nomme" : "nomment";
  const donne = d.decisionType === "associe_unique" ? "donne" : "donnent";
  const dirigeant = d.formeJuridique.toUpperCase().includes("SAS") ? "président" : "gérant";

  const r1 = d.age?.resolutions?.find((r) => r.id === "r1");
  const r2 = d.age?.resolutions?.find((r) => r.id === "r2");
  const r3 = d.age?.resolutions?.find((r) => r.id === "r3");
  const r4 = d.age?.resolutions?.find((r) => r.id === "r4");

  let pvTitle = "";
  if (d.decisionType === "associe_unique") pvTitle = "PROCÈS-VERBAL DE DÉCISIONS DE L'ASSOCIÉ UNIQUE";
  else if (d.decisionType === "unanimite") pvTitle = "PROCÈS-VERBAL DE DÉCISIONS UNANIMES DES ASSOCIÉS";
  else pvTitle = "PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE EXTRAORDINAIRE";

  let body = `
    <h1>PROCÈS-VERBAL DE DISSOLUTION</h1>
    <p class="center"><strong>${esc(d.companyName)}</strong></p>
    <p class="center">${esc(d.formeJuridique)} au capital de ${esc(d.capital)} €</p>
    <p class="center">Immatriculée au RCS de ${esc(d.rcsVille)} sous le numéro ${esc(d.siren)}</p>
    <p class="center">Siège social : ${esc(d.siegeSocial)}</p>
    <hr>
    <h2>${esc(pvTitle)}</h2>
  `;

  // Corps
  if (d.decisionType === "associe_unique") {
    body += `<p>Le ${esc(d.date)}, l'associé unique, <strong>${esc(d.associeUniquePrenom)} ${esc(d.associeUniqueNom)}</strong>, a pris les décisions suivantes :</p>`;
    body += `<ul><li>La dissolution de la Société</li><li>La nomination d'un Liquidateur</li></ul>`;
  } else if (d.decisionType === "unanimite") {
    body += `<p>Le ${esc(d.date)}, la totalité des associés de la société <strong>${esc(d.companyName)}</strong> réunis ont pris unanimement les décisions suivantes :</p>`;
    body += `<ul><li>La dissolution de la Société</li><li>La nomination d'un Liquidateur</li></ul>`;
  } else if (d.decisionType === "age" && d.age) {
    const a = d.age;
    body += `<p>Le ${esc(d.date)} à ${esc(a.heure)}, les associés de la société se sont réunis en Assemblée générale extraordinaire.</p>`;
    body += `<p>L'Assemblée a été convoquée par le ${dirigeant} de la Société.</p>`;
    body += `<p>Les associés présents totalisent ${esc(a.partsPresentes)} ${esc(a.typeActions)} sur un total de ${esc(a.partsTotal)} ${esc(a.typeActions)}.</p>`;
    body += `<p>Les conditions de quorum nécessaires pour cette Assemblée sont donc remplies.</p>`;
    if (a.cacNom || a.cacPresent !== undefined) {
      const cacPres = a.cacPresent ? "présent" : "absent";
      body += `<p>${esc(a.cacNom || "Le commissaire aux comptes")}, commissaire aux comptes, régulièrement convoqué, est ${cacPres}.</p>`;
    }
    if (a.cePresent !== undefined) {
      body += `<p>Les représentants du Comité d'entreprise régulièrement convoqués sont ${a.cePresent ? "présents" : "absents"}.</p>`;
    }
    body += `<p>L'Assemblée est présidée par <strong>${esc(a.president)}</strong>, en sa qualité de ${dirigeant}.</p>`;
    body += `<p>Le Président constate que l'Assemblée, régulièrement constituée, peut valablement délibérer.</p>`;
    body += `<p>Le Président dépose sur le bureau :</p>`;
    body += `<ul><li>la copie de la lettre de convocation ;</li><li>la feuille de présence ;</li><li>un exemplaire des statuts ;</li><li>le texte des résolutions proposées.</li></ul>`;
    body += `<p>L'Assemblée est réunie à l'effet de délibérer sur l'ordre du jour suivant :</p>`;
    body += `<ul><li>La dissolution de la Société,</li><li>La nomination du liquidateur.</li></ul>`;
  }

  // Résolution 1
  body += `<div class="resolution"><h2>RÉSOLUTION 1 – Dissolution</h2>`;
  body += `<p><strong>${esc(decision)} </strong>${esc(decisionPluriel)} de la dissolution anticipée de la Société dénommée <strong>${esc(d.companyName)}</strong> à compter de ce jour et sa liquidation amiable conformément aux dispositions des articles L.237-1 à 237-13 du Code de commerce.</p>`;
  body += `<p>La Société subsistera pour les besoins de la liquidation et jusqu'à la clôture de celle-ci.</p>`;
  body += `<p>Durant cette période, la dénomination sociale sera suivie de la mention "société en liquidation".</p>`;
  body += `<p>Le siège social de la liquidation est fixé ${esc(getSiegeLiquidation(d))}.</p>`;
  if (r1) body += voteHtml(r1);
  body += `</div>`;

  // Résolution 2
  body += `<div class="resolution"><h2>RÉSOLUTION 2 – Nomination du liquidateur</h2>`;
  body += `<p><strong>${esc(decision)} </strong>${esc(nomme)} en qualité de Liquidateur et pour une durée maximum d'1 (un) an, <strong>${esc(getLiquidateurText(d))}</strong>.</p>`;
  if (d.liquidateur.estGerantActuel) {
    body += `<p><strong>${esc(decision)} </strong>met ainsi fin aux fonctions du ${dirigeant} à compter de ce jour.</p>`;
  }
  body += `<p>Dans les six mois de sa nomination, le Liquidateur doit convoquer ${d.decisionType === "associe_unique" ? "l'associé unique" : "les associés"} en assemblée générale ordinaire.</p>`;
  if (d.liquidateur.remuneration) {
    body += `<p><strong>${esc(decision)} </strong>${esc(decisionPluriel)} que le liquidateur a droit à une rémunération de ${esc(d.liquidateur.remuneration)} euros mensuels.</p>`;
  }
  if (r2) body += voteHtml(r2);
  body += `</div>`;

  // Résolution 3
  body += `<div class="resolution"><h2>RÉSOLUTION 3 – Missions du Liquidateur</h2>`;
  body += `<p><strong>${esc(decision)} </strong>${esc(donne)} au liquidateur les pouvoirs les plus étendus pour mener à bien sa mission, c'est-à-dire réaliser l'actif, payer le passif et répartir le solde entre les associés, sous réserve des dispositions des articles L 237-1 et suivants du Code de commerce.</p>`;
  body += `<p>Il est autorisé à continuer les affaires en cours pour les besoins de la liquidation exclusivement.</p>`;
  if (r3) body += voteHtml(r3);
  body += `</div>`;

  // Résolution 4
  body += `<div class="resolution"><h2>RÉSOLUTION 4 – Délégation de pouvoirs en vue des formalités</h2>`;
  body += `<p><strong>${esc(decision)} </strong>${esc(confere)} tous pouvoirs ${LEGALCORNERS_CLAUSE}, à l'effet d'accomplir toutes les formalités légales.</p>`;
  if (r4) body += voteHtml(r4);
  body += `</div>`;

  // Clôture
  body += `<p style="margin-top:24px">De tout ce qui précède, il a été dressé le présent procès-verbal.</p>`;
  body += `<p>Fait à ${esc(d.ville)}, le ${esc(d.date)}</p>`;

  // Signatures
  body += `<div class="sig-block">`;
  if (d.decisionType === "associe_unique") {
    body += `<p>Signature de l'associé unique : <strong>${esc(d.associeUniquePrenom)} ${esc(d.associeUniqueNom)}</strong></p><div class="sig-line"></div>`;
  } else {
    body += `<p>Signature de tous les associés :</p><div class="sig-line"></div>`;
  }
  if (d.liquidateur.type === "personne") {
    body += `<p>Signature du liquidateur : <strong>${esc(d.liquidateur.prenom)} ${esc(d.liquidateur.nom)}</strong></p><div class="sig-line"></div>`;
  } else {
    body += `<p>${esc(d.liquidateur.societeNom)}, en qualité de liquidateur, représentée par ${esc(d.liquidateur.societeRepresentantPar)}</p><div class="sig-line"></div>`;
  }
  body += `</div>`;

  return wrap(body, `PV Dissolution – ${d.companyName}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// PV Liquidation (Phase 2)
// ─────────────────────────────────────────────────────────────────────────────
function generatePVLiquidationHtml(d: PVLiquidationData): string {
  const decision =
    d.decisionType === "associe_unique"
      ? "L'associé unique"
      : d.decisionType === "unanimite"
        ? "L'unanimité des associés"
        : "L'assemblée des associés";
  const donne = d.decisionType === "associe_unique" ? "donne" : "donnent";

  let body = `
    <h1>PROCÈS-VERBAL DE CLÔTURE DE LIQUIDATION</h1>
    <p class="center"><strong>${esc(d.companyName)}</strong></p>
    <p class="center">${esc(d.formeJuridique)} au capital de ${esc(d.capital)} €</p>
    <p class="center">Immatriculée au RCS de ${esc(d.rcsVille)} sous le numéro ${esc(d.siren)}</p>
    <p class="center">Siège social : ${esc(d.siegeSocial)}</p>
    <hr>
    <h2>PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE ORDINAIRE DE CLÔTURE</h2>
    <p>Le ${esc(d.date)}${d.heure ? ` à ${esc(d.heure)}` : ""}, ${d.decisionType === "associe_unique" ? "l'associé unique" : "les associés"} se sont réunis pour statuer sur la clôture de la liquidation.</p>
  `;

  // Résolution 5
  body += `<div class="resolution"><h2>RÉSOLUTION 5 – Approbation des comptes de liquidation</h2>`;
  body += `<p><strong>${esc(decision)} </strong>approuve les comptes de liquidation arrêtés au ${esc(d.dateArretComptes)}, faisant apparaître un solde ${esc(d.soldeSigne)} de ${esc(d.soldeMontant)} €.</p></div>`;

  // Résolution 6
  body += `<div class="resolution"><h2>RÉSOLUTION 6 – Répartition du solde de liquidation</h2>`;
  if (d.soldeSigne === "positif") {
    body += `<p><strong>${esc(decision)} </strong>constate l'existence d'un boni de liquidation de ${esc(d.soldeMontant)} € et décide de le répartir entre les associés au prorata de leurs droits.</p>`;
  } else {
    body += `<p><strong>${esc(decision)} </strong>constate l'existence d'un mali de liquidation de ${esc(d.soldeMontant)} €.</p>`;
  }
  body += `</div>`;

  // Résolution 7
  body += `<div class="resolution"><h2>RÉSOLUTION 7 – Clôture de la liquidation</h2>`;
  body += `<p><strong>${esc(decision)} </strong>constate la clôture de la liquidation de la Société à la date de ce jour, et donne quitus au liquidateur <strong>${esc(d.liquidateurPrenom)} ${esc(d.liquidateurNom)}</strong> pour sa gestion.</p></div>`;

  // Résolution 8
  body += `<div class="resolution"><h2>RÉSOLUTION 8 – Pouvoirs en vue d'accomplir les formalités</h2>`;
  body += `<p><strong>${esc(decision)} </strong>${esc(donne)} tous pouvoirs ${LEGALCORNERS_CLAUSE}, pour effectuer la demande de radiation de la société du registre du commerce et des sociétés et accomplir les formalités de publicité afférentes aux décisions ci-dessus adoptées.</p></div>`;

  body += `<p style="margin-top:24px">Fait à ${esc(d.ville)}, le ${esc(d.date)}</p>`;
  body += `<div class="sig-block"><p>Signature du liquidateur : <strong>${esc(d.liquidateurPrenom)} ${esc(d.liquidateurNom)}</strong></p><div class="sig-line"></div></div>`;

  return wrap(body, `PV Liquidation – ${d.companyName}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Convocation AGE Dissolution
// ─────────────────────────────────────────────────────────────────────────────
function generateConvocationHtml(d: ConvocationData): string {
  const dirigeant = d.dirigeant ?? "gérant";
  let body = `
    <h1>CONVOCATION DES ASSOCIÉS À L'ASSEMBLÉE GÉNÉRALE EXTRAORDINAIRE</h1>
    <p class="center"><strong>${esc(d.companyName)}</strong></p>
    <p class="center">${esc(d.formeJuridique)} au capital de ${esc(d.capital)} €</p>
    <p class="center">Siège social : ${esc(d.siegeAdresse)}, ${esc(d.siegeVille)}</p>
    <p class="center">RCS de ${esc(d.rcsVille)} – SIREN : ${esc(d.sirenNumero)}</p>
    <hr>
    <p>Madame, Monsieur,</p>
    <p>En votre qualité d'associé de la société <strong>${esc(d.companyName)}</strong>, nous avons l'honneur de vous convoquer par ${esc(d.modeConvocation)} à une Assemblée Générale Extraordinaire qui se tiendra le <strong>${esc(d.date)}</strong> à <strong>${esc(d.heure)}</strong>${d.lieuAssemblee ? ` au <strong>${esc(d.lieuAssemblee)}</strong>` : " au siège social"}.</p>
    <p><strong>Ordre du jour :</strong></p>
    <ul>
      <li>Dissolution anticipée de la Société</li>
      <li>Nomination du liquidateur et définition de ses pouvoirs</li>
      <li>Délégation de pouvoirs aux fins de formalités</li>
    </ul>
  `;

  // Résolutions à titre indicatif
  body += `<h2>Résolution 1 – Dissolution</h2>`;
  body += `<p>Décision de la dissolution anticipée et de la liquidation amiable de la Société.</p>`;
  body += `<h2>Résolution 2 – Nomination du liquidateur</h2>`;
  body += `<p>Nomination du liquidateur.</p>`;
  body += `<h2>Résolution 3 – Missions du Liquidateur</h2>`;
  body += `<p>Attribution des pouvoirs au liquidateur.</p>`;
  body += `<h2>Résolution 4 – Délégation de pouvoirs en vue des formalités</h2>`;
  body += `<p>Délégation de tous pouvoirs ${LEGALCORNERS_CLAUSE}, à l'effet d'accomplir toutes les formalités légales.</p>`;

  if (d.emailQuestions) {
    body += `<p>Conformément aux dispositions légales, toute question écrite devra être adressée à l'adresse suivante : <strong>${esc(d.emailQuestions)}</strong>.</p>`;
  }

  body += `<p style="margin-top:24px">Le ${dirigeant}</p>`;
  body += `<div class="sig-line" style="width:40%"></div>`;

  return wrap(body, `Convocation AGE – ${d.companyName}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Convocation AGO Liquidation
// ─────────────────────────────────────────────────────────────────────────────
function generateConvocationLiquidationHtml(d: ConvocationLiquidationData): string {
  const dirigeant = "gérant";
  let body = `
    <h1>CONVOCATION DES ASSOCIÉS À L'ASSEMBLÉE GÉNÉRALE ORDINAIRE</h1>
    <p class="center"><strong>${esc(d.companyName)}</strong></p>
    <p class="center">${esc(d.formeJuridique)} au capital de ${esc(d.capital)} €</p>
    <p class="center">Siège social : ${esc(d.siegeAdresse)}, ${esc(d.siegeVille)}</p>
    <p class="center">RCS de ${esc(d.rcsVille)} – SIREN : ${esc(d.sirenNumero)}</p>
    <hr>
    <p>En votre qualité d'associé, nous vous convoquons par ${esc(d.modeConvocation)} à une Assemblée Générale Ordinaire de clôture de liquidation qui se tiendra le <strong>${esc(d.date)}</strong> à <strong>${esc(d.heure)}</strong>${d.lieuAssemblee ? ` au <strong>${esc(d.lieuAssemblee)}</strong>` : " au siège de liquidation"}.</p>
    <p><strong>Ordre du jour :</strong></p>
    <ul>
      <li>Approbation des comptes de liquidation</li>
      <li>Répartition du solde de liquidation</li>
      <li>Clôture de la liquidation</li>
      <li>Délégation de pouvoirs aux fins de radiation</li>
    </ul>
    <h2>Résolution 8 – Pouvoirs aux fins de radiation</h2>
    <p>Délégation de tous pouvoirs ${LEGALCORNERS_CLAUSE}, pour effectuer la radiation au RCS.</p>
  `;

  if (d.emailQuestions) {
    body += `<p>Toute question écrite : <strong>${esc(d.emailQuestions)}</strong>.</p>`;
  }

  body += `<p style="margin-top:24px">Le liquidateur</p>`;
  body += `<div class="sig-line" style="width:40%"></div>`;

  return wrap(body, `Convocation AGO Liquidation – ${d.companyName}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json();

    let html = "";
    if (type === "pv") {
      html = generatePVHtml(data as PVData);
    } else if (type === "pv-liquidation") {
      html = generatePVLiquidationHtml(data as PVLiquidationData);
    } else if (type === "convocation") {
      html = generateConvocationHtml(data as ConvocationData);
    } else if (type === "convocation-liquidation") {
      html = generateConvocationLiquidationHtml(data as ConvocationLiquidationData);
    } else {
      return NextResponse.json({ error: "Type inconnu" }, { status: 400 });
    }

    return NextResponse.json({ html });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
