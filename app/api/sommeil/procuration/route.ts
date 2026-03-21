import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, AlignmentType, convertInchesToTwip } from "docx";

export interface ProcurationData {
  // Société
  companyName: string;
  formeJuridique: string;
  capital: string;
  siegeAdresse: string;

  // Mandant (celui qui donne procuration)
  mandantCivilite: "M." | "Mme" | "Melle";
  mandantNom: string;
  mandantPrenom: string;
  mandantAdresse: string;
  mandantEstSociete?: boolean;
  mandantSocieteNom?: string;
  mandantSocieteAdresse?: string;

  // Parts
  nombreParts: string;
  nombrePartsLettres: string;
  typeTitres: "actions" | "parts sociales";

  // Mandataire (celui qui reçoit la procuration)
  mandataireNom: string;
  mandatairePrenom: string;
  mandataireAdresse: string;

  // Assemblée
  typeAssemblee: "Ordinaire" | "Extraordinaire";
  dateAssemblee: string;
  heureAssemblee: string;
  lieuAssemblee: string;

  // Instructions de vote (facultatif)
  instructionsVote?: { resolution: string; vote: "Oui" | "Non" | "Abstention" }[];

  // Signature
  dateFait: string;
  villeFait: string;
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
    alignment: AlignmentType.LEFT,
    spacing: { before: 280, after: 140 },
  });
}

export async function POST(request: NextRequest) {
  const d: ProcurationData = await request.json();

  const blocks: Paragraph[] = [
    // En-tête société
    new Paragraph({ children: [new TextRun({ text: d.companyName, bold: true, size: 28 })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
    p(`${d.formeJuridique}, Capital social : ${d.capital} €`, false, true),
    p(`Siège social : ${d.siegeAdresse}`, false, true),
    new Paragraph({ children: [], spacing: { after: 200 } }),
    new Paragraph({ children: [new TextRun({ text: "FORMULAIRE DE PROCURATION", bold: true, size: 26 })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
    new Paragraph({ children: [new TextRun({ text: `Assemblée Générale du ${d.dateAssemblee}`, size: 24 })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),

    // Mandant
    new Paragraph({ children: [], spacing: { after: 120 } }),
    new Paragraph({
      children: [
        new TextRun({ text: `Je soussigné(e), ${d.mandantCivilite} ` }),
        new TextRun({ text: `${d.mandantPrenom} ${d.mandantNom}`, bold: true }),
        new TextRun({ text: `, demeurant à : ${d.mandantAdresse}` }),
        ...(d.mandantEstSociete ? [
          new TextRun({ text: `, agissant en tant que représentant de la société dénommée ` }),
          new TextRun({ text: d.mandantSocieteNom ?? "", bold: true }),
          new TextRun({ text: ` dont le siège social est à ${d.mandantSocieteAdresse ?? ""}` }),
        ] : []),
      ],
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 160 },
    }),
    p(`Agissant en qualité d'associé de la société dénommée ci-dessus et détenteur(trice) de ${d.nombreParts} ${d.typeTitres} (${d.nombrePartsLettres}),`),

    // Article 1
    heading("Article 1 : Désignation du mandataire"),
    new Paragraph({
      children: [
        new TextRun({ text: "Je désigne par la présente : " }),
        new TextRun({ text: `${d.mandatairePrenom} ${d.mandataireNom}`, bold: true }),
      ],
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 80 },
    }),
    p(`Demeurant à : ${d.mandataireAdresse}`),

    // Article 2
    heading("Article 2 : Pouvoir conféré"),
    new Paragraph({
      children: [
        new TextRun({ text: `Je donne à mon mandataire pouvoir de me représenter à l'Assemblée Générale ${d.typeAssemblee} de la société dénommée en tête des présentes, qui se tiendra le ${d.dateAssemblee} à ${d.heureAssemblee} à ${d.lieuAssemblee}, pour délibérer sur les points à l'ordre du jour :` }),
      ],
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 160 },
    }),
    new Paragraph({ children: [new TextRun({ text: "• Résolution 1 : Cessation d'activité (mise en sommeil)" })], spacing: { after: 80 } }),
    new Paragraph({ children: [new TextRun({ text: "• Résolution 2 : Délégation de pouvoirs en vue des formalités" })], spacing: { after: 160 } }),
    p("Je l'autorise à voter en mon nom sur toutes les résolutions inscrites à l'ordre du jour, et à exprimer mon vote comme suit :"),

    // Article 3
    heading("Article 3 : Instructions de vote (facultatif)"),
    ...(d.instructionsVote && d.instructionsVote.length > 0
      ? d.instructionsVote.map((inst) =>
          new Paragraph({
            children: [new TextRun({ text: `• Pour la résolution ${inst.resolution} : ${inst.vote}` })],
            spacing: { after: 80 },
          })
        )
      : [
          p("(Indiquer les instructions précises si vous souhaitez que votre mandataire vote de manière spécifique)"),
        ]),

    // Article 4
    heading("Article 4 : Signature"),
    p(`Fait à ${d.villeFait}, le ${d.dateFait}`),
    p("Signature de l'associé"),
    p("(précédée de la mention manuscrite \"Lu et approuvé\")"),
    new Paragraph({ children: [], spacing: { after: 400 } }),
    p("_________________________________"),
    p(`${d.mandantPrenom} ${d.mandantNom}`),
  ];

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1.2) } } },
      children: blocks,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="Procuration_AGE_${d.companyName.replace(/\s+/g, "_")}.docx"`,
    },
  });
}
