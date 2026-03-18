"use client";

import * as React from "react";
import { ChevronDown, Briefcase } from "lucide-react";

interface ExpertComptableInfoProps {
  typeCession: "actions" | "parts";
}

export function ExpertComptableInfo({ typeCession }: ExpertComptableInfoProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <Briefcase className="w-5 h-5 text-amber-600" />
          <span className="font-semibold text-amber-800">
            Besoin d&apos;un expert-comptable pour votre cession ?
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-amber-600 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 text-sm text-amber-800 space-y-3">
          <p>
            La cession de {typeCession === "actions" ? "d'actions" : "de parts sociales"} implique
            des obligations fiscales et comptables importantes. Un expert-comptable peut vous aider à :
          </p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Évaluer la valeur réelle de la société</li>
            <li>Optimiser la fiscalité de la cession (plus-value, abattements)</li>
            <li>Vérifier la cohérence des garanties d&apos;actif et de passif</li>
            <li>Établir les déclarations fiscales obligatoires</li>
          </ul>
          <p className="font-medium">
            LegalCorners peut vous mettre en relation avec un expert-comptable partenaire.
          </p>
          <a
            href="mailto:contact@legalcorners.fr"
            className="inline-block mt-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            Nous contacter
          </a>
        </div>
      )}
    </div>
  );
}
