"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";

// ── Fonts ─────────────────────────────────────────────────────────────────────
Font.register({
  family: "Times",
  fonts: [
    { src: "https://fonts.gstatic.com/s/notoserifsc/v22/H4c8BXePl9DZ0Xe7gG9cyOj7mm63SzZBEtERe7U.woff2" },
  ],
});

// ── Styles ────────────────────────────────────────────────────────────────────
const NAVY = "#0D2459";
const BLUE = "#5B8DEF";
const GRAY = "#64748b";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: NAVY,
    paddingTop: 55,
    paddingBottom: 55,
    paddingLeft: 65,
    paddingRight: 65,
  },

  // Cover
  coverPage: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: NAVY,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  coverTopBar: { backgroundColor: NAVY, height: 8, width: "100%" },
  coverBottomBar: { backgroundColor: NAVY, height: 8, width: "100%", position: "absolute", bottom: 0 },
  coverBody: { paddingHorizontal: 60, paddingTop: 30, flex: 1 },
  coverLogo: { fontSize: 10, color: NAVY, marginBottom: "auto" },
  coverLogoB: { fontFamily: "Helvetica-Bold" },
  coverCenter: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  coverLineTop: { width: "80%", borderTopWidth: 2, borderTopColor: BLUE, marginBottom: 20 },
  coverLineBot: { width: "80%", borderTopWidth: 2, borderTopColor: BLUE, marginTop: 16 },
  coverLabel: { fontSize: 7, color: BLUE, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 },
  coverTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", color: NAVY, textAlign: "center", textTransform: "uppercase" },
  coverSubtitle: { fontSize: 11, color: "#1E3A8A", textAlign: "center", marginTop: 8 },
  partiesRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 28, gap: 16 },
  partyBox: { borderWidth: 1, borderColor: BLUE, backgroundColor: "#F7F9FF", borderRadius: 4, paddingHorizontal: 16, paddingVertical: 10, minWidth: 120, alignItems: "center" },
  partyLabel: { fontSize: 6.5, color: BLUE, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 },
  partyName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: NAVY, textAlign: "center" },
  arrow: { fontSize: 14, color: BLUE },
  socCibleLabel: { fontSize: 7.5, color: GRAY, textAlign: "center", marginTop: 18 },
  socCibleName: { fontSize: 10, fontFamily: "Helvetica-Bold", color: NAVY, textAlign: "center", marginTop: 3 },
  coverFooter: { borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 12, marginTop: "auto", paddingHorizontal: 60, paddingBottom: 20 },
  coverDate: { fontSize: 9, color: GRAY, textAlign: "center", marginBottom: 6 },
  coverDisclaimer: { fontSize: 6.5, color: "#aaaaaa", textAlign: "center", fontStyle: "italic" },

  // Content
  h1: { fontSize: 13, fontFamily: "Helvetica-Bold", color: NAVY, textAlign: "center", textTransform: "uppercase", marginBottom: 14, marginTop: 6, paddingBottom: 6, borderBottomWidth: 1.5, borderBottomColor: NAVY },
  h2: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: NAVY, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 22, marginBottom: 8 },
  h2underline: { borderBottomWidth: 1, borderBottomColor: NAVY, marginBottom: 8, width: "100%" },
  h3: { fontSize: 10, fontFamily: "Helvetica-Bold", color: NAVY, marginTop: 14, marginBottom: 6 },
  h3underline: { borderBottomWidth: 0.6, borderBottomColor: "#5B8DEF", marginBottom: 6, width: "40%" },
  para: { fontSize: 10, lineHeight: 1.8, color: NAVY, marginBottom: 10, textAlign: "justify" },
  paraItalic: { fontSize: 10, lineHeight: 1.8, color: NAVY, marginBottom: 10, textAlign: "justify", fontStyle: "italic" },
  bold: { fontFamily: "Helvetica-Bold" },
  italic: { fontStyle: "italic" },
  hr: { borderTopWidth: 0.5, borderTopColor: "#d1d5db", marginVertical: 12 },
  blockquote: { borderLeftWidth: 2.5, borderLeftColor: BLUE, paddingLeft: 10, marginVertical: 8, backgroundColor: "#F8F9FF" },
  blockquoteText: { fontSize: 8.5, color: "#64748b", fontStyle: "italic", lineHeight: 1.6 },
  listItem: { flexDirection: "row", marginBottom: 4, paddingLeft: 4 },
  listBullet: { fontSize: 10, color: NAVY, marginRight: 6, width: 12 },
  listText: { fontSize: 10, lineHeight: 1.75, color: NAVY, flex: 1, textAlign: "justify" },

  // Table
  table: { marginVertical: 12 },
  tableHeader: { flexDirection: "row", backgroundColor: NAVY },
  tableHeaderCell: { flex: 1, padding: 7, borderRightWidth: 0.5, borderRightColor: "#1E3A8A" },
  tableHeaderText: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "white" },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.3, borderBottomColor: "#e5e7eb" },
  tableRowAlt: { flexDirection: "row", borderBottomWidth: 0.3, borderBottomColor: "#e5e7eb", backgroundColor: "#F5F6FA" },
  tableCell: { flex: 1, padding: 6, borderRightWidth: 0.3, borderRightColor: "#e5e7eb" },
  tableCellFirst: { flex: 1, padding: 6, borderRightWidth: 0.3, borderRightColor: "#e5e7eb" },
  tableCellText: { fontSize: 8.5, color: NAVY, lineHeight: 1.5 },
  tableCellFirstText: { fontSize: 8.5, color: NAVY, lineHeight: 1.5, fontFamily: "Helvetica-Bold" },
  tableBorder: { borderWidth: 0.5, borderColor: NAVY },

  // Footer
  footer: { position: "absolute", bottom: 20, left: 65, right: 65, flexDirection: "row", justifyContent: "center", alignItems: "center", borderTopWidth: 0.3, borderTopColor: "#d1d5db", paddingTop: 5 },
  footerText: { fontSize: 7.5, color: "#9ca3af", fontStyle: "italic" },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Render inline text with **bold** and *italic* markers */
