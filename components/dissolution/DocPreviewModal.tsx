"use client";

import { useState, useRef } from "react";
import { X, Download, FileText, Pencil, Loader2, ExternalLink, Printer } from "lucide-react";

interface Props {
  title: string;
  /** appelle l'API pour obtenir le blob DOCX */
  onDownloadWord: () => Promise<void>;
  /** appelle l'API preview pour obtenir le HTML */
  onFetchHtml: () => Promise<string>;
  /** ouvre Yousign */
  onSign?: () => Promise<void>;
  /** retour édition */
  onEdit: () => void;
  onClose: () => void;
}

export default function DocPreviewModal({
  title,
  onDownloadWord,
  onFetchHtml,
  onSign,
  onEdit,
  onClose,
}: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingWord, setLoadingWord] = useState(false);
  const [loadingSign, setLoadingSign] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Charge le HTML dès le montage
  useState(() => {
    onFetchHtml()
      .then((h) => setHtml(h))
      .catch(() => setHtml("<p>Erreur lors du chargement du document.</p>"))
      .finally(() => setLoading(false));
  });

  function handlePrint() {
    const win = iframeRef.current?.contentWindow;
    if (win) {
      win.focus();
      win.print();
    }
  }

  async function handleWord() {
    setLoadingWord(true);
    try { await onDownloadWord(); } finally { setLoadingWord(false); }
  }

  async function handleSign() {
    if (!onSign) return;
    setLoadingSign(true);
    try { await onSign(); } finally { setLoadingSign(false); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-gray-900/90 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#1E3A8A] text-white flex-shrink-0">
        <p className="flex-1 text-sm font-semibold truncate">{title}</p>

        {/* Modifier */}
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Modifier
        </button>

        {/* Word */}
        <button
          onClick={handleWord}
          disabled={loadingWord}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 text-[#1E3A8A] hover:bg-blue-200 text-xs font-medium transition-colors"
        >
          {loadingWord ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
          Word (.docx)
        </button>

        {/* PDF via impression */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          PDF
        </button>

        {/* Signer */}
        {onSign && (
          <button
            onClick={handleSign}
            disabled={loadingSign}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition-colors"
          >
            {loadingSign ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ExternalLink className="w-3.5 h-3.5" />
            )}
            Signer en ligne
          </button>
        )}

        {/* Fermer */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Corps / A4 preview ── */}
      <div className="flex-1 overflow-auto bg-gray-300 flex justify-center py-6 px-4">
        {loading ? (
          <div className="flex items-center gap-3 text-white mt-20">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Chargement du document…</span>
          </div>
        ) : (
          <div
            className="w-full bg-white shadow-2xl"
            style={{
              maxWidth: "21cm",
              minHeight: "29.7cm",
            }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={html ?? ""}
              className="w-full border-none"
              style={{ height: "calc(29.7cm + 100px)", minHeight: "800px" }}
              title={title}
            />
          </div>
        )}
      </div>

      {/* ── Footer download strip ── */}
      {!loading && (
        <div className="flex items-center justify-center gap-3 px-4 py-3 bg-[#1E3A8A]/95 text-white text-xs border-t border-white/10">
          <Download className="w-3.5 h-3.5 opacity-60" />
          <span className="opacity-70">Cliquez sur</span>
          <span className="bg-white/20 px-2 py-0.5 rounded">Word (.docx)</span>
          <span className="opacity-70">pour télécharger ou</span>
          <span className="bg-white/20 px-2 py-0.5 rounded">PDF</span>
          <span className="opacity-70">pour imprimer/exporter en PDF</span>
        </div>
      )}
    </div>
  );
}
