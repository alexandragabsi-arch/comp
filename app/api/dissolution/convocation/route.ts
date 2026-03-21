import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, AlignmentType, convertInchesToTwip } from "docx";

export interface ConvocationData {
  companyName: string;
  formeJuridique: string;
  capital: string;
  siegeVille: string;
  siegeAdresse: string;  // "numéro, rue"
  rcsVille: string;
  sirenNumero: string;
  modeConvocation: "LRAR" | "lettre simple" | "voie électronique" | "remise en mains propres";
  date: string;           // JJ/MM/YYYY
  heure: string;          // "10h00"
  lieuAssemblee: string;  // "au siège social" ou adresse complète
  emailQuestions: string;
  dirigeant: "gérant" | "président";
  decisionType: "associe_unique" | "unanimite" | "age";
  siegeLiquidation: "siege_social" | "domicile_liquidateur" | "autre";
  siegeLiquidationAdresse?: string;
  // Liquidateur
  liqType: "personne" | "societe";
  liqNom?: string;
  liqPrenom?: string;
  liqAdresse?: string;
  liqEstGerant?: boolean;
  liqSocieteNom?: string;
  liqSocieteRCSVille?: string;
  liqSocieteRCSNum?: string;
  liqSocieteRep?: string;
  liqRemuneration?: string;
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

function getSiegeLiquidation(d: ConvocationData): string {
  if (d.siegeLiquidation === "siege_social") return "au siège de la Société";
  if (d.siegeLiquidation === "domicile_liquidateur") return "au domicile du liquidateur";
  return `à l'adresse suivante : ${d.siegeLiquidationAdresse}`;
}

function getLiquidateurText(d: ConvocationData): string {
  if (d.liqType === "personne") {
    const qualite = d.liqEstGerant ? `, ${d.dirigeant} de la Société` : "";
    return `${d.liqPrenom} ${d.liqNom}${qualite}, demeurant au ${d.liqAdresse}`;
  }
  return `la société dénommée ${d.liqSocieteNom}, inscrite au registre du commerce et des sociétés de ${d.liqSocieteRCSVille} sous le numéro ${d.liqSocieteRCSNum}, représentée par ${d.liqSocieteRep} qui déclare disposer de tous pouvoirs à l'effet des présentes`;
}

function getDecision(d: ConvocationData) {
  if (d.decisionType === "associe_unique") return "L'associé unique";
  if (d.decisionType === "unanimite") return "L'unanimité des associés";
  return "L'assemblée des associés";
}

function getDecisionVerb(d: ConvocationData, verb: string) {
  const singular = d.decisionType === "associe_unique";
  const verbs: Record<string, [string, string]> = {
    decider: ["décide", "décident"],
    nommer: ["nomme", "nomment"],
    conferer: ["confère", "confèrent"],
    donner: ["donne", "donnent"],
    mettre: ["met", "mettent"],
  };
  return verbs[verb]?.[singular ? 0 : 1] ?? verb;
}

export async function POST(request: NextRequest) {
  const d: ConvocationData = await request.json();
  const decision = getDecision(d);

  const blocks: Paragraph[] = [
    // En-tête société
    p(`${d.companyName}`, true, true),
    p(`${d.formeJuridique} au capital de ${d.capital} euros`, false, true),
    p(`dont le siège social est situé à ${d.siegeVille}, ${d.siegeAdresse}`, false, true),
    p(`Immatriculée au RCS de ${d.rcsVille}`, false, true),
    p(`sous le numéro ${d.sirenNumero}`, false, true),
    p(`Convocation adressée par ${d.modeConvocation}`, false, true),
    new Paragraph({ children: [], spacing: { after: 200 } }),
    heading("CONVOCATION DES ASSOCIÉS À L'ASSEMBLÉE GÉNÉRALE EXTRAORDINAIRE"),
    new Paragraph({ children: [], spacing: { after: 200 } }),
    p("Cher(e) associé(e),"),
    p(
      `Nous avons l'honneur de vous informer que les associés de notre société sont convoqués, le ${d.date} en Assemblée Générale Extraordinaire à ${d.lieuAssemblee} à l'heure de ${d.heure}.`
    ),
    p("Les points suivants seront à l'ordre du jour :"),
    bullet("la dissolution de la société,"),
    bullet("la nomination d'un liquidateur."),
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

    // Résolution 1
    heading("Résolution 1 – Dissolution"),
    new Paragraph({
      children: [
        new TextRun({ text: `${decision} `, bold: true }),
        new TextRun({
          text: `après avoir entendu lecture du rapport de gestion, ${getDecisionVerb(d, "decider")} de la dissolution anticipée de la Société dénommée `,
        }),
        new TextRun({ text: d.companyName, bold: true }),
        new TextRun({
          text: " à compter de ce jour et sa liquidation amiable conformément aux dispositions des articles L.237-1 à 237-13 du Code de commerce.",
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 160 },
    }),
    p(
      "La Société subsistera pour les besoins de la liquidation et jusqu'à la clôture de celle-ci."
    ),
    p(
      'Durant cette période, la dénomination sociale sera suivie de la mention " société en liquidation ". Cette mention ainsi que le nom du liquidateur devront figurer sur tous les documents et actes destinés aux tiers.'
    ),
    p(`Le siège social de la liquidation est fixé ${getSiegeLiquidation(d)}.`),

    // Résolution 2
    heading("Résolution 2 – Nomination du liquidateur"),
    new Paragraph({
      children: [
        new TextRun({ text: `${decision} `, bold: true }),
        new TextRun({
          text: `${getDecisionVerb(d, "nommer")} en qualité de Liquidateur et pour une durée maximum d'1 (un) an, `,
        }),
        new TextRun({ text: getLiquidateurText(d), bold: true }),
        new TextRun({ text: "." }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 160 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `${decision} `, bold: true }),
        new TextRun({
          text: `${getDecisionVerb(d, "mettre")} ainsi fin aux fonctions du ${d.dirigeant} à compter de ce jour.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 160 },
    }),
    p(
      `Dans les six mois de sa nomination, le Liquidateur doit convoquer ${d.decisionType === "associe_unique" ? "l'associé unique" : "les associés"} en assemblée générale ordinaire, à l'effet de leur faire un rapport sur la situation comptable de la société, sur la poursuite des opérations de liquidation et sur le délai nécessaire pour les terminer.`
    ),
    ...(d.liqRemuneration
      ? [
          new Paragraph({
            children: [
              new TextRun({ text: `${decision} `, bold: true }),
              new TextRun({
                text: `${getDecisionVerb(d, "decider")} que le liquidateur a droit, en contrepartie de l'exercice de son mandat, à une rémunération de ${d.liqRemuneration} euros mensuels.`,
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 160 },
          }),
        ]
      : []),

    // Résolution 3
    heading("Résolution 3 – Missions du Liquidateur"),
    new Paragraph({
      children: [
        new TextRun({ text: `${decision} `, bold: true }),
        new TextRun({
          text: `${getDecisionVerb(d, "donner")} au liquidateur les pouvoirs les plus étendus pour mener à bien sa mission, c'est-à-dire réaliser l'actif, payer le passif et répartir le solde entre les associés, sous réserve des dispositions des articles L 237-1 et suivants du Code de commerce.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 160 },
    }),
    p(
      "Il est autorisé à continuer les affaires en cours pour les besoins de la liquidation exclusivement."
    ),
    p(
      `Le liquidateur est tenu de réunir ${d.decisionType === "associe_unique" ? "l'associé unique" : "les associés"} en assemblée générale ordinaire au moins une fois par an, dans les trois mois de la clôture de l'exercice social, en vue d'approuver les comptes annuels.`
    ),

    // Résolution 4
    heading("Résolution 4 – Délégation de pouvoirs en vue des formalités"),
    new Paragraph({
      children: [
        new TextRun({ text: `${decision} `, bold: true }),
        new TextRun({
          text: `${getDecisionVerb(d, "conferer")} tous pouvoirs au porteur d'une copie ou d'un extrait du présent procès-verbal à l'effet d'accomplir toutes les formalités légales.`,
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
      "Content-Disposition": `attachment; filename="Convocation_AGE_${d.companyName.replace(/\s+/g, "_")}.docx"`,
    },
  });
}
