import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, AlignmentType, convertInchesToTwip } from "docx";

export interface ConvocationSommeilData {
  companyName: string;
  formeJuridique: string;
  capital: string;
  siegeVille: string;
  siegeCP: string;
  siegeAdresse: string;
  rcsVille: string;
  sirenNumero: string;
  modeConvocation: "LRAR" | "lettre simple" | "voie électronique" | "remise en mains propres";
  date: string;
  heure: string;
  lieuAssemblee: string;
  emailQuestions: string;
  dirigeant: "gérant" | "président";
  dateMiseEnSommeil: string;
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

export async function POST(request: NextRequest) {
  const d: ConvocationSommeilData = await request.json();

  const blocks: Paragraph[] = [
    p(d.companyName, true, true),
    p(`${d.formeJuridique} au capital de ${d.capital} euros`, false, true),
    p(`dont le siège social est situé à ${d.siegeVille} ${d.siegeCP}, ${d.siegeAdresse}`, false, true),
    p(`Immatriculée au RCS de ${d.rcsVille}`, false, true),
    p(`sous le numéro ${d.sirenNumero}`, false, true),
    p(`Convocation adressée par ${d.modeConvocation}`, false, true),
    new Paragraph({ children: [], spacing: { after: 200 } }),
    heading("CONVOCATION DES ASSOCIÉS À L'ASSEMBLÉE GÉNÉRALE EXTRAORDINAIRE"),
    new Paragraph({ children: [], spacing: { after: 200 } }),
    p("Cher(e) associé(e),"),
    p(`Nous avons l'honneur de vous informer que les associés de notre Société sont convoqués, le ${d.date} en Assemblée Générale extraordinaire à ${d.lieuAssemblee} à l'heure de ${d.heure}.`),
    p("Les points suivants seront à l'ordre du jour :"),
    bullet("Cessation d'activité encore appelée mise en sommeil de la société."),
    new Paragraph({ children: [], spacing: { after: 100 } }),
    p("Vous trouverez ci-joint le texte des résolutions proposées à l'assemblée."),
    p("Au cas où vous ne pourriez assister personnellement à cette assemblée, vous pourrez vous y faire représenter en remettant une procuration à un autre associé dont un exemplaire est ci-joint."),
    p(`Nous vous rappelons que vous pouvez, à compter de la présente, poser par écrit des questions à l'assemblée à l'adresse email suivante : ${d.emailQuestions}, auxquelles il sera répondu au cours de cette réunion.`),
    p("Nous vous prions d'agréer l'expression de nos sentiments distingués."),
    p(`Le ${d.dirigeant === "gérant" ? "Gérant" : "Président"}`),
    p("Vous en souhaitant bonne réception,"),
    p("Cordialement."),

    new Paragraph({ children: [], spacing: { before: 400, after: 200 } }),
    heading("TEXTE DES RÉSOLUTIONS"),

    heading("Résolution 1 – Cessation d'activité"),
    new Paragraph({
      children: [
        new TextRun({ text: "L'Assemblée Générale ", bold: true }),
        new TextRun({ text: `décide la mise en sommeil de la société à compter du ${d.dateMiseEnSommeil} pour une durée maximale de 2 ans, conformément à l'article R.123-48 du Code de commerce.` }),
      ],
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 160 },
    }),

    heading("Résolution 2 – Délégation de pouvoirs en vue des formalités"),
    new Paragraph({
      children: [
        new TextRun({ text: "L'Assemblée ", bold: true }),
        new TextRun({ text: "confère tous pouvoirs au porteur d'une copie ou d'un extrait du présent procès-verbal à l'effet d'accomplir toutes les formalités légales." }),
      ],
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 160 },
    }),
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
      "Content-Disposition": `attachment; filename="Convocation_MiseEnSommeil_${d.companyName.replace(/\s+/g, "_")}.docx"`,
    },
  });
}
