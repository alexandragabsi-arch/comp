import { NextRequest, NextResponse } from "next/server";
import {
  Document, Packer, Paragraph, TextRun, AlignmentType, convertInchesToTwip,
} from "docx";

export interface PVSommeilData {
  // Société
  companyName: string;
  formeJuridique: string;
  capital: string;
  rcsVille: string;
  siren: string;
  siegeAdresse: string;
  siegeCP: string;
  siegeVille: string;

  // Décision
  decisionType: "associe_unique" | "age";

  // Date / heure / lieu
  date: string;      // JJ/MM/YYYY
  heure?: string;    // pour AGE
  lieu?: string;     // pour AGE (adresse de tenue)
  ville: string;     // pour "Fait à"

  // Associé unique
  associeUniqueNom?: string;
  associeUniquePrenom?: string;
  associeUniqueEstSociete?: boolean;
  associeUniqueSocieteNom?: string;
  associeUniqueSocieteAdresse?: string;
  associeUniqueSocieteRepresentantPar?: string;

  // Dirigeant
  dirigeantNom: string;
  dirigeantPrenom: string;
  dirigeantQualite: "gérant" | "président";

  // AGE
  age?: {
    modeConvocation: string;
    dateConvocation: string;
    partsPresentes: string;
    partsTotal: string;
    typeActions: "actions" | "parts sociales";
    president: string;
    presidentQualite: "gérant" | "président" | "président de séance";
    questionsPrealables: "aucune" | "oui";
    resolutions: {
      id: string;
      resultat: "unanimite" | "majorite" | "rejetee";
    }[];
  };

  // Mise en sommeil
  dateMiseEnSommeil: string; // JJ/MM/YYYY
  fermetureEtablissement: boolean;

