import { NextRequest, NextResponse } from "next/server";
import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  convertInchesToTwip,
} from "docx";

export interface PVLiquidationData {
  // Société
  companyName: string;
  formeJuridique: string;
  capital: string;
  rcsVille: string;
  siren: string;
  siegeSocial: string;

  // Décision
  decisionType: "associe_unique" | "unanimite" | "age";

  // Date / lieu / heure
  date: string;     // JJ/MM/YYYY
  heure?: string;   // pour AGE
  ville: string;

  // Associé unique / unanimité
  associeUniqueNom?: string;
  associeUniquePrenom?: string;

  // AGE
  age?: {
    partsPresentes: string;
    partsTotal: string;
    typeActions: "actions" | "parts sociales";
    cacPresent?: boolean;
    cacNom?: string;
    cePresent?: boolean;
    president: string;
    resolutions: {
      id: string;
      unanimite: boolean;
      pour?: string;
      contre?: string;
      abstentions?: string;
    }[];
  };

  // Liquidateur
  liquidateurNom: string;
  liquidateurPrenom: string;

  // Comptes de liquidation
  dateArretComptes: string;  // JJ/MM/YYYY
  soldeSigne: "positif" | "negatif";
  soldeMontant: string;
}

function para(runs: TextRun[], center = false): Paragraph {
  return new Paragraph({
    children: runs,
    alignment: center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    spacing: { after: 160 },
  });
}

function paraText(text: string, bold_ = false, center = false): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: bold_ })],
    alignment: center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    spacing: { after: 160 },
  });
}

function heading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, underline: {} })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 320, after: 200 },
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text })],
    bullet: { level: 0 },
    spacing: { after: 100 },
  });
}

type Resolution = { id: string; unanimite: boolean; pour?: string; contre?: string; abstentions?: string };
function voteText(r: Resolution): Paragraph {
  if (r.unanimite) return paraText("La résolution est adoptée à l'unanimité.");
  return paraText(
    `La résolution est adoptée avec ${r.pour} votes en faveur de la résolution, ${r.contre} votes contre et ${r.abstentions} abstentions.`
  );
}

function getDecision(d: PVLiquidationData) {
  if (d.decisionType === "associe_unique") return "L'associé unique";
  if (d.decisionType === "unanimite") return "L'unanimité des associés";
  return "L'assemblée des associés";
}

function verb(d: PVLiquidationData, s: string, pl: string) {
  return d.decisionType === "associe_unique" ? s : pl;
}

function getSoldeLabel(signe: string) {
  return signe === "positif" ? "Positif" : "Négatif";
}

