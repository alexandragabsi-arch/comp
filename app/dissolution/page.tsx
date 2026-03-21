"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  Users,
  User,
  AlertTriangle,
  Scale,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react";

// ── Sidebar steps ─────────────────────────────────────────────────────────────
const SIDEBAR_STEPS = [
  { id: 1, label: "Projet", icon: Building2 },
  { id: 2, label: "Commande", icon: CreditCard },
  { id: 3, label: "Dossier Juridique", icon: FileText },
  { id: 4, label: "Validation", icon: Clock },
];

// ── Questions dissolution ──────────────────────────────────────────────────────
// Retourne le titre du dirigeant selon la forme juridique
function getDirigeantLabel(formeJuridique: string): string {
  const fj = formeJuridique.toUpperCase();
  if (fj.includes("SAS") || fj.includes("SASU") || fj.includes("SA")) return "président";
  return "gérant";
}

function getQuestionsDissoltion(formeJuridique: string) {
  const dirigeant = getDirigeantLabel(formeJuridique);
  const dirigeantCap = dirigeant.charAt(0).toUpperCase() + dirigeant.slice(1);
  return [
    {
      id: "decision",
      question: "Qui prend la décision de dissoudre la société ?",
      subtitle: "Cela détermine le type de procès-verbal à rédiger",
      options: [
        {
          value: "associe_unique",
          label: "Associé unique",
          description: "Je suis le seul associé de la société",
          icon: User,
        },
        {
          value: "age",
          label: "Plusieurs associés (AGE)",
          description: "La décision est prise en assemblée générale extraordinaire",
          icon: Users,
        },
      ],
    },
    {
      id: "actifs",
      question: "La société a-t-elle encore des actifs ou des dettes ?",
      subtitle: "Hors dissolution amiable si des dettes existent",
      options: [
        {
          value: "non",
          label: "Non, la société est vide",
          description: "Aucun actif, aucune dette en cours",
          icon: Check,
        },
        {
          value: "oui",
          label: "Oui, il y a des actifs",
          description: "La liquidation devra répartir les actifs entre associés",
          icon: AlertTriangle,
        },
      ],
    },
    {
      id: "liquidateur",
      question: "Qui souhaitez-vous nommer liquidateur ?",
      subtitle: "Le liquidateur gère les opérations de clôture",
      options: [
        {
          value: "dirigeant",
          label: `Le ${dirigeant} actuel`,
          description: `Le ${dirigeant} qui dirige actuellement la société`,
          icon: User,
        },
        {
          value: "autre",
          label: "Une autre personne",
          description: "Un tiers désigné pour liquider la société",
          icon: Scale,
        },
      ],
    },
  ];
}

const QUESTIONS_SOMMEIL = [
  {
    id: "inactivite",
    question: "Depuis combien de temps la société est-elle inactive ?",
    subtitle: "La mise en sommeil est limitée à 2 ans maximum",
    options: [
      {
        value: "moins2",
        label: "Moins de 2 ans",
        description: "La mise en sommeil est encore possible",
        icon: Clock,
      },
      {
        value: "plus2",
        label: "Plus de 2 ans",
        description: "Attention : la dissolution-liquidation est recommandée",
        icon: AlertTriangle,
      },
    ],
  },
  {
    id: "reprise",
    question: "Avez-vous un projet de reprise d'activité ?",
    subtitle: "La mise en sommeil est une cessation temporaire",
    options: [
      {
        value: "oui",
        label: "Oui, dans les 2 ans",
        description: "Je compte reprendre l'activité prochainement",
        icon: Zap,
      },
      {
        value: "non",
        label: "Non, pas de projet",
        description: "La dissolution-liquidation serait peut-être plus adaptée",
        icon: X,
      },
    ],
  },
];

