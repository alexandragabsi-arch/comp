"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TooltipHelpProps {
  title: string;
  content: string;
  className?: string;
}

export function TooltipHelp({ title, content, className }: TooltipHelpProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="text-gray-400 hover:text-[#1E3A8A] transition-colors"
        aria-label={title}
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute z-50 left-6 top-0 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-sm">
          <p className="font-semibold text-[#1E3A8A] mb-1">{title}</p>
          <p className="text-gray-600 leading-relaxed">{content}</p>
        </div>
      )}
    </div>
  );
}

export const TOOLTIPS = {
  typeCession: {
    title: "Type de cession",
    content: "Les parts sociales concernent les SARL/SCI, les actions concernent les SAS/SA/SASU.",
  },
  regimeMatrimonial: {
    title: "Régime matrimonial",
    content: "Le régime matrimonial détermine si le conjoint doit intervenir à la cession. En communauté, le conjoint doit consentir à la vente de biens communs.",
  },
  prixParPart: {
    title: "Prix par part",
    content: "Le prix par part est calculé en divisant le prix total par le nombre de parts cédées. Il sert de base pour le calcul des droits d'enregistrement.",
  },
  agrement: {
    title: "Agrément",
    content: "La procédure d'agrément permet aux associés de contrôler l'entrée de nouveaux associés. Elle est obligatoire dans de nombreuses SARL.",
  },
  nonConcurrence: {
    title: "Clause de non-concurrence",
    content: "Interdit au cédant d'exercer une activité concurrente pendant une durée et dans un périmètre définis. Doit être limitée dans le temps et l'espace pour être valide.",
  },
  comptesCourants: {
    title: "Comptes courants d'associés",
    content: "Les comptes courants d'associés sont des sommes prêtées par les associés à la société. Ils peuvent être cédés avec les parts ou conservés par le cédant.",
  },
  garantieActifPassif: {
    title: "Garantie d'actif et de passif",
    content: "La GAP protège l'acquéreur contre des dettes ou passifs cachés existants avant la cession mais découverts après. C'est une garantie essentielle dans toute cession.",
  },
  fraisCharge: {
    title: "Frais et charges",
    content: "Les droits d'enregistrement sont à la charge de l'acquéreur par défaut (3% pour les parts sociales, 0,1% pour les actions). Ils peuvent être partagés.",
  },
};