function RichText({ text, style }: { text: string; style?: Style }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <Text key={i} style={s.bold}>{part.slice(2, -2)}</Text>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <Text key={i} style={s.italic}>{part.slice(1, -1)}</Text>;
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

/** Parse markdown body into @react-pdf/renderer elements */
function parseBody(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  const k = () => String(key++);

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    // HR
    if (/^[-─═_]{3,}$/.test(trimmed)) {
      elements.push(<View key={k()} style={s.hr} />);
      i++; continue;
    }

    // H1
    if (trimmed.startsWith("# ")) {
      const txt = trimmed.slice(2).replace(/\*\*/g, "");
      elements.push(<Text key={k()} style={s.h1}>{txt}</Text>);
      i++; continue;
    }

    // H2
    if (trimmed.startsWith("## ")) {
      const txt = trimmed.slice(3).replace(/\*\*/g, "");
      elements.push(
        <View key={k()}>
          <Text style={s.h2}>{txt}</Text>
          <View style={s.h2underline} />
        </View>
      );
      i++; continue;
    }

    // H3
    if (trimmed.startsWith("### ")) {
      const txt = trimmed.slice(4).replace(/\*\*/g, "");
      elements.push(
        <View key={k()}>
          <Text style={s.h3}>{txt}</Text>
          <View style={s.h3underline} />
        </View>
      );
      i++; continue;
    }

    // Table
    if (trimmed.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const rows = tableLines
        .filter((l) => !/^\|[\s\-:|]+\|$/.test(l))
        .map((l) => l.split("|").slice(1, -1).map((c) => c.trim().replace(/\*\*/g, "")));

      if (rows.length > 0) {
        const [header, ...data] = rows;
        const col0Flex = rows[0].length === 2 ? 1.2 : 1;
        elements.push(
          <View key={k()} style={[s.table, s.tableBorder]}>
            <View style={s.tableHeader}>
              {header.map((cell, ci) => (
                <View key={ci} style={[s.tableHeaderCell, { flex: ci === 0 ? col0Flex : 1 }]}>
                  <Text style={s.tableHeaderText}>{cell}</Text>
                </View>
              ))}
            </View>
            {data.map((row, ri) => (
              <View key={ri} style={ri % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                {row.map((cell, ci) => (
                  <View key={ci} style={[s.tableCell, { flex: ci === 0 ? col0Flex : 1 }]}>
                    <Text style={ci === 0 ? s.tableCellFirstText : s.tableCellText}>{cell}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      }
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      const txt = trimmed.replace(/^>\s*\*?/, "").replace(/\*?$/, "").replace(/\*\*/g, "");
      elements.push(
        <View key={k()} style={s.blockquote}>
          <Text style={s.blockquoteText}>{txt}</Text>
        </View>
      );
      i++; continue;
    }

    // List
    if (trimmed.startsWith("- ") || /^\d+\.\s/.test(trimmed)) {
      const isNum = /^(\d+)\.\s/.exec(trimmed);
      const bullet = isNum ? `${isNum[1]}.` : "–";
      const txt = isNum ? trimmed.replace(/^\d+\.\s/, "") : trimmed.slice(2);
      elements.push(
        <View key={k()} style={s.listItem}>
          <Text style={s.listBullet}>{bullet}</Text>
          <RichText text={txt} style={s.listText} />
        </View>
      );
      i++; continue;
    }

    // Paragraph
    elements.push(<RichText key={k()} text={trimmed} style={s.para} />);
    i++;
  }

  return elements;
}

// ── PDF Document ──────────────────────────────────────────────────────────────

interface CoverData {
  doctitle: string;
  subtitle: string | null;
  cedant: string | null;
  cessionnaire: string | null;
  societe: string | null;
  date: string | null;
  disclaimer: string | null;
}

function PageFooter({ pageNum }: { pageNum: number }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>— {pageNum} —</Text>
    </View>
  );
}

function LegalDocument({
  cover,
  bodyText,
  isDeclaration,
}: {
  cover: CoverData;
  bodyText: string;
  isDeclaration: boolean;
}) {
  const content = parseBody(bodyText);

  return (
    <Document>
      {/* ── COVER PAGE ── */}
      {!isDeclaration && (
        <Page size="A4" style={s.coverPage}>
          <View style={s.coverTopBar} />
          <View style={s.coverBody}>
            {/* Logo */}
            <View style={{ flexDirection: "row", marginBottom: 20, marginTop: 10 }}>
              <Text style={[s.coverLogo, s.coverLogoB]}>Legal</Text>
              <Text style={s.coverLogo}>corners</Text>
            </View>

            {/* Title block */}
            <View style={s.coverCenter}>
              <View style={s.coverLineTop} />
              <Text style={s.coverLabel}>Document juridique</Text>
              <Text style={s.coverTitle}>{cover.doctitle}</Text>
              {cover.subtitle && <Text style={s.coverSubtitle}>{cover.subtitle}</Text>}
              <View style={s.coverLineBot} />

              {/* Parties */}
              {(cover.cedant || cover.cessionnaire) && (
                <View style={s.partiesRow}>
                  {cover.cedant && (
                    <View style={s.partyBox}>
                      <Text style={s.partyLabel}>Cédant</Text>
                      <Text style={s.partyName}>{cover.cedant}</Text>
                    </View>
                  )}
                  {cover.cedant && cover.cessionnaire && (
                    <Text style={s.arrow}>→</Text>
                  )}
                  {cover.cessionnaire && (
                    <View style={s.partyBox}>
                      <Text style={s.partyLabel}>Cessionnaire</Text>
                      <Text style={s.partyName}>{cover.cessionnaire}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Société cible */}
              {cover.societe && (
                <View style={{ marginTop: 20, alignItems: "center" }}>
                  <Text style={s.socCibleLabel}>Société cible</Text>
                  <Text style={s.socCibleName}>{cover.societe}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={s.coverFooter}>
            {cover.date && <Text style={s.coverDate}>{cover.date}</Text>}
            {cover.disclaimer && <Text style={s.coverDisclaimer}>{cover.disclaimer}</Text>}
          </View>
          <View style={s.coverBottomBar} />
        </Page>
      )}

      {/* ── CONTENT PAGES ── */}
      <Page size="A4" style={s.page}>
        {content}
        <Text
          render={({ pageNumber }) => `— ${pageNumber} —`}
          fixed
          style={{
            position: "absolute",
            bottom: 20,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 7.5,
            color: "#9ca3af",
            fontStyle: "italic",
          }}
        />
      </Page>
    </Document>
  );
}

// ── Export function ───────────────────────────────────────────────────────────

export async function generateReactPDF(
  cover: CoverData,
  bodyText: string,
  isDeclaration: boolean,
  fileName: string
) {
  const blob = await pdf(
    <LegalDocument cover={cover} bodyText={bodyText} isDeclaration={isDeclaration} />
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
