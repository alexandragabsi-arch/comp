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
const QUESTIONS_DISSOLUTION = [
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
        value: "gerant",
        label: "Le gérant actuel",
        description: "La personne qui gère actuellement la société",
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
const PLANS = [
  {
    id: "essentiel",
    name: "Essentiel",
    priceHT: 149,
    priceTTC: 179,
    icon: FileText,
    color: "border-gray-200",
    features: [
      "Procès-verbal de dissolution",
      "Formulaire M2 pré-rempli",
      "Notice explicative",
      "Assistance par email",
    ],
    cta: "Choisir Essentiel",
  },
  {
    id: "standard",
    name: "Standard",
    priceHT: 199,
    priceTTC: 239,
    icon: Shield,
    color: "border-[#5D9CEC]",
    popular: true,
    features: [
      "Tout l'Essentiel",
      "Annonce légale incluse",
      "Suivi du dossier en ligne",
      "Assistance prioritaire",
    ],
    cta: "Choisir Standard",
  },
  {
    id: "premium",
    name: "Premium",
    priceHT: 249,
    priceTTC: 299,
    icon: Sparkles,
    color: "border-gray-200",
    features: [
      "Tout le Standard",
      "Relecture par un juriste",
      "Accompagnement téléphonique",
      "Traitement express prioritaire",
    ],
    cta: "Choisir Premium",
  },
];

type Suggestion = { siren: string; nom: string; formeJuridique: string; ville: string };
type Company = { siren: string; nom: string; formeJuridique: string; ville: string };
type Procedure = "dissolution" | "mise-en-sommeil" | null;
type SubStep = "search" | "procedure" | "questions" | "commande";

export default function DissolutionPage() {
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
      ? QUESTIONS_DISSOLUTION
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
    setSubStep("questions");
  }

  function answerQuestion(questionId: string, value: string) {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // All questions answered → go to payment
      setSidebarStep(2);
      setSubStep("commande");
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

                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-bold text-[#1E3A8A]">
                    Choisissez votre formule
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Frais de greffe et annonces légales non inclus (~460–570 €)
                  </p>
                </div>

                <div className="space-y-3">
                  {PLANS.map((plan) => {
                    const Icon = plan.icon;
                    return (
                      <div
                        key={plan.id}
                        className={cn(
                          "relative bg-white rounded-xl border-2 p-5 transition-all",
                          plan.popular ? "border-[#5D9CEC]" : "border-gray-200"
                        )}
                      >
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="bg-[#5D9CEC] text-white text-xs font-bold px-3 py-1 rounded-full">
                              LE PLUS POPULAIRE
                            </span>
                          </div>
                        )}

                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                            plan.popular ? "bg-[#5D9CEC]/10" : "bg-gray-50"
                          )}>
                            <Icon className={cn("w-6 h-6", plan.popular ? "text-[#5D9CEC]" : "text-gray-500")} />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-baseline justify-between mb-1">
                              <h3 className="font-bold text-[#1E3A8A] text-lg">{plan.name}</h3>
                              <div className="text-right">
                                <span className="text-2xl font-bold text-[#1E3A8A]">{plan.priceTTC}€</span>
                                <span className="text-xs text-gray-400 ml-1">TTC</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">{plan.priceHT}€ HT</p>

                            <ul className="space-y-1.5 mb-4">
                              {plan.features.map((f) => (
                                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                  {f}
                                </li>
                              ))}
                            </ul>

                            <button
                              onClick={() => handlePayment(plan.id)}
                              disabled={paymentLoading !== null}
                              className={cn(
                                "w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                                plan.popular
                                  ? "bg-[#5D9CEC] text-white hover:bg-[#4a8bd4]"
                                  : "bg-gray-100 text-[#1E3A8A] hover:bg-gray-200"
                              )}
                            >
                              {paymentLoading === plan.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                plan.cta
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

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
