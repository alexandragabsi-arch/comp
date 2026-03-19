"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Download, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StatutsUpdaterProps {
  cessionData: {
    nomCedant: string;
    nomCessionnaire: string;
    nbParts: string;
    prixTotal: string;
    date: string;
    ville: string;
    formeJuridique: string;
    denomination: string;
    capitalTotal: string;
    nbTitresTotal: string;
    includChangementDirigeant: boolean;
    nouveauDirigeantCivilite?: string;
    nouveauDirigeantNom?: string;
    nouveauDirigeantPrenom?: string;
    nouveauDirigeantFonction?: string;
    ancienDirigeantNom?: string;
  };
}

/** Parse [MODIFIÉ]...[/MODIFIÉ] markers and return segments */
function parseDiff(text: string): Array<{ type: "unchanged" | "modified"; content: string }> {
  const segments: Array<{ type: "unchanged" | "modified"; content: string }> = [];
  const regex = /\[MODIFIÉ\]([\s\S]*?)\[\/MODIFIÉ\]/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "unchanged", content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "modified", content: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: "unchanged", content: text.slice(lastIndex) });
  }
  return segments;
}

/** Strip diff markers to get clean text */
function stripMarkers(text: string): string {
  return text.replace(/\[MODIFIÉ\]/g, "").replace(/\[\/MODIFIÉ\]/g, "");
}

export function StatutsUpdater({ cessionData }: StatutsUpdaterProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [statutsText, setStatutsText] = useState<string | null>(null);
  const [updatedText, setUpdatedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".docx")) {
      setError("Seuls les fichiers .docx sont acceptés.");
      return;
    }
    setFileName(file.name);
    setError(null);
    setUpdatedText(null);

    try {
      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      setStatutsText(result.value);
    } catch {
      setError("Impossible de lire le fichier DOCX.");
    }
  };

  const handleUpdate = async () => {
    if (!statutsText) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/update-statuts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statutsText, cessionData }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();
      setUpdatedText(data.updatedText);
    } catch {
      setError("Erreur lors de la mise à jour. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!updatedText) return;
    const clean = stripMarkers(updatedText);
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");

    const lines = clean.split("\n");
    const children = lines.map((line) => {
      const t = line.trim();
      if (/^ARTICLE\s+\d+/i.test(t) || /^TITRE\s+/i.test(t)) {
        return new Paragraph({ text: t, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } });
      }
      if (/^STATUTS|^MISE À JOUR/i.test(t)) {
        return new Paragraph({ text: t, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } });
      }
      return new Paragraph({
        children: [new TextRun({ text: t, size: 22, font: "Times New Roman" })],
        spacing: { after: 120 },
      });
    });

    const doc = new Document({
      sections: [{ properties: {}, children }],
    });

    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([new Uint8Array(buffer)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Statuts-mis-a-jour-${cessionData.denomination || "societe"}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (!updatedText) return;
    const clean = stripMarkers(updatedText);
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const ML = 20, MR = 20, MT = 20, MB = 20;
    const PW = 210, PH = 297;
    const CW = PW - ML - MR;
    const NAVY: [number, number, number] = [13, 36, 89];

    let y = MT;
    let pageNum = 1;

    const addFooter = () => {
      doc.setFont("times", "italic");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`— ${pageNum} —`, PW / 2, PH - MB + 8, { align: "center" });
    };

    const ensureSpace = (h: number) => {
      if (y + h > PH - MB) {
        addFooter();
        doc.addPage();
        pageNum++;
        y = MT;
      }
    };

    const lines = clean.split("\n");
    for (const line of lines) {
      const t = line.trim();
      if (!t) { y += 2; continue; }

      if (/^ARTICLE\s+\d+/i.test(t) || /^TITRE\s+/i.test(t)) {
        const lns = doc.splitTextToSize(t, CW);
        ensureSpace(lns.length * 6 + 8);
        y += 4;
        doc.setFont("times", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...NAVY);
        doc.text(lns, ML, y);
        y += lns.length * 6 + 2;
        doc.setDrawColor(180, 190, 220);
        doc.setLineWidth(0.3);
        doc.line(ML, y, PW - MR, y);
        y += 3;
      } else if (/^STATUTS|^MISE À JOUR/i.test(t)) {
        const lns = doc.splitTextToSize(t.toUpperCase(), CW);
        ensureSpace(lns.length * 8 + 12);
        y += 6;
        doc.setFont("times", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...NAVY);
        doc.text(lns, PW / 2, y, { align: "center" });
        y += lns.length * 8 + 4;
      } else {
        const lns = doc.splitTextToSize(t, CW);
        const h = lns.length * 5.5;
        ensureSpace(h + 3);
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        doc.text(lns, ML, y, { align: "justify", maxWidth: CW });
        y += h + 3;
      }
    }
    addFooter();
    doc.save(`Statuts-mis-a-jour-${cessionData.denomination || "societe"}.pdf`);
  };

  const segments = updatedText ? parseDiff(updatedText) : null;
  const modifiedCount = segments?.filter((s) => s.type === "modified").length ?? 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-[#1E3A8A]" />
        <h3 className="font-semibold text-[#1E3A8A]">Mise à jour des statuts</h3>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">DOCX uniquement</span>
      </div>

      {/* Upload zone */}
      {!statutsText && (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#1E3A8A]/50 hover:bg-blue-50/30 transition-all"
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">Déposez vos statuts actuels (.docx)</p>
          <p className="text-xs text-gray-400 mt-1">ou cliquez pour sélectionner</p>
          <input
            ref={inputRef}
            type="file"
            accept=".docx"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Fichier chargé */}
      {statutsText && !updatedText && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800 truncate">{fileName}</p>
              <p className="text-xs text-green-600">{statutsText.length.toLocaleString()} caractères extraits</p>
            </div>
            <button
              onClick={() => { setStatutsText(null); setFileName(null); }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Changer
            </button>
          </div>

          <Button
            onClick={handleUpdate}
            disabled={loading}
            className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Mise à jour en cours…</>
            ) : (
              <><FileText className="w-4 h-4" /> Mettre à jour les statuts</>
            )}
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Résultat + Diff */}
      {updatedText && segments && (
        <div className="space-y-4">
          {/* Badge résumé */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                {modifiedCount} passage{modifiedCount > 1 ? "s" : ""} modifié{modifiedCount > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleDownloadDocx} className="gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" /> Word (.docx)
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownloadPdf} className="gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" /> PDF
              </Button>
            </div>
          </div>

          {/* Diff viewer */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600">Aperçu des modifications</span>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                passages surlignés = modifiés
              </span>
            </div>
            <div
              className="p-4 max-h-96 overflow-y-auto text-xs font-mono leading-relaxed whitespace-pre-wrap"
              style={{ fontFamily: "Times New Roman, serif", fontSize: "11px", lineHeight: "1.7" }}
            >
              {segments.map((seg, i) =>
                seg.type === "modified" ? (
                  <mark key={i} className="bg-yellow-100 border-l-2 border-yellow-400 pl-1 rounded-sm">
                    {seg.content}
                  </mark>
                ) : (
                  <span key={i} className="text-gray-700">{seg.content}</span>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
