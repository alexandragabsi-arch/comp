"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Building2,
  CreditCard,
  FileText,
  Clock,
  Check,
  Search,
  ArrowRight,
  X,
  Moon,
  ChevronRight,
  Loader2,
} from "lucide-react";

// ── Sidebar steps ─────────────────────────────────────────────────────────────
const SIDEBAR_STEPS = [
  { id: 1, label: "Projet", icon: Building2 },
  { id: 2, label: "Commande", icon: CreditCard },
  { id: 3, label: "Dossier Juridique", icon: FileText },
  { id: 4, label: "Validation", icon: Clock },
];

type Suggestion = {
  siren: string;
  nom: string;
  formeJuridique: string;
  ville: string;
};

type Company = {
  siren: string;
  nom: string;
  formeJuridique: string;
  ville: string;
};

type Procedure = "dissolution" | "mise-en-sommeil" | null;

export default function DissolutionPage() {
  const [sidebarStep] = useState(1);
  const [subStep, setSubStep] = useState<"search" | "procedure">("search");

  // Search state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const res = await fetch(
          `/api/siren?nom=${encodeURIComponent(query)}&list=1`
        );
        const data = await res.json();
        setSuggestions(data.resultats ?? []);
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectCompany(s: Suggestion) {
    setSelectedCompany(s);
    setQuery(s.nom);
    setShowDropdown(false);
    setSubStep("procedure");
  }

  function resetSearch() {
    setSubStep("search");
    setSelectedCompany(null);
    setSelectedProcedure(null);
    setQuery("");
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFF]">
      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 fixed top-0 left-0 h-full z-20">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <Link href="/">
            <Image
              src="/images/logo.svg"
              alt="LegalCorners"
              width={140}
              height={36}
            />
          </Link>
        </div>

        {/* Service title */}
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="font-semibold text-[#1E3A8A] text-sm">
            Dissolution-Liquidation
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Fermeture de société</p>
        </div>

        {/* Steps */}
        <div className="flex-1 px-6 py-6">
          <div className="space-y-1">
            {SIDEBAR_STEPS.map((s, index) => {
              const isActive = s.id === sidebarStep;
              const isCompleted = s.id < sidebarStep;
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                        isActive
                          ? "bg-[#5D9CEC] text-white"
                          : isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 text-gray-400"
                      )}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : s.id}
                    </div>
                    {index < SIDEBAR_STEPS.length - 1 && (
                      <div
                        className={cn(
                          "w-0.5 h-8 mt-1",
                          isCompleted ? "bg-green-500" : "bg-gray-200"
                        )}
                      />
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-2 pt-2 rounded-lg px-2 flex-1",
                      isActive ? "bg-blue-50 py-1" : ""
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 flex-shrink-0",
                        isActive
                          ? "text-[#5D9CEC]"
                          : isCompleted
                          ? "text-green-500"
                          : "text-gray-400"
                      )}
                    />
                    <p
                      className={cn(
                        "text-sm font-medium flex-1",
                        isActive ? "text-[#1E3A8A]" : "text-gray-400"
                      )}
                    >
                      {s.label}
                    </p>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-[#5D9CEC]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Help box */}
        <div className="p-6">
          <div className="bg-slate-50 rounded-xl p-4">
            <h3 className="font-semibold text-[#1E3A8A] mb-1 text-sm">
              Besoin d&apos;aide ?
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Notre équipe est disponible pour vous accompagner
            </p>
            <a
              href="mailto:support@legalcorners.fr"
              className="text-[#5D9CEC] text-sm font-medium"
            >
              support@legalcorners.fr
            </a>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 md:ml-72 flex items-start justify-center min-h-screen p-6 pt-16">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {/* Sub-step: Search */}
            {subStep === "search" && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <X className="w-8 h-8 text-[#5D9CEC]" strokeWidth={2.5} />
                  </div>
                </div>

                {/* Title */}
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold text-[#1E3A8A] leading-tight">
                    Dissolution, fermeture
                    <br />
                    ou mise en sommeil
                  </h1>
                  <p className="text-gray-700 font-medium">
                    Procédure amiable - Entrez le nom ou SIREN de votre société
                  </p>
                  <p className="text-sm text-gray-400">
                    Dissolution amiable uniquement. Sociétés en difficulté :
                    consultez un mandataire judiciaire.
                  </p>
                </div>

                {/* Search input with dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    {suggestionsLoading && (
                      <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                    )}
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onFocus={() =>
                        suggestions.length > 0 && setShowDropdown(true)
                      }
                      placeholder="Nom ou SIREN de la société"
                      className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-[#5D9CEC] bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5D9CEC]/30 text-base"
                    />
                  </div>

                  {/* Dropdown */}
                  {showDropdown && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                      {suggestions.map((s) => (
                        <button
                          key={s.siren}
                          onClick={() => selectCompany(s)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-100 last:border-0"
                        >
                          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-[#5D9CEC]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#1E3A8A] text-sm">
                              {s.nom}
                            </p>
                            <p className="text-xs text-gray-500">
                              {s.formeJuridique
                                ? `${s.formeJuridique} • `
                                : ""}
                              SIREN {s.siren}
                            </p>
                            {s.ville && (
                              <p className="text-xs text-gray-400">{s.ville}</p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Sub-step: Procedure selection */}
            {subStep === "procedure" && selectedCompany && (
              <motion.div
                key="procedure"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Company card */}
                <div className="bg-white rounded-xl border-2 border-[#5D9CEC] p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#5D9CEC] flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#1E3A8A]">
                      {selectedCompany.nom}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedCompany.formeJuridique
                        ? `${selectedCompany.formeJuridique} • `
                        : ""}
                      {selectedCompany.siren}
                    </p>
                  </div>
                  <button
                    onClick={resetSearch}
                    className="text-[#5D9CEC] text-sm font-medium hover:underline flex-shrink-0"
                  >
                    Modifier
                  </button>
                </div>

                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-[#5D9CEC]" />
                  </div>
                </div>

                {/* Title */}
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-bold text-[#1E3A8A]">
                    Quelle procédure souhaitez-vous ?
                  </h2>
                  <p className="text-gray-500">
                    Sélectionnez la démarche adaptée à votre situation
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedProcedure("dissolution")}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                      selectedProcedure === "dissolution"
                        ? "border-[#5D9CEC] bg-blue-50"
                        : "border-gray-200 bg-white hover:border-[#5D9CEC]/50"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                      <X className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#1E3A8A]">
                        Dissolution-Liquidation
                      </p>
                      <p className="text-sm text-gray-500">
                        Fermeture définitive de la société (dissolution +
                        liquidation)
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </button>

                  <button
                    onClick={() => setSelectedProcedure("mise-en-sommeil")}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                      selectedProcedure === "mise-en-sommeil"
                        ? "border-[#5D9CEC] bg-blue-50"
                        : "border-gray-200 bg-white hover:border-[#5D9CEC]/50"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <Moon className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#1E3A8A]">
                        Mise en sommeil
                      </p>
                      <p className="text-sm text-gray-500">
                        Cessation temporaire d&apos;activité (max 2 ans)
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </button>
                </div>

                {/* Back */}
                <div className="text-center">
                  <button
                    onClick={resetSearch}
                    className="text-gray-500 text-sm hover:text-[#1E3A8A] transition-colors"
                  >
                    ← Retour
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