  // Décision format
  formatDecision: "associe_unique" | "associe_unique_societe" | "gerant_seul";
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

function resultatText(r: string): string {
  if (r === "unanimite") return "La résolution est adoptée à l'unanimité.";
  if (r === "majorite") return "La résolution est adoptée à la majorité.";
  return "La résolution est rejetée.";
}

export async function POST(request: NextRequest) {
  const d: PVSommeilData = await request.json();

  const isAGE = d.decisionType === "age";
  const isAssocieUnique = d.decisionType === "associe_unique";
  const dirigeantTitle = d.dirigeantQualite === "président" ? "Président" : "Gérant";

  // ── En-tête société ────────────────────────────────────────────────────────
  const blocks: Paragraph[] = [
    new Paragraph({ children: [new TextRun({ text: d.companyName, bold: true, size: 32 })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
    p(`${d.formeJuridique} au capital de ${d.capital} €`, false, true),
    p(`Immatriculée au RCS de ${d.rcsVille} sous le numéro ${d.siren}`, false, true),
    p(`Siège social : ${d.siegeAdresse} ${d.siegeCP} ${d.siegeVille}`, false, true),
    new Paragraph({ children: [], spacing: { after: 300 } }),
  ];

  // ── Titre PV ──────────────────────────────────────────────────────────────
  const pvTitle = isAGE
    ? "PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE EXTRAORDINAIRE"
    : "PROCÈS-VERBAL DE DÉCISIONS DE L'ASSOCIÉ UNIQUE";
  blocks.push(heading(pvTitle));

  // ── Corps ─────────────────────────────────────────────────────────────────
  if (isAGE && d.age) {
    const a = d.age;
    blocks.push(
      p(`Le ${d.date} à ${d.heure ?? ""}${d.lieu ? `, ${d.lieu}` : ""}, les associés de la société dénommée ${d.companyName} se sont réunis en Assemblée générale extraordinaire.`)
    );
    blocks.push(p(`L'Assemblée a été convoquée par le ${d.dirigeantQualite} de la société.`));
    blocks.push(p(`Les associés ont été convoqués par ${a.modeConvocation} en date du ${a.dateConvocation}.`));
    blocks.push(
      p(`Les associés présents et, le cas échéant, représentés, totalisent ${a.partsPresentes} ${a.typeActions} sur un total de ${a.partsTotal} ${a.typeActions}.`)
    );
    blocks.push(p("Les conditions de quorum nécessaires pour cette Assemblée sont donc remplies."));
    const presQualite = a.presidentQualite === "président de séance"
      ? "président de séance"
      : a.presidentQualite === "président" ? "Président" : "Gérant";
    blocks.push(
      new Paragraph({
        children: [
          new TextRun({ text: `L'Assemblée est présidée par ` }),
          new TextRun({ text: a.president, bold: true }),
          new TextRun({ text: `, en sa qualité de ${presQualite} (ci-après dénommé "Le Président").` }),
        ],
        alignment: AlignmentType.JUSTIFIED, spacing: { after: 160 },
      })
    );
    blocks.push(p("Le Président constate que l'Assemblée, régulièrement constituée, peut valablement délibérer."));
    blocks.push(p("Le Président de séance dépose sur le bureau et met à la disposition des associés :"));
    blocks.push(bullet("la copie de la lettre de convocation adressée à chaque associé,"));
    blocks.push(bullet("la feuille de présence,"));
    blocks.push(bullet("un exemplaire des statuts,"));
    blocks.push(bullet("le texte des résolutions proposées à l'Assemblée."));
    if (a.questionsPrealables === "aucune") {
      blocks.push(p("Aucune question écrite n'a été posée par les associés."));
    } else {
      blocks.push(p("Des questions préalables ont été posées et ont reçu une réponse de la part du Président."));
    }
    blocks.push(p("L'Assemblée est réunie à l'effet de délibérer sur l'ordre du jour suivant :"));
    blocks.push(bullet("Cessation d'activité dite mise en sommeil de la société."));
  } else {
    // Associé unique
    const dateHeure = `Le ${d.date}${d.heure ? ` à ${d.heure}` : ""}`;
    if (d.formatDecision === "associe_unique_societe") {
      blocks.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${dateHeure}, l'associé unique et ${d.dirigeantQualite} de la société, la société dénommée ` }),
            new TextRun({ text: d.associeUniqueSocieteNom ?? "", bold: true }),
            new TextRun({ text: `, dont le siège social est à ${d.associeUniqueSocieteAdresse ?? ""}, représentée par ${d.associeUniqueSocieteRepresentantPar ?? ""}, propriétaire de toutes les parts de la société, a pris les décisions suivantes :` }),
          ],
          alignment: AlignmentType.JUSTIFIED, spacing: { after: 160 },
        })
      );
    } else if (d.formatDecision === "gerant_seul") {
      blocks.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${dateHeure}, le ${d.dirigeantQualite}, ` }),
            new TextRun({ text: `${d.dirigeantPrenom} ${d.dirigeantNom}`, bold: true }),
            new TextRun({ text: ", a pris les décisions suivantes :" }),
          ],
          alignment: AlignmentType.JUSTIFIED, spacing: { after: 160 },
        })
      );
    } else {
      blocks.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${dateHeure}, l'associé unique et ${d.dirigeantQualite} de la société, ` }),
            new TextRun({ text: `${d.dirigeantPrenom} ${d.dirigeantNom}`, bold: true }),
            new TextRun({ text: ", propriétaire de toutes les parts de la société, a pris les décisions suivantes :" }),
          ],
          alignment: AlignmentType.JUSTIFIED, spacing: { after: 160 },
        })
      );
    }
    blocks.push(p("L'associé unique délibère sur l'ordre du jour suivant :"));
  }

  // ── Résolutions ───────────────────────────────────────────────────────────
  blocks.push(
    new Paragraph({ children: [], spacing: { after: 200 } }),
    heading("RÉSOLUTION 1 – Cessation d'activité"),
  );

  const decisionLabel = isAGE ? "L'Assemblée Générale" : "L'associé unique";
  const fermetureText = d.fermetureEtablissement
    ? `, ainsi que la fermeture de l'établissement principal à la même date`
    : "";

  blocks.push(
    new Paragraph({
      children: [
        new TextRun({ text: `${decisionLabel} `, bold: isAGE }),
        new TextRun({
          text: `décide la mise en sommeil de la société à compter du ${d.dateMiseEnSommeil} pour une durée maximale de 2 ans, conformément à l'article R.123-48 du Code de commerce${fermetureText}.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 160 },
    })
  );

  if (isAGE && d.age?.resolutions?.[0]) {
    blocks.push(p(resultatText(d.age.resolutions[0].resultat)));
  }

  blocks.push(
    new Paragraph({ children: [], spacing: { after: 200 } }),
    heading("RÉSOLUTION 2 – Délégation de pouvoirs en vue des formalités"),
    new Paragraph({
      children: [
        new TextRun({ text: `${decisionLabel} `, bold: isAGE }),
        new TextRun({
          text: "confère tous pouvoirs au porteur d'une copie ou d'un extrait du présent procès-verbal à l'effet d'accomplir toutes les formalités légales.",
        }),
      ],
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 160 },
    })
  );

  if (isAGE && d.age?.resolutions?.[1]) {
    blocks.push(p(resultatText(d.age.resolutions[1].resultat)));
  }

  // ── Clôture ───────────────────────────────────────────────────────────────
  if (isAGE) {
    blocks.push(p("L'ordre du jour étant épuisé, la séance est levée."));
  }

  blocks.push(
    p("De tout ce qui précède, il a été dressé le présent procès-verbal."),
    new Paragraph({ children: [new TextRun({ text: `Fait à ${d.ville}, le ${d.date}` })], spacing: { after: 400 } }),
  );

  // Signature
  if (isAssocieUnique) {
    if (d.formatDecision === "associe_unique_societe") {
      blocks.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${d.associeUniqueSocieteNom}, représentée par ${d.associeUniqueSocieteRepresentantPar}` }),
          ],
          spacing: { after: 160 },
        })
      );
    } else {
      blocks.push(
        new Paragraph({
          children: [new TextRun({ text: `Signature : ` }), new TextRun({ text: `${d.dirigeantPrenom} ${d.dirigeantNom}`, bold: true })],
          spacing: { after: 160 },
        })
      );
    }
  } else {
    blocks.push(
      new Paragraph({
        children: [new TextRun({ text: `${dirigeantTitle} de la Société` })],
        spacing: { after: 160 },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1.2) } } },
        children: blocks,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const uint8 = new Uint8Array(buffer);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="PV_MiseEnSommeil_${d.companyName.replace(/\s+/g, "_")}.docx"`,
    },
  });
}
