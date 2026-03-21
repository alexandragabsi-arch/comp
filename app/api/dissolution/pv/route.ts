import { NextRequest, NextResponse } from "next/server";
import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  HeadingLevel, BorderStyle, Table, TableRow, TableCell,
  WidthType, convertInchesToTwip,
} from "docx";

export interface PVData {
  // Société
  companyName: string;
  formeJuridique: string;
  capital: string;
  rcsVille: string;
  siren: string;
  siegeSocial: string;

  // Décision
  decisionType: "associe_unique" | "unanimite" | "age";

  // Date / lieu
  date: string;        // "DD/MM/YYYY"
  ville: string;

  // Associé unique / unanimité
  associeUniqueNom?: string;
  associeUniquePrenom?: string;

  // AGE
  age?: {
    heure: string;
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
  liquidateur: {
    type: "personne" | "societe";
    nom?: string;
    prenom?: string;
    adresse?: string;
    estGerantActuel: boolean;
    societeNom?: string;
    societeRCSVille?: string;
    societeRCSNumero?: string;
    societeRepresentantPar?: string;
    remuneration?: string; // montant mensuel ou ""
  };

  siegeLiquidation: "siege_social" | "domicile_liquidateur" | "autre";
  siegeLiquidationAdresse?: string;
}

function bold(text: string) {
  return new TextRun({ text, bold: true });
}

function normal(text: string) {
  return new TextRun({ text });
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
  if (r.unanimite) {
    return paraText("La résolution est adoptée à l'unanimité.");
  }
  return paraText(
    `La résolution est adoptée avec ${r.pour} votes en faveur de la résolution, ${r.contre} votes contre et ${r.abstentions} abstentions.`
  );
}

function getDecision(d: PVData) {
  if (d.decisionType === "associe_unique") return "L'associé unique";
  if (d.decisionType === "unanimite") return "L'unanimité des associés";
  return "L'assemblée des associés";
}

function getSiegeLiquidation(d: PVData): string {
  if (d.siegeLiquidation === "siege_social") return "au siège de la Société";
  if (d.siegeLiquidation === "domicile_liquidateur") return "au domicile du liquidateur";
  return `à l'adresse suivante : ${d.siegeLiquidationAdresse}`;
}

function getLiquidateurText(d: PVData): string {
  const liq = d.liquidateur;
  if (liq.type === "personne") {
    const name = `${liq.prenom} ${liq.nom}`;
    const qualite = liq.estGerantActuel ? `, ${d.formeJuridique.toLowerCase().includes("sas") ? "président" : "gérant"} de la Société` : "";
    return `${name}${qualite}, demeurant au ${liq.adresse}`;
  }
  return `la société dénommée ${liq.societeNom}, inscrite au registre du commerce et des sociétés de ${liq.societeRCSVille} sous le numéro ${liq.societeRCSNumero}, représentée par ${liq.societeRepresentantPar} qui déclare disposer de tous pouvoirs à l'effet des présentes`;
}

export async function POST(request: NextRequest) {
  const d: PVData = await request.json();

  const decision = getDecision(d);
  const decisionPluriel =
    d.decisionType === "associe_unique" ? "décide" : "décident";
  const nomme =
    d.decisionType === "associe_unique" ? "nomme" : "nomment";
  const confere =
    d.decisionType === "associe_unique" ? "confère" : "confèrent";
  const donne =
    d.decisionType === "associe_unique" ? "donne" : "donnent";
  const dirigeant = d.formeJuridique.toUpperCase().includes("SAS") ? "président" : "gérant";

  const r1 = d.age?.resolutions?.find((r) => r.id === "r1");
  const r2 = d.age?.resolutions?.find((r) => r.id === "r2");
  const r3 = d.age?.resolutions?.find((r) => r.id === "r3");
  const r4 = d.age?.resolutions?.find((r) => r.id === "r4");

  // ── Intro commune ────────────────────────────────────────────────────────────
  const introBlocks: Paragraph[] = [
    heading("PROCÈS-VERBAL DE DISSOLUTION"),
    paraText(`${d.companyName}`, true, true),
    para(
      [
        normal(`${d.formeJuridique} au capital de ${d.capital} €`),
      ],
      true
    ),
    para(
      [
        normal(`Immatriculée au RCS de ${d.rcsVille} sous le numéro ${d.siren}`),
      ],
      true
    ),
    para([normal(`Siège social : ${d.siegeSocial}`)], true),
    new Paragraph({ children: [], spacing: { after: 300 } }),
  ];

  // ── Titre du type de PV ───────────────────────────────────────────────────
  let pvTitle = "";
  if (d.decisionType === "associe_unique") pvTitle = "PROCÈS-VERBAL DE DÉCISIONS DE L'ASSOCIÉ UNIQUE";
  else if (d.decisionType === "unanimite") pvTitle = "PROCÈS-VERBAL DE DÉCISIONS UNANIMES DES ASSOCIÉS";
  else pvTitle = "PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE EXTRAORDINAIRE";

  const titleBlock = heading(pvTitle);

  // ── Corps selon type ──────────────────────────────────────────────────────
  const bodyBlocks: Paragraph[] = [];

  if (d.decisionType === "associe_unique") {
    bodyBlocks.push(
      para([
        normal(`Le ${d.date}, l'associé unique, `),
        bold(`${d.associeUniquePrenom} ${d.associeUniqueNom}`),
        normal(", a pris les décisions suivantes :"),
      ])
    );
    bodyBlocks.push(bullet("La dissolution de la Société"));
    bodyBlocks.push(bullet("La nomination d'un Liquidateur"));
  } else if (d.decisionType === "unanimite") {
    bodyBlocks.push(
      para([
        normal(`Le ${d.date}, la totalité des associés de la société `),
        bold(d.companyName),
        normal(" réunis ont pris unanimement les décisions suivantes :"),
      ])
    );
    bodyBlocks.push(bullet("La dissolution de la Société"));
    bodyBlocks.push(bullet("La nomination d'un Liquidateur"));
  } else if (d.decisionType === "age" && d.age) {
    const a = d.age;
    bodyBlocks.push(
      para([
        normal(`Le ${d.date} à ${a.heure}, les associés de la société susnommée, se sont réunis en Assemblée générale extraordinaire.`),
      ])
    );
    bodyBlocks.push(
      paraText(`L'Assemblée a été convoquée par le ${dirigeant} de la Société.`)
    );
    bodyBlocks.push(
      para([
        normal(
          `Les associés présents et, le cas échéant, représentés, totalisent ${a.partsPresentes} ${a.typeActions} sur un total de ${a.partsTotal} ${a.typeActions}.`
        ),
      ])
    );
    bodyBlocks.push(
      paraText(
        "Les conditions de quorum nécessaires pour cette Assemblée sont donc remplies."
      )
    );
    if (a.cacNom || a.cacPresent !== undefined) {
      const cacPres = a.cacPresent ? "présent" : "absent";
      bodyBlocks.push(
        para([
          normal(
            `${a.cacNom || "Le commissaire aux comptes"}, commissaire aux comptes, régulièrement convoqué, est ${cacPres}.`
          ),
        ])
      );
    }
    if (a.cePresent !== undefined) {
      const cePres = a.cePresent ? "présents" : "absents";
      bodyBlocks.push(
        paraText(
          `Les représentants du Comité d'entreprise régulièrement convoqués sont ${cePres}.`
        )
      );
    }
    bodyBlocks.push(
      para([
        normal(`L'Assemblée est présidée par `),
        bold(a.president),
        normal(`, en sa qualité de ${dirigeant}.`),
      ])
    );
    bodyBlocks.push(
      paraText(
        "Le Président constate que l'Assemblée, régulièrement constituée, peut valablement délibérer."
      )
    );
    bodyBlocks.push(
      paraText(
        "Le Président dépose sur le bureau et met à la disposition des associés :"
      )
    );
    bodyBlocks.push(bullet("la copie de la lettre de convocation adressée à chaque associé ;"));
    bodyBlocks.push(bullet("la feuille de présence ;"));
    bodyBlocks.push(bullet("un exemplaire des statuts ;"));
    bodyBlocks.push(bullet("le texte des résolutions proposées à l'Assemblée."));
    bodyBlocks.push(paraText("Aucune question écrite n'a été posée par les associés."));
    bodyBlocks.push(
      paraText(
        "L'Assemblée est réunie à l'effet de délibérer sur l'ordre du jour suivant :"
      )
    );
    bodyBlocks.push(bullet("La dissolution de la Société,"));
    bodyBlocks.push(bullet("La nomination du liquidateur."));
  }

  // ── Résolutions ──────────────────────────────────────────────────────────
  const resolutionBlocks: Paragraph[] = [
    new Paragraph({ children: [], spacing: { after: 200 } }),
    heading("RÉSOLUTION 1 – Dissolution"),
    para([
      bold(`${decision} `),
      normal(
        `après avoir entendu lecture du rapport de gestion, ${decisionPluriel} de la dissolution anticipée de la Société dénommée `
      ),
      bold(d.companyName),
      normal(
        ` à compter de ce jour et sa liquidation amiable conformément aux dispositions des articles L.237-1 à 237-13 du Code de commerce.`
      ),
    ]),
    paraText(
      "La Société subsistera pour les besoins de la liquidation et jusqu'à la clôture de celle-ci."
    ),
    paraText(
      'Durant cette période, la dénomination sociale sera suivie de la mention " société en liquidation ". Cette mention ainsi que le nom du liquidateur devront figurer sur tous les documents et actes destinés aux tiers.'
    ),
    para([
      normal(`Le siège social de la liquidation est fixé ${getSiegeLiquidation(d)}.`),
    ]),
  ];

  if (r1) resolutionBlocks.push(voteText(r1));

  resolutionBlocks.push(
    new Paragraph({ children: [], spacing: { after: 200 } }),
    heading("RÉSOLUTION 2 – Nomination du liquidateur"),
    para([
      bold(`${decision} `),
      normal(
        `${nomme} en qualité de Liquidateur et pour une durée maximum d'1 (un) an, `
      ),
      bold(getLiquidateurText(d)),
      normal("."),
    ])
  );

  if (d.liquidateur.estGerantActuel) {
    resolutionBlocks.push(
      para([
        bold(`${decision} `),
        normal(`met ainsi fin aux fonctions du ${dirigeant} à compter de ce jour.`),
      ])
    );
  }

  resolutionBlocks.push(
    para([
      normal(
        `Dans les six mois de sa nomination, le Liquidateur doit convoquer ${d.decisionType === "associe_unique" ? "l'associé unique" : "les associés"} en assemblée générale ordinaire, à l'effet de leur faire un rapport sur la situation comptable de la société, sur la poursuite des opérations de liquidation et sur le délai nécessaire pour les terminer.`
      ),
    ])
  );

  if (d.liquidateur.remuneration) {
    resolutionBlocks.push(
      para([
        bold(`${decision} `),
        normal(
          `${decisionPluriel} que le liquidateur a droit, en contrepartie de l'exercice de son mandat, à une rémunération de ${d.liquidateur.remuneration} euros mensuels.`
        ),
      ])
    );
  }

  if (r2) resolutionBlocks.push(voteText(r2));

  resolutionBlocks.push(
    new Paragraph({ children: [], spacing: { after: 200 } }),
    heading("RÉSOLUTION 3 – Missions du Liquidateur"),
    para([
      bold(`${decision} `),
      normal(
        `${donne} au liquidateur les pouvoirs les plus étendus pour mener à bien sa mission, c'est-à-dire réaliser l'actif, payer le passif et répartir le solde entre les associés, sous réserve des dispositions des articles L 237-1 et suivants du Code de commerce.`
      ),
    ]),
    paraText(
      "Il est autorisé à continuer les affaires en cours pour les besoins de la liquidation exclusivement."
    ),
    para([
      normal(
        `Le liquidateur est tenu de réunir ${d.decisionType === "associe_unique" ? "l'associé unique" : "les associés"} en assemblée générale ordinaire au moins une fois par an, dans les trois mois de la clôture de l'exercice social, en vue d'approuver les comptes annuels.`
      ),
    ])
  );

  if (r3) resolutionBlocks.push(voteText(r3));

  resolutionBlocks.push(
    new Paragraph({ children: [], spacing: { after: 200 } }),
    heading("RÉSOLUTION 4 – Délégation de pouvoirs en vue des formalités"),
    para([
      bold(`${decision} `),
      normal(
        `${confere} tous pouvoirs au porteur d'une copie ou d'un extrait du présent procès-verbal à l'effet d'accomplir toutes les formalités légales.`
      ),
    ])
  );

  if (r4) resolutionBlocks.push(voteText(r4));

  // ── Clôture ───────────────────────────────────────────────────────────────
  resolutionBlocks.push(
    new Paragraph({ children: [], spacing: { after: 300 } }),
    paraText("De tout ce qui précède, il a été dressé le présent procès-verbal."),
    para([
      normal(`Fait à ${d.ville}, le ${d.date}`),
    ]),
    new Paragraph({ children: [], spacing: { after: 400 } }),
  );

  // Signatures
  if (d.decisionType === "associe_unique") {
    resolutionBlocks.push(
      para([
        normal(`Signature de l'associé unique : `),
        bold(`${d.associeUniquePrenom} ${d.associeUniqueNom}`),
      ])
    );
  } else {
    resolutionBlocks.push(
      paraText("Signature de tous les associés :")
    );
  }

  if (d.liquidateur.type === "personne") {
    resolutionBlocks.push(
      para([
        normal(`Signature du liquidateur : `),
        bold(`${d.liquidateur.prenom} ${d.liquidateur.nom}`),
      ])
    );
  } else {
    resolutionBlocks.push(
      para([
        normal(
          `${d.liquidateur.societeNom}, en qualité de liquidateur, représentée par ${d.liquidateur.societeRepresentantPar}`
        ),
      ])
    );
  }

  // ── Build document ────────────────────────────────────────────────────────
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
        children: [
          ...introBlocks,
          titleBlock,
          ...bodyBlocks,
          ...resolutionBlocks,
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const uint8 = new Uint8Array(buffer);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="PV_Dissolution_${d.companyName.replace(/\s+/g, "_")}.docx"`,
    },
  });
}