// ── Pricing plans ─────────────────────────────────────────────────────────────
type PlanFeature = { label: string; included: boolean | "partial" };
type Plan = {
  id: string; name: string; priceHT: number; badge?: string; featured?: boolean;
  features: PlanFeature[]; cta: string;
};

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceHT: 79,
    features: [
      { label: "Documents juridiques générés", included: true },
      { label: "Formulaire M2 pré-rempli", included: true },
      { label: "Vérification par un formaliste", included: false },
      { label: "Envoi dossier au greffe", included: false },
      { label: "Accompagnement expert", included: false },
    ],
    cta: "Choisir Starter",
  },
  {
    id: "standard",
    name: "Standard",
    priceHT: 199,
    featured: true,
    badge: "Le plus choisi",
    features: [
      { label: "Documents juridiques générés", included: true },
      { label: "Formulaire M2 pré-rempli", included: true },
      { label: "Vérification par un formaliste", included: true },
      { label: "Envoi dossier au greffe", included: true },
      { label: "Accompagnement expert", included: "partial" },
    ],
    cta: "Choisir Standard",
  },
  {
    id: "premium",
    name: "Premium",
    priceHT: 249,
    features: [
      { label: "Documents juridiques générés", included: true },
      { label: "Formulaire M2 pré-rempli", included: true },
      { label: "Vérification par un formaliste", included: true },
      { label: "Envoi dossier au greffe", included: true },
      { label: "Accompagnement expert illimité", included: true },
    ],
    cta: "Choisir Premium",
  },
];

type Suggestion = { siren: string; nom: string; formeJuridique: string; ville: string };
type Company = { siren: string; nom: string; formeJuridique: string; ville: string };
type Procedure = "dissolution" | "mise-en-sommeil" | null;
type SubStep = "search" | "procedure" | "intro" | "questions" | "etapes" | "commande";

// ── Frais annexes par procédure ───────────────────────────────────────────────
const FRAIS_DISSOLUTION = [
  { label: "Frais de dissolution au greffe", montant: 196.01 },
  { label: "Annonce légale de dissolution", montant: 152 },
  { label: "Annonce légale de liquidation", montant: 110 },
  { label: "Frais de liquidation au greffe", montant: 13.93 },
  { label: "Frais d'obtention Kbis", montant: 3.2 },
];
const FRAIS_SOMMEIL = [
  { label: "Frais d'enregistrement au greffe", montant: 184.57 },
];

function getPlanLabel(id: string) {
  if (id === "starter") return { name: "Starter", priceHT: 79 };
  if (id === "standard") return { name: "Standard", priceHT: 199 };
  if (id === "premium") return { name: "Premium", priceHT: 249 };
  if (id === "sommeil") return { name: "Mise en sommeil", priceHT: 99 };
  return { name: id, priceHT: 0 };
}

