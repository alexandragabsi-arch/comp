import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, AlignmentType, convertInchesToTwip } from "docx";

export interface ConvocationLiquidationData {
  companyName: string;
  formeJuridique: string;
  capital: string;
  siegeVille: string;
  siegeCP: string;
  siegeAdresse: string;
  rcsVille: string;
  sirenNumero: string;
  modeConvocation: "LRAR" | "lettre simple" | "voie électronique" | "remise en mains propres";
  date: string;       // JJ/MM/YYYY
  heure: string;      // "10h00"
  lieuAssemblee: string;
  emailQuestions: string;
  dirigeant: "gérant" | "président";
  decisionType: "associe_unique" | "unanimite" | "age";
  // Résolutions
  dateArretComptes: string;  // JJ/MM/YYYY
  soldeSigne: "positif" | "negatif";
  soldeMontant: string;
}

function p(text: string, bold_ = false, center = false): Paragraph {
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
    spacing: { before: 300, after: 200 },
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text })],
    bullet: { level: 0 },
    spacing: { after: 100 },
  });
}

function getDecision(d: ConvocationLiquidationData) {
  if (d.decisionType === "associe_unique") return "L'associé unique";
  if (d.decisionType === "unanimite") return "L'unanimité des associés";
  return "L'assemblée des associés";
}

function verb(d: ConvocationLiquidationData, singular: string, plural: string) {
  return d.decisionType === "associe_unique" ? singular : plural;
}

function getSoldeLabel(signe: string) {
  return signe === "positif" ? "Positif" : "Négatif";
}

export async function POST(request: NextRequest) {
  const d: ConvocationLiquidationData = await request.json();
  const decision = getDecision(d);

  const blocks: Paragraph[] = [
    // En-tête société
    p(`${d.companyName}`, true, true),
    p(`${d.formeJuridique} au capital de ${d.capital} euros`, false, true),
    p(`dont le siège social est situé à ${d.siegeVille} ${d.siegeCP}, ${d.siegeAdresse}`, false, true),
    p(`Immatriculée au RCS de ${d.rcsVille}`, false, true),
    p(`sous le numéro ${d.sirenNumero}`, false, true),
    p(`Convocation adressée par ${d.modeConvocation}`, false, true),
    new Paragraph({ children: [], spacing: { after: 200 } }),
    heading("CONVOCATION DES ASSOCIÉS À L'ASSEMBLÉE GÉNÉRALE ORDINAIRE"),
    new Paragraph({ children: [], spacing: { after: 200 } }),
    p("Cher(e) associé(e),"),
    p(
      `Nous avons l'honneur de vous informer que les associés de notre Société sont convoqués, le ${d.date} en Assemblée Générale ordinaire à ${d.lieuAssemblee} à l'heure de ${d.heure}.`
    ),
    p("Les points suivants seront à l'ordre du jour :"),
    bullet("Approbation des comptes de liquidation,"),
    bullet("Répartition du solde de liquidation,"),
    bullet("La clôture définitive des opérations de liquidation."),
    new Paragraph({ children: [], spacing: { after: 100 } }),
    p("Vous trouverez ci-joint le texte des résolutions proposées à l'assemblée."),
    p(
      "Au cas où vous ne pourriez assister personnellement à cette assemblée, vous pourrez vous y faire représenter en remettant une procuration à un autre associé."
    ),
    p(
      `Nous vous rappelons que vous pouvez, à compter de la présente, poser par écrit des questions à l'assemblée à l'adresse email suivante : ${d.emailQuestions}, auxquelles il sera répondu au cours de cette réunion.`
    ),
    p("Nous vous prions d'agréer l'expression de nos sentiments distingués."),
    p(`Le ${d.dirigeant === "gérant" ? "Gérant" : "Président"}`),
    p("Vous en souhaitant bonne réception,"),
    p("Cordialement."),

    new Paragraph({ children: [], spacing: { before: 400, after: 200 } }),
    heading("TEXTE DES RÉSOLUTIONS"),

    // Résolution 5
    heading("Résolution 5 – Approbation des comptes de liquidation"),
    new Paragraph({
      children: [
        new TextRun({ text: `${decision} `, bold: true }),
        new TextRun({
          text: `après avoir entendu lecture du rapport du liquidateur sur l'ensemble des opérations de liquidation et avoir pris connaissance des comptes définitifs arrêtés le ${d.dateArretComptes} faisant ressortir un solde « ${getSoldeLabel(d.soldeSigne)} » de liquidation d'un montant de ${d.soldeMontant} €, ${verb(d, "approuve", "approuvent")} lesdits comptes.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 160 },
    }),

    // Résolution 6
    heading("Résolution 6 – Répartition du solde de liquidation"),
    new Paragraph({
      children: [
        new TextRun({ text: `${decision} `, bold: true }),
        new TextRun({
          text: `après avoir entendu le liquidateur sur l'ensemble des opérations de liquidation et avoir pris connaissance des comptes définitifs arrêtés le ${d.dateArretComptes}, ${verb(d, "décide", "décident")} de répartir le solde « ${getSoldeLabel(d.soldeSigne)} » de liquidation s'élevant à ${d.soldeMontant} € de la façon suivante :`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 160 },
    }),
    ...(d.soldeSigne === "positif"
      ? [
          bullet(
            `Attribution du boni au profit ${d.decisionType === "associe_unique" ? "de l'associé unique" : "des associés"} conformément aux dispositions prévues par les statuts. À défaut de précision statutaire, le boni de liquidation est réparti entre les associés en proportion de leurs droits dans le capital social.`
          ),
        ]
      : [
          bullet(
            `Remboursement partiel des titres souscrits après apurement du passif à hauteur de ${d.soldeMontant} euros.`
          ),
        ]),

    // Résolution 7
    heading("Résolution 7 – Clôture définitive des opérations de liquidation"),
    new Paragraph({
      children: [
        new TextRun({ text: `${decision} `, bold: true }),
        new TextRun({
          text: `${verb(d, "donne", "donnent")} :`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 },
    }),
    bullet("quitus au liquidateur de sa gestion et le décharge de son mandat ;"),
    bullet("constate la fin des opérations de liquidation et prononce la clôture définitive de la liquidation."),

    // Résolution 8
    new Paragraph({ children: [], spacing: { after: 200 } }),
    heading("Résolution 8 – Pouvoirs en vue d'accomplir les formalités"),
    new Paragraph({
      children: [
        new TextRun({ text: `${decision} `, bold: true }),
        new TextRun({
          text: `${verb(d, "donne", "donnent")} tous pouvoirs au porteur d'une copie ou d'un extrait du présent procès-verbal pour effectuer la demande de radiation de la société du registre du commerce et des sociétés et accomplir les formalités de publicité afférentes aux décisions ci-dessus adoptées conformément aux dispositions législatives et réglementaires en vigueur.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 160 },
    }),
  ];

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
        children: blocks,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const uint8 = new Uint8Array(buffer);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="Convocation_AGO_Liquidation_${d.companyName.replace(/\s+/g, "_")}.docx"`,
    },
  });
}