export async function POST(request: NextRequest) {
  const d: PVLiquidationData = await request.json();
  const decision = getDecision(d);
  const dirigeant = d.formeJuridique.toUpperCase().includes("SAS") ? "président" : "gérant";

  const r5 = d.age?.resolutions?.find((r) => r.id === "r5");
  const r6 = d.age?.resolutions?.find((r) => r.id === "r6");
  const r7 = d.age?.resolutions?.find((r) => r.id === "r7");
  const r8 = d.age?.resolutions?.find((r) => r.id === "r8");

  // ── En-tête ──────────────────────────────────────────────────────────────
  const headerBlocks: Paragraph[] = [
    heading("PROCÈS-VERBAL DE LIQUIDATION"),
    paraText(d.companyName, true, true),
    para([new TextRun({ text: `${d.formeJuridique} au capital de ${d.capital} €` })], true),
    para([new TextRun({ text: `Siège social : ${d.siegeSocial}` })], true),
    para([new TextRun({ text: `Immatriculée au RCS de ${d.rcsVille} sous le numéro ${d.siren}` })], true),
    new Paragraph({ children: [], spacing: { after: 300 } }),
  ];

  let pvTitle = "";
  if (d.decisionType === "associe_unique") pvTitle = "PROCÈS-VERBAL DE DÉCISIONS DE L'ASSOCIÉ UNIQUE";
  else if (d.decisionType === "unanimite") pvTitle = "PROCÈS-VERBAL DE DÉCISIONS UNANIMES DES ASSOCIÉS";
  else pvTitle = "PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE ORDINAIRE";

  // ── Corps selon type ──────────────────────────────────────────────────────
  const bodyBlocks: Paragraph[] = [heading(pvTitle)];

  if (d.decisionType === "associe_unique") {
    bodyBlocks.push(
      para([
        new TextRun({ text: `Le ${d.date}${d.heure ? ` à ${d.heure}` : ""}, l'associé unique de la société, ` }),
        new TextRun({ text: `${d.associeUniquePrenom} ${d.associeUniqueNom}`, bold: true }),
        new TextRun({ text: ", a pris les décisions suivantes :" }),
      ])
    );
    bodyBlocks.push(bullet("Approbation des comptes de liquidation,"));
    bodyBlocks.push(bullet("Répartition du solde de liquidation (boni ou mali),"));
    bodyBlocks.push(bullet("Clôture définitive des opérations de liquidation."));
  } else if (d.decisionType === "unanimite") {
    bodyBlocks.push(
      para([
        new TextRun({ text: `Le ${d.date}, la totalité des associés de la société ` }),
        new TextRun({ text: d.companyName, bold: true }),
        new TextRun({ text: " réunis ont pris unanimement les décisions suivantes :" }),
      ])
    );
    bodyBlocks.push(bullet("Approbation des comptes de liquidation,"));
    bodyBlocks.push(bullet("Répartition du solde de liquidation,"));
    bodyBlocks.push(bullet("Clôture définitive des opérations de liquidation."));
  } else if (d.decisionType === "age" && d.age) {
    const a = d.age;
    bodyBlocks.push(
      paraText(`Le ${d.date} à ${d.heure ?? ""}, les associés de la Société susnommée, se sont réunis en Assemblée générale ordinaire.`)
    );
    bodyBlocks.push(paraText(`L'Assemblée a été convoquée par le ${dirigeant} de la Société.`));
    bodyBlocks.push(
      para([
        new TextRun({
          text: `Les associés présents et, le cas échéant, représentés, totalisent ${a.partsPresentes} ${a.typeActions} sur un total de ${a.partsTotal} ${a.typeActions}.`,
        }),
      ])
    );
    bodyBlocks.push(paraText("Les conditions de quorum nécessaires pour cette Assemblée sont donc remplies."));

    if (a.cacNom || a.cacPresent !== undefined) {
      bodyBlocks.push(
        paraText(`${a.cacNom || "Le commissaire aux comptes"}, commissaire aux comptes, régulièrement convoqué, est ${a.cacPresent ? "présent" : "absent"}.`)
      );
    }
    if (a.cePresent !== undefined) {
      bodyBlocks.push(paraText(`Les représentants du Comité d'entreprise régulièrement convoqués sont ${a.cePresent ? "présents" : "absents"}.`));
    }

    bodyBlocks.push(
      para([
        new TextRun({ text: `L'Assemblée est présidée par ` }),
        new TextRun({ text: a.president, bold: true }),
        new TextRun({ text: `, en sa qualité de ${dirigeant}.` }),
      ])
    );
    bodyBlocks.push(paraText("Le Président constate que l'Assemblée, régulièrement constituée, peut valablement délibérer."));
    bodyBlocks.push(paraText("Le Président dépose sur le bureau et met à la disposition des associés :"));
    bodyBlocks.push(bullet("la copie de la lettre de convocation adressée à chaque associé ;"));
    bodyBlocks.push(bullet("la feuille de présence ;"));
    bodyBlocks.push(bullet("un exemplaire des statuts ;"));
    bodyBlocks.push(bullet("le texte des résolutions proposées à l'Assemblée ;"));
    bodyBlocks.push(bullet("les comptes de liquidation ;"));
    bodyBlocks.push(bullet("le rapport du liquidateur."));
    bodyBlocks.push(paraText("Aucune question écrite n'a été posée par les associés."));
    bodyBlocks.push(paraText("L'Assemblée est réunie à l'effet de délibérer sur l'ordre du jour suivant :"));
    bodyBlocks.push(bullet("La clôture de la liquidation de la Société."));
  }

  // ── Résolutions ──────────────────────────────────────────────────────────
  const resBlocks: Paragraph[] = [
    new Paragraph({ children: [], spacing: { after: 200 } }),
    heading("RÉSOLUTION 5 – Approbation des comptes de liquidation"),
    para([
      new TextRun({ text: `${decision} `, bold: true }),
      new TextRun({
        text: `après avoir entendu lecture du rapport du liquidateur sur l'ensemble des opérations de liquidation et avoir pris connaissance des comptes définitifs arrêtés le ${d.dateArretComptes} faisant ressortir un solde « ${getSoldeLabel(d.soldeSigne)} » d'un montant de ${d.soldeMontant} €, ${verb(d, "approuve", "approuvent")} lesdits comptes.`,
      }),
    ]),
  ];
  if (r5) resBlocks.push(voteText(r5));

  resBlocks.push(
    new Paragraph({ children: [], spacing: { after: 200 } }),
    heading("RÉSOLUTION 6 – Répartition du solde de liquidation"),
    para([
      new TextRun({ text: `${decision} `, bold: true }),
      new TextRun({
        text: `après avoir entendu le liquidateur sur l'ensemble des opérations de liquidation et avoir pris connaissance des comptes définitifs arrêtés le ${d.dateArretComptes}, ${verb(d, "décide", "décident")} de répartir le solde « ${getSoldeLabel(d.soldeSigne)} » de liquidation s'élevant à ${d.soldeMontant} € de la façon suivante :`,
      }),
    ])
  );

  if (d.soldeSigne === "positif") {
    resBlocks.push(
      bullet(`Attribution du boni au profit ${d.decisionType === "associe_unique" ? "de l'associé unique" : "des associés"} conformément aux dispositions prévues par les statuts. À défaut de précision statutaire, le boni de liquidation est réparti entre les associés en proportion de leurs droits dans le capital social.`)
    );
  } else {
    resBlocks.push(
      bullet(`Remboursement partiel des titres souscrits après apurement du passif à hauteur de ${d.soldeMontant} euros.`)
    );
  }
  if (r6) resBlocks.push(voteText(r6));

  resBlocks.push(
    new Paragraph({ children: [], spacing: { after: 200 } }),
    heading("RÉSOLUTION 7 – Clôture définitive des opérations de liquidation"),
    para([
      new TextRun({ text: `${decision} `, bold: true }),
      new TextRun({ text: `${verb(d, "donne", "donnent")} :` }),
    ]),
    bullet("quitus au liquidateur de sa gestion et le décharge de son mandat ;"),
    bullet("constate la fin des opérations de liquidation et prononce la clôture définitive de la liquidation.")
  );
  if (r7) resBlocks.push(voteText(r7));

  resBlocks.push(
    new Paragraph({ children: [], spacing: { after: 200 } }),
    heading("RÉSOLUTION 8 – Pouvoirs en vue d'accomplir les formalités"),
    para([
      new TextRun({ text: `${decision} `, bold: true }),
      new TextRun({
        text: `${verb(d, "donne", "donnent")} tous pouvoirs à la société LEGALCORNERS, dont le siège social est situé au 78 Avenue des Champs-Élysées, 75008 Paris, immatriculée au Registre du Commerce et des Sociétés de Paris sous le numéro 988 485 405, ainsi qu'à tout porteur d'une copie ou d'un extrait du présent procès-verbal, pour effectuer la demande de radiation de la société du registre du commerce et des sociétés et accomplir les formalités de publicité afférentes aux décisions ci-dessus adoptées conformément aux dispositions législatives et réglementaires en vigueur.`,
      }),
    ])
  );
  if (r8) resBlocks.push(voteText(r8));

  // ── Clôture ───────────────────────────────────────────────────────────────
  resBlocks.push(
    new Paragraph({ children: [], spacing: { after: 200 } }),
  );

  if (d.decisionType !== "associe_unique") {
    resBlocks.push(paraText("L'ordre du jour étant épuisé, et personne ne demandant la parole, la séance est levée."));
  }

  resBlocks.push(
    paraText("De tout ce qui précède, il a été dressé le présent procès-verbal."),
    para([new TextRun({ text: `Fait à ${d.ville}, le ${d.date}` })]),
    new Paragraph({ children: [], spacing: { after: 400 } }),
  );

  if (d.decisionType === "associe_unique") {
    resBlocks.push(
      para([
        new TextRun({ text: "Signature de l'associé unique : " }),
        new TextRun({ text: `${d.associeUniquePrenom} ${d.associeUniqueNom}`, bold: true }),
      ])
    );
  } else {
    resBlocks.push(paraText("Signature de tous les associés :"));
  }

  resBlocks.push(
    para([
      new TextRun({ text: "Nom et signature du liquidateur : " }),
      new TextRun({ text: `${d.liquidateurPrenom} ${d.liquidateurNom}`, bold: true }),
    ])
  );

  // ── Build ─────────────────────────────────────────────────────────────────
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.2),
              right: convertInchesToTwip(1.2),
            },
          },
        },
        children: [...headerBlocks, ...bodyBlocks, ...resBlocks],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const uint8 = new Uint8Array(buffer);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="PV_Liquidation_${d.companyName.replace(/\s+/g, "_")}.docx"`,
    },
  });
}