function PaymentSuccessPage() {
  const params = useSearchParams();
  const formule = params.get("formule") ?? "";
  const stateRaw = params.get("state") ?? "";

  let procedure: string = "dissolution";
  let company: Company | null = null;
  try {
    const parsed = JSON.parse(atob(stateRaw));
    procedure = parsed.procedure ?? "dissolution";
    company = parsed.company ?? null;
  } catch { /* ignore */ }

  const plan = getPlanLabel(formule);
  const frais = procedure === "mise-en-sommeil" ? FRAIS_SOMMEIL : FRAIS_DISSOLUTION;
  const totalFraisHT = frais.reduce((s, f) => s + f.montant, 0);
  const totalHT = plan.priceHT + totalFraisHT;
  const tva = totalHT * 0.2;
  const totalTTC = totalHT + tva;

  return (
    <div className="min-h-screen flex bg-white">
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 fixed top-0 left-0 h-full z-20">
        <div className="p-6 border-b border-gray-100">
          <Link href="/"><Image src="/images/logo.svg" alt="LegalCorners" width={140} height={36} /></Link>
        </div>
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="font-semibold text-[#1E3A8A] text-sm">
            {procedure === "mise-en-sommeil" ? "Mise en sommeil" : "Dissolution-Liquidation"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Fermeture de société</p>
        </div>
        <div className="flex-1 px-6 py-6">
          <div className="space-y-1">
            {SIDEBAR_STEPS.map((s, index) => {
              const isActive = s.id === 3;
              const isCompleted = s.id <= 2;
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
                      isActive ? "bg-[#5D9CEC] text-white" : isCompleted ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                    )}>
                      {isCompleted ? <Check className="w-5 h-5" /> : s.id}
                    </div>
                    {index < SIDEBAR_STEPS.length - 1 && (
                      <div className={cn("w-0.5 h-8 mt-1", isCompleted ? "bg-green-500" : "bg-gray-200")} />
                    )}
                  </div>
                  <div className={cn("flex items-center gap-2 pt-2 rounded-lg px-2 flex-1", isActive ? "bg-blue-50 py-1" : "")}>
                    <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-[#5D9CEC]" : isCompleted ? "text-green-500" : "text-gray-400")} />
                    <p className={cn("text-sm font-medium flex-1", isActive ? "text-[#1E3A8A]" : "text-gray-400")}>{s.label}</p>
                    {isActive && <ChevronRight className="w-4 h-4 text-[#5D9CEC]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-6">
          <div className="bg-slate-50 rounded-xl p-4">
            <h3 className="font-semibold text-[#1E3A8A] mb-1 text-sm">Besoin d&apos;aide ?</h3>
            <p className="text-xs text-gray-500 mb-3">Notre équipe est disponible pour vous accompagner</p>
            <a href="mailto:support@legalcorners.fr" className="text-[#5D9CEC] text-sm font-medium">support@legalcorners.fr</a>
          </div>
        </div>
      </aside>

      <main className="flex-1 md:ml-72 p-6 pt-16">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1E3A8A]">Paiement confirmé</h1>
              <p className="text-sm text-gray-500">Votre commande a bien été enregistrée</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 items-start">
            {/* Left: détail commande */}
            <div className="md:col-span-2 space-y-4">
              {/* Société */}
              {company && (
                <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#5D9CEC] flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-[#1E3A8A] text-sm">{company.nom}</p>
                    <p className="text-xs text-gray-500">{company.formeJuridique} • {company.siren}</p>
                  </div>
                </div>
              )}

              {/* Pack choisi */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-[#1E3A8A]">
                    {procedure === "mise-en-sommeil" ? "Mise en sommeil" : "Dissolution-Liquidation"}
                  </h2>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#5D9CEC]" />
                    <span className="text-sm font-medium text-gray-700">Pack {plan.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#1E3A8A]">{plan.priceHT} €</span>
                </div>
              </div>

              {/* Frais annexes */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h2 className="font-bold text-[#1E3A8A] text-sm">Frais légaux obligatoires</h2>
                  <span className="text-xs text-gray-400">(payables lors de la validation)</span>
                </div>
                <div className="space-y-2">
                  {frais.map((f) => (
                    <div key={f.label} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{f.label}</span>
                      <span className="text-sm text-gray-700 font-medium">{f.montant.toFixed(2).replace(".", ",")} €</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm font-semibold text-gray-700">Total frais légaux</span>
                    <span className="text-sm font-semibold text-gray-700">{totalFraisHT.toFixed(2).replace(".", ",")} €</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: récapitulatif */}
            <div className="bg-slate-50 rounded-xl p-5 space-y-3 sticky top-6">
              <h2 className="font-bold text-[#1E3A8A]">Récapitulatif</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Total commande HT</span>
                  <span className="font-medium">{totalHT.toFixed(2).replace(".", ",")} €</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>TVA (20%)</span>
                  <span>{tva.toFixed(2).replace(".", ",")} €</span>
                </div>
                <div className="flex justify-between font-bold text-[#1E3A8A] pt-2 border-t border-gray-200">
                  <span>Total TTC</span>
                  <span>{totalTTC.toFixed(2).replace(".", ",")} €</span>
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700">
                💡 Les frais légaux sont payables lors de la validation de votre dossier.
              </div>

              <Link
                href="/dissolution"
                className="block w-full py-3 bg-[#5D9CEC] hover:bg-[#4a8bd4] text-white font-semibold rounded-xl text-center text-sm transition-all"
              >
                Continuer → Dossier juridique
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DissolutionForm() {
  const [sidebarStep, setSidebarStep] = useState(1);
  const [subStep, setSubStep] = useState<SubStep>("search");

  // Search
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Procedure + questions
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Payment
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const questions =
    selectedProcedure === "dissolution"
      ? getQuestionsDissoltion(selectedCompany?.formeJuridique ?? "")
      : QUESTIONS_SOMMEIL;

  // Fetch suggestions
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
        const res = await fetch(`/api/siren?nom=${encodeURIComponent(query)}&list=1`);
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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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
    setCurrentQuestion(0);
    setAnswers({});
    setQuery("");
    setSidebarStep(1);
  }

  function selectProcedure(p: Procedure) {
    setSelectedProcedure(p);
    setCurrentQuestion(0);
    setAnswers({});
    setSubStep("intro");
  }

  function answerQuestion(questionId: string, value: string) {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setSubStep("etapes");
    }
  }

  async function handlePayment(planId: string) {
    setPaymentLoading(planId);
    try {
      const stateKey = btoa(
        JSON.stringify({ company: selectedCompany, procedure: selectedProcedure, answers })
      );
      const res = await fetch("/api/stripe/checkout-dissolution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formule: planId, stateKey }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setPaymentLoading(null);
    }
  }

  // Company card (reused across steps)
  const CompanyCard = () =>
    selectedCompany ? (
      <div className="bg-white rounded-xl border-2 border-[#5D9CEC] p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#5D9CEC] flex items-center justify-center flex-shrink-0">
          <Check className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#1E3A8A]">{selectedCompany.nom}</p>
          <p className="text-sm text-gray-500">
            {selectedCompany.formeJuridique ? `${selectedCompany.formeJuridique} • ` : ""}
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
    ) : null;

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 fixed top-0 left-0 h-full z-20">
        <div className="p-6 border-b border-gray-100">
          <Link href="/">
            <Image src="/images/logo.svg" alt="LegalCorners" width={140} height={36} />
          </Link>
        </div>

        <div className="px-6 py-4 border-b border-gray-100">
          <p className="font-semibold text-[#1E3A8A] text-sm">Dissolution-Liquidation</p>
          <p className="text-xs text-gray-500 mt-0.5">Fermeture de société</p>
        </div>

        <div className="flex-1 px-6 py-6">
          <div className="space-y-1">
            {SIDEBAR_STEPS.map((s, index) => {
              const isActive = s.id === sidebarStep;
              const isCompleted = s.id < sidebarStep;
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                      isActive ? "bg-[#5D9CEC] text-white" :
                      isCompleted ? "bg-green-500 text-white" :
                      "bg-gray-100 text-gray-400"
                    )}>
                      {isCompleted ? <Check className="w-5 h-5" /> : s.id}
                    </div>
                    {index < SIDEBAR_STEPS.length - 1 && (
                      <div className={cn("w-0.5 h-8 mt-1", isCompleted ? "bg-green-500" : "bg-gray-200")} />
                    )}
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 pt-2 rounded-lg px-2 flex-1",
                    isActive ? "bg-blue-50 py-1" : ""
                  )}>
                    <Icon className={cn(
                      "w-4 h-4 flex-shrink-0",
                      isActive ? "text-[#5D9CEC]" : isCompleted ? "text-green-500" : "text-gray-400"
                    )} />
                    <p className={cn(
                      "text-sm font-medium flex-1",
                      isActive ? "text-[#1E3A8A]" : "text-gray-400"
                    )}>
                      {s.label}
                    </p>
                    {isActive && <ChevronRight className="w-4 h-4 text-[#5D9CEC]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          <div className="bg-slate-50 rounded-xl p-4">
            <h3 className="font-semibold text-[#1E3A8A] mb-1 text-sm">Besoin d&apos;aide ?</h3>
            <p className="text-xs text-gray-500 mb-3">
              Notre équipe est disponible pour vous accompagner
            </p>
            <a href="mailto:support@legalcorners.fr" className="text-[#5D9CEC] text-sm font-medium">
              support@legalcorners.fr
            </a>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 md:ml-72 flex items-start justify-center min-h-screen p-6 pt-16">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">

            {/* ── Search ── */}
            {subStep === "search" && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <X className="w-8 h-8 text-[#5D9CEC]" strokeWidth={2.5} />
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold text-[#1E3A8A] leading-tight">
                    Dissolution, fermeture<br />ou mise en sommeil
                  </h1>
                  <p className="text-gray-700 font-medium">
                    Procédure amiable — Entrez le nom ou SIREN de votre société
                  </p>
                  <p className="text-sm text-gray-400">
                    Dissolution amiable uniquement. Sociétés en difficulté : consultez un mandataire judiciaire.
                  </p>
                </div>

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
                      onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                      placeholder="Nom ou SIREN de la société"
                      className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-[#5D9CEC] bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5D9CEC]/30 text-base"
                    />
                  </div>

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
                            <p className="font-semibold text-[#1E3A8A] text-sm">{s.nom}</p>
                            <p className="text-xs text-gray-500">
                              {s.formeJuridique ? `${s.formeJuridique} • ` : ""}SIREN {s.siren}
                            </p>
                            {s.ville && <p className="text-xs text-gray-400">{s.ville}</p>}
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Procedure selection ── */}
            {subStep === "procedure" && selectedCompany && (
              <motion.div
                key="procedure"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <CompanyCard />

                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-[#5D9CEC]" />
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-bold text-[#1E3A8A]">
                    Quelle procédure souhaitez-vous ?
                  </h2>
                  <p className="text-gray-500">
                    Sélectionnez la démarche adaptée à votre situation
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => selectProcedure("dissolution")}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-[#5D9CEC]/50 text-left transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                      <X className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#1E3A8A]">Dissolution-Liquidation</p>
                      <p className="text-sm text-gray-500">
                        Fermeture définitive de la société (dissolution + liquidation)
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </button>

                  <button
                    onClick={() => selectProcedure("mise-en-sommeil")}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-[#5D9CEC]/50 text-left transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <Moon className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#1E3A8A]">Mise en sommeil</p>
                      <p className="text-sm text-gray-500">
                        Cessation temporaire d&apos;activité (max 2 ans)
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </button>
                </div>

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

            {/* ── Intro ── */}
            {subStep === "intro" && selectedProcedure && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <CompanyCard />

                <h1 className="text-3xl font-bold text-[#1E3A8A] text-center leading-tight">
                  Quelques informations avant de{" "}
                  <span className="text-[#F97316]">
                    {selectedProcedure === "dissolution"
                      ? "fermer votre société"
                      : "mettre en sommeil votre société"}
                  </span>
                </h1>

                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                        <Clock className="w-7 h-7 text-[#5D9CEC]" />
                      </div>
                    </div>
                    <p className="font-bold text-[#1E3A8A] text-sm">
                      Combien de temps dure le questionnaire ?
                    </p>
                    <p className="text-xs text-gray-500">
                      Les utilisateurs le remplissent en moyenne en 5 à 10 minutes.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                        <Users className="w-7 h-7 text-[#5D9CEC]" />
                      </div>
                    </div>
                    <p className="font-bold text-[#1E3A8A] text-sm">
                      Vous avez besoin d&apos;aide ?
                    </p>
                    <p className="text-xs text-gray-500">
                      Nos experts sont là pour vous aider par email ou téléphone.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                        <Shield className="w-7 h-7 text-[#5D9CEC]" />
                      </div>
                    </div>
                    <p className="font-bold text-[#1E3A8A] text-sm">
                      On s&apos;occupe de tout pour vous !
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedProcedure === "dissolution"
                        ? "Dissolution, liquidation et radiation en toute sérénité."
                        : "Déclaration de cessation et enregistrement au greffe."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-center">
                  <button
                    onClick={() => setSubStep("questions")}
                    className="w-full py-4 bg-[#5D9CEC] hover:bg-[#4a8bd4] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-base"
                  >
                    {selectedProcedure === "dissolution"
                      ? "Dissoudre et radier ma société"
                      : "Mettre ma société en sommeil"}
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <button
                    onClick={resetSearch}
                    className="text-gray-400 text-sm hover:text-[#1E3A8A] transition-colors"
                  >
                    ← Retour
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Questions ── */}
            {subStep === "questions" && (
              <motion.div
                key={`question-${currentQuestion}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                <CompanyCard />

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Question {currentQuestion + 1} sur {questions.length}</span>
                    <span>{Math.round(((currentQuestion) / questions.length) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#5D9CEC] rounded-full transition-all duration-500"
                      style={{ width: `${(currentQuestion / questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-bold text-[#1E3A8A]">
                    {questions[currentQuestion].question}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {questions[currentQuestion].subtitle}
                  </p>
                </div>

                <div className="space-y-3">
                  {questions[currentQuestion].options.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => answerQuestion(questions[currentQuestion].id, opt.value)}
                        className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-gray-200 bg-white hover:border-[#5D9CEC] hover:bg-blue-50 text-left transition-all group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-[#5D9CEC]/20 flex items-center justify-center flex-shrink-0 transition-colors">
                          <Icon className="w-6 h-6 text-[#5D9CEC]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-[#1E3A8A]">{opt.label}</p>
                          <p className="text-sm text-gray-500">{opt.description}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#5D9CEC] flex-shrink-0 transition-colors" />
                      </button>
                    );
                  })}
                </div>

                <div className="text-center">
                  <button
                    onClick={() => {
                      if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
                      else setSubStep("procedure");
                    }}
                    className="text-gray-500 text-sm hover:text-[#1E3A8A] transition-colors"
                  >
                    ← Retour
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Étapes suivantes ── */}
            {subStep === "etapes" && (
              <motion.div
                key="etapes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <CompanyCard />

                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-2">
                    <Check className="w-4 h-4" />
                    Votre projet est prêt
                  </div>
                  <h2 className="text-2xl font-bold text-[#1E3A8A]">
                    Voici les prochaines étapes
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {selectedProcedure === "dissolution"
                      ? "Votre dossier de dissolution-liquidation avance bien."
                      : "Votre mise en sommeil est en bonne voie."}
                  </p>
                </div>

                <div className="relative">
                  {/* connecting line */}
                  <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-100 mx-12 hidden sm:block" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center relative">
                    {[
                      { num: 1, label: "Votre projet", sub: "Informations collectées", done: true },
                      { num: 2, label: "Commande", sub: "Choisissez votre formule" },
                      { num: 3, label: "Dossier juridique", sub: "Documents & compléments" },
                      { num: 4, label: "Validation", sub: "Envoi au greffe" },
                    ].map((e) => (
                      <div key={e.num} className="flex flex-col items-center gap-2">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold relative z-10",
                          e.done
                            ? "bg-green-500 text-white"
                            : e.num === 2
                            ? "bg-[#5D9CEC] text-white ring-4 ring-[#5D9CEC]/20"
                            : "bg-gray-100 text-gray-400"
                        )}>
                          {e.done ? <Check className="w-5 h-5" /> : e.num}
                        </div>
                        <p className={cn(
                          "text-sm font-semibold",
                          e.done ? "text-green-600" : e.num === 2 ? "text-[#1E3A8A]" : "text-gray-400"
                        )}>
                          {e.label}
                        </p>
                        <p className="text-xs text-gray-400">{e.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => { setSidebarStep(2); setSubStep("commande"); }}
                  className="w-full py-4 bg-[#5D9CEC] hover:bg-[#4a8bd4] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-base"
                >
                  Continuer vers la commande
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* ── Commande / Pricing ── */}
            {subStep === "commande" && (
              <motion.div
                key="commande"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <CompanyCard />

                {/* ── Mise en sommeil : carte unique ── */}
                {selectedProcedure === "mise-en-sommeil" ? (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-[#1E3A8A] text-center">
                      La formule qui vous correspond le mieux
                    </h2>

                    <div className="flex justify-center">
                      <div className="w-full max-w-sm">
                        {/* Badge */}
                        <div className="flex justify-center mb-[-1px] relative z-10">
                          <span className="bg-[#5D9CEC] text-white text-xs font-bold px-4 py-1.5 rounded-full">
                            Le plus fréquent
                          </span>
                        </div>

                        {/* Card */}
                        <div className="bg-white border-2 border-[#5D9CEC] rounded-2xl p-6 space-y-5">
                          <div>
                            <h3 className="text-2xl font-bold text-[#1E3A8A]">Mise en sommeil</h3>
                          </div>

                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-[#1E3A8A]">99 €</span>
                            <span className="text-gray-500 text-sm">HT</span>
                          </div>

                          <button
                            onClick={() => handlePayment("sommeil")}
                            disabled={paymentLoading !== null}
                            className="w-full py-3.5 bg-[#5D9CEC] hover:bg-[#4a8bd4] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                          >
                            {paymentLoading === "sommeil" ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Mise en sommeil"
                            )}
                          </button>

                          <ul className="space-y-3">
                            {[
                              "Vérification du dossier par un formaliste",
                              "Assistance par email et téléphone",
                              "Enregistrement au greffe",
                            ].map((f) => (
                              <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                                <Check className="w-4 h-4 text-[#5D9CEC] flex-shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>

                          <p className="text-xs text-gray-400 text-center">
                            + frais de greffe ~184 € HT (non inclus)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Dissolution : 3 formules ── */
                  <div className="space-y-5">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">
                        Choisissez votre formule
                      </h2>
                      <p className="text-gray-400 text-xs">
                        + frais de greffe et annonces légales (~460–570 €)
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {PLANS.map((plan) => (
                        <div
                          key={plan.id}
                          className={cn(
                            "relative rounded-2xl p-4 flex flex-col transition-all",
                            plan.featured
                              ? "bg-gradient-to-b from-[#1E3A8A] to-[#2d52b8] text-white shadow-xl scale-[1.02]"
                              : "bg-white border-2 border-gray-100"
                          )}
                        >
                          {plan.badge && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                                {plan.badge}
                              </span>
                            </div>
                          )}

                          <div className="mb-4">
                            <p className={cn("text-xs font-semibold uppercase tracking-wide mb-1",
                              plan.featured ? "text-blue-200" : "text-gray-400"
                            )}>
                              {plan.name}
                            </p>
                            <div className="flex items-baseline gap-1">
                              <span className={cn("text-3xl font-bold",
                                plan.featured ? "text-white" : "text-[#1E3A8A]"
                              )}>
                                {plan.priceHT}€
                              </span>
                              <span className={cn("text-xs", plan.featured ? "text-blue-200" : "text-gray-400")}>
                                HT
                              </span>
                            </div>
                          </div>

                          <ul className="space-y-2 flex-1 mb-4">
                            {plan.features.map((f) => (
                              <li key={f.label} className="flex items-start gap-1.5">
                                {f.included === true ? (
                                  <Check className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0",
                                    plan.featured ? "text-blue-300" : "text-[#5D9CEC]"
                                  )} />
                                ) : f.included === "partial" ? (
                                  <span className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-xs flex items-center justify-center",
                                    plan.featured ? "text-amber-300" : "text-amber-500"
                                  )}>~</span>
                                ) : (
                                  <X className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-300" />
                                )}
                                <span className={cn("text-xs leading-tight",
                                  plan.featured ? "text-blue-100" : f.included ? "text-gray-700" : "text-gray-300"
                                )}>
                                  {f.label}
                                </span>
                              </li>
                            ))}
                          </ul>

                          <button
                            onClick={() => handlePayment(plan.id)}
                            disabled={paymentLoading !== null}
                            className={cn(
                              "w-full py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5",
                              plan.featured
                                ? "bg-white text-[#1E3A8A] hover:bg-blue-50"
                                : "bg-[#5D9CEC]/10 text-[#1E3A8A] hover:bg-[#5D9CEC]/20"
                            )}
                          >
                            {paymentLoading === plan.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : plan.cta}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <button
                    onClick={() => {
                      setSidebarStep(1);
                      setCurrentQuestion(questions.length - 1);
                      setSubStep("questions");
                    }}
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

function DissolutionRouter() {
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("payment") === "success";
  return isSuccess ? <PaymentSuccessPage /> : <DissolutionForm />;
}

export default function DissolutionPage() {
  return (
    <Suspense>
      <DissolutionRouter />
    </Suspense>
  );
}
