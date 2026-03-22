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
  if (/\bSASU\b/.test(fj) || /\bSAS\b/.test(fj) || /\bSA\b/.test(fj)) return "président";
  return "gérant";
}

function isUnipersonnelle(formeJuridique: string): boolean {
  const fj = formeJuridique.toUpperCase();
  return fj.includes("EURL") || fj.includes("SASU") || fj.includes("UNIPERSONNELLE");
}

function getDecisionFromForme(formeJuridique: string): string {
  return isUnipersonnelle(formeJuridique) ? "associe_unique" : "age";
}

function getQuestionsDissoltion(formeJuridique: string) {
  const dirigeant = getDirigeantLabel(formeJuridique);
  const dirigeantCap = dirigeant.charAt(0).toUpperCase() + dirigeant.slice(1);
  return [
    {
      id: "actifs",
      question: "Quel est l'état du patrimoine de la société ?",
      subtitle: "Cela détermine les étapes de liquidation",
      options: [
        {
          value: "vide",
          label: "Société vide",
          description: "Aucun actif, aucune dette — clôture simplifiée",
          icon: Check,
        },
        {
          value: "mobilier",
          label: "Actifs mobiliers uniquement",
          description: "Trésorerie, matériel, créances — répartis entre associés lors de la liquidation",
          icon: CreditCard,
        },
        {
          value: "immo",
          label: "Biens immobiliers",
          description: "Bureau, local, terrain — la dissolution reste possible mais nécessite une cession via notaire",
          icon: Building2,
        },
        {
          value: "dettes",
          label: "Des dettes en cours",
          description: "Les créanciers doivent être remboursés avant la clôture",
          icon: AlertTriangle,
        },
      ],
      info: {
        trigger: "immo",
        content: "🏢 La présence de biens immobiliers (bureau, local…) ne bloque pas la dissolution. Il faudra les céder avant la clôture, avec l'intervention obligatoire d'un notaire pour l'acte de vente.",
      },
      infoSecondary: {
        trigger: "dettes",
        content: "⚠️ Si la société a des dettes, la dissolution amiable n'est pas possible. Il faudra rembourser les créanciers ou passer par une dissolution judiciaire avant de clôturer.",
      },
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
    {
      id: "delai",
      question: "Dans quel délai souhaitez-vous démarrer ?",
      subtitle: "Nous adaptons la prise en charge à votre calendrier",
      type: "delai",
      options: [
        { value: "urgent", label: "Le plus vite possible", description: "Traitement prioritaire sous 48h", icon: Clock },
        { value: "1mois", label: "Dans le mois", description: "Démarrage dans les 4 prochaines semaines", icon: Clock },
        { value: "3mois", label: "Dans les 3 mois", description: "Pas d'urgence, on prend le temps", icon: Clock },
        { value: "plus", label: "Dans plus de 3 mois", description: "Vous êtes en phase de réflexion", icon: Clock },
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
      { label: "Dossier greffe pré-rempli", included: true },
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
      { label: "Dossier greffe pré-rempli", included: true },
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
      { label: "Dossier greffe pré-rempli", included: true },
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
type SubStep = "search" | "procedure" | "intro" | "questions" | "etapes" | "infos" | "commande";

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
  const sessionId = params.get("session_id") ?? "";

  let procedure: string = "dissolution";
  let company: Company | null = null;
  try {
    const parsed = JSON.parse(atob(stateRaw));
    procedure = parsed.procedure ?? "dissolution";
    company = parsed.company ?? null;
  } catch { /* ignore */ }

  // ── Fetch SIREN complet ──────────────────────────────────────────────────
  type SirenData = {
    denominationSociale: string;
    formeJuridique: string;
    siegeSocial: string;
    codePostal: string;
    ville: string;
    capitalSocial: string;
    siren: string;
    greffe: string;
    rcs: string;
    dirigeants: { nom: string; prenom: string; qualite: string }[];
    associes: { nom: string; prenom: string; nbParts: number }[];
  };
  const [sirenData, setSirenData] = useState<SirenData | null>(null);
  const [sirenLoading, setSirenLoading] = useState(!!company?.siren);
  useEffect(() => {
    if (!company?.siren) return;
    fetch(`/api/siren?siren=${company.siren}`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setSirenData(d); })
      .finally(() => setSirenLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [invoiceLoading, setInvoiceLoading] = useState(false);
  async function downloadInvoice() {
    if (!sessionId) return;
    setInvoiceLoading(true);
    try {
      const res = await fetch(`/api/stripe/invoice?session_id=${sessionId}`);
      if (!res.ok) throw new Error("Erreur");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Facture_LegalCorners.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Erreur lors du téléchargement de la facture."); }
    finally { setInvoiceLoading(false); }
  }

  const plan = getPlanLabel(formule);
  const frais = procedure === "mise-en-sommeil" ? FRAIS_SOMMEIL : FRAIS_DISSOLUTION;
  const totalFraisHT = frais.reduce((s, f) => s + f.montant, 0);
  const totalHT = plan.priceHT + totalFraisHT;
  const tva = totalHT * 0.2;
  const totalTTC = totalHT + tva;

  return (
    <div className="min-h-screen flex bg-white">
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/"><Image src="/images/logo.svg" alt="LegalCorners" width={110} height={28} /></Link>
        <span className="text-xs text-gray-400 ml-auto">Paiement confirmé</span>
      </div>

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

      <main className="flex-1 md:ml-72 p-4 pt-20 md:pt-0 bg-gray-50 min-h-screen">
        {/* Banner succès */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#5D9CEC] px-8 py-10 md:py-12">
          <div className="max-w-5xl mx-auto flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Check className="w-8 h-8 text-white" strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Paiement confirmé</h1>
              <p className="text-blue-100 mt-1">Votre commande a bien été enregistrée — merci de votre confiance.</p>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {/* Left: détail commande */}
            <div className="md:col-span-2 space-y-4">
              {/* Fiche société */}
              {company && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* En-tête */}
                  <div className="bg-gradient-to-r from-[#1E3A8A] to-[#5D9CEC] p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-black text-lg">
                        {(sirenData?.denominationSociale ?? company.nom).charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white text-base leading-tight truncate">
                        {sirenData?.denominationSociale ?? company.nom}
                      </p>
                      <p className="text-blue-200 text-xs mt-0.5">
                        {sirenData?.formeJuridique ?? company.formeJuridique}
                        {sirenData?.capitalSocial ? ` • Capital ${Number(sirenData.capitalSocial).toLocaleString("fr-FR")} €` : ""}
                      </p>
                    </div>
                    {sirenLoading && <Loader2 className="w-4 h-4 text-white/60 animate-spin ml-auto flex-shrink-0" />}
                  </div>

                  {/* Corps */}
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">SIREN</p>
                      <p className="text-sm font-mono font-semibold text-gray-800">{sirenData?.siren ?? company.siren}</p>
                    </div>
                    {sirenData?.greffe && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">RCS</p>
                        <p className="text-sm text-gray-800">{sirenData.greffe}</p>
                      </div>
                    )}
                    {(sirenData?.siegeSocial || sirenData?.ville) && (
                      <div className="space-y-1 sm:col-span-2">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Siège social</p>
                        <p className="text-sm text-gray-800">
                          {[sirenData.siegeSocial, sirenData.codePostal, sirenData.ville].filter(Boolean).join(" ")}
                        </p>
                      </div>
                    )}
                    {sirenData?.dirigeants && sirenData.dirigeants.length > 0 && (
                      <div className="space-y-1 sm:col-span-2">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Direction</p>
                        <div className="flex flex-wrap gap-2">
                          {sirenData.dirigeants.slice(0, 3).map((d, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-[#1E3A8A] rounded-lg text-xs font-medium">
                              {d.prenom} {d.nom}
                              {d.qualite && <span className="text-blue-400">— {d.qualite}</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pack choisi */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
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
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
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
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3 md:sticky md:top-6">
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
                href={`/dissolution/dossier?state=${params.get("state") ?? ""}`}
                className="block w-full py-3 bg-[#5D9CEC] hover:bg-[#4a8bd4] text-white font-semibold rounded-xl text-center text-sm transition-all"
              >
                Continuer → Dossier juridique
              </Link>

              {sessionId && (
                <button
                  onClick={downloadInvoice}
                  disabled={invoiceLoading}
                  className="w-full py-3 border-2 border-gray-300 text-gray-600 hover:border-[#5D9CEC] hover:text-[#1E3A8A] font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {invoiceLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Téléchargement...</>
                    : <><FileText className="w-4 h-4" />Télécharger la facture (.docx)</>
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function AccordionItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left gap-3"
      >
        <span className="text-sm font-semibold text-[#1E3A8A]">{title}</span>
        <ChevronRight className={cn("w-4 h-4 text-[#5D9CEC] flex-shrink-0 transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          {children}
        </div>
      )}
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
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Infos client
  const [clientInfos, setClientInfos] = useState({ nom: "", prenom: "", email: "", telephone: "" });

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
    const initialAnswers: Record<string, string> =
      p === "dissolution" && selectedCompany
        ? { decision: getDecisionFromForme(selectedCompany.formeJuridique) }
        : {};
    setAnswers(initialAnswers);
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

  function selectPlan(planId: string) {
    setSelectedPlan(planId);
    setSubStep("infos");
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
      <main className={cn(
        "flex-1 flex items-start justify-center min-h-screen",
        subStep === "commande" ? "p-0" : "md:ml-72 p-6 pt-16"
      )}>
        <div className={cn("w-full", subStep === "commande" ? "" : "max-w-xl")}>
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
                className="space-y-10 max-w-2xl mx-auto w-full"
              >
                <CompanyCard />

                <h1 className="text-4xl font-extrabold text-[#1E3A8A] text-center leading-tight">
                  Quelques informations avant de{" "}
                  <span className="text-[#5D9CEC]">
                    {selectedProcedure === "dissolution"
                      ? "fermer votre société"
                      : "mettre en sommeil votre société"}
                  </span>
                </h1>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-3 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#1E3A8A] flex items-center justify-center">
                      <Clock className="w-7 h-7 text-white" />
                    </div>
                    <p className="font-bold text-[#1E3A8A] text-sm leading-snug">
                      Combien de temps dure le questionnaire ?
                    </p>
                    <p className="text-xs text-gray-500 hidden sm:block">
                      Les utilisateurs le remplissent en moyenne en 5 à 10 minutes.
                    </p>
                  </div>

                  <div className="space-y-3 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#1E3A8A] flex items-center justify-center">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <p className="font-bold text-[#1E3A8A] text-sm leading-snug">
                      Vous avez besoin d&apos;aide ?
                    </p>
                    <p className="text-xs text-gray-500 hidden sm:block">
                      Nos experts sont là pour vous aider par email ou téléphone.
                    </p>
                  </div>

                  <div className="space-y-3 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#1E3A8A] flex items-center justify-center">
                      <Shield className="w-7 h-7 text-white" />
                    </div>
                    <p className="font-bold text-[#1E3A8A] text-sm leading-snug">
                      {selectedProcedure === "dissolution"
                        ? "On s'occupe de tout pour vous !"
                        : "On gère les formalités pour vous !"}
                    </p>
                    <p className="text-xs text-gray-500 hidden sm:block">
                      {selectedProcedure === "dissolution"
                        ? "Dissolution, liquidation et radiation en toute sérénité."
                        : "Déclaration de cessation et enregistrement au greffe."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-center">
                  <button
                    onClick={() => setSubStep("questions")}
                    className="w-full py-4 bg-[#1E3A8A] hover:bg-[#162d6e] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-base"
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

                {(questions[currentQuestion] as { type?: string }).type === "delai" ? (
                  <div className="grid grid-cols-2 gap-3">
                    {questions[currentQuestion].options.map((opt, i) => {
                      const emojis = ["⚡", "📅", "🗓️", "💭"];
                      return (
                        <button
                          key={opt.value}
                          onClick={() => answerQuestion(questions[currentQuestion].id, opt.value)}
                          className="flex flex-col items-start gap-2 p-5 rounded-xl border-2 border-gray-200 bg-white hover:border-[#5D9CEC] hover:bg-blue-50 text-left transition-all group"
                        >
                          <span className="text-2xl">{emojis[i]}</span>
                          <p className="font-bold text-[#1E3A8A] text-sm">{opt.label}</p>
                          <p className="text-xs text-[#1E3A8A]/60">{opt.description}</p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
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
                )}

                {/* Info panel immo */}
                {(() => {
                  const q = questions[currentQuestion] as { id: string; info?: { trigger: string; content: string }; infoSecondary?: { trigger: string; content: string } };
                  const currentAnswer = answers[q.id];
                  const activeInfo = [q.info, q.infoSecondary].find(i => i && i.trigger === currentAnswer);
                  if (!activeInfo) return null;
                  const isImmo = activeInfo.trigger === "immo";
                  return (
                    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                      <button
                        onClick={() => setInfoOpen((o) => !o)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left"
                      >
                        <span className="text-sm font-semibold text-[#1E3A8A] flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-[#5D9CEC]" />
                          {isImmo ? "Que se passe-t-il avec les biens immobiliers ?" : "Que se passe-t-il en cas de dettes ?"}
                        </span>
                        <ChevronRight className={cn("w-4 h-4 text-[#5D9CEC] transition-transform", infoOpen && "rotate-90")} />
                      </button>
                      {infoOpen && (
                        <div className="px-4 pb-4 text-sm text-[#1E3A8A]/80 leading-relaxed border-t border-gray-100 pt-3">
                          {activeInfo.content}
                        </div>
                      )}
                    </div>
                  );
                })()}

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

            {/* ── Infos client avant paiement ── */}
            {subStep === "infos" && (
              <motion.div
                key="infos"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <CompanyCard />

                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-bold text-[#1E3A8A]">Vos coordonnées</h2>
                  <p className="text-gray-500 text-sm">Pour finaliser votre commande et vous envoyer vos documents</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Prénom</label>
                      <input
                        type="text"
                        value={clientInfos.prenom}
                        onChange={(e) => setClientInfos({ ...clientInfos, prenom: e.target.value })}
                        placeholder="Jean"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5D9CEC] focus:outline-none text-sm transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Nom</label>
                      <input
                        type="text"
                        value={clientInfos.nom}
                        onChange={(e) => setClientInfos({ ...clientInfos, nom: e.target.value })}
                        placeholder="Dupont"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5D9CEC] focus:outline-none text-sm transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Email</label>
                    <input
                      type="email"
                      value={clientInfos.email}
                      onChange={(e) => setClientInfos({ ...clientInfos, email: e.target.value })}
                      placeholder="jean.dupont@email.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5D9CEC] focus:outline-none text-sm transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Téléphone</label>
                    <input
                      type="tel"
                      value={clientInfos.telephone}
                      onChange={(e) => setClientInfos({ ...clientInfos, telephone: e.target.value })}
                      placeholder="06 00 00 00 00"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5D9CEC] focus:outline-none text-sm transition-colors"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!clientInfos.prenom || !clientInfos.nom || !clientInfos.email || !clientInfos.telephone) return;
                    handlePayment(selectedPlan!);
                  }}
                  disabled={!clientInfos.prenom || !clientInfos.nom || !clientInfos.email || !clientInfos.telephone || paymentLoading !== null}
                  className="w-full py-4 bg-[#5D9CEC] hover:bg-[#4a8bd4] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  Procéder au paiement
                </button>

                <div className="text-center">
                  <button
                    onClick={() => setSubStep("commande")}
                    className="text-gray-500 text-sm hover:text-[#1E3A8A] transition-colors"
                  >
                    ← Retour au choix du pack
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
                className="min-h-screen flex flex-col"
              >
                {/* Top bar plein écran */}
                <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
                  <Link href="/"><Image src="/images/logo.svg" alt="LegalCorners" width={120} height={30} /></Link>
                  <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
                    <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs"><Check className="w-3 h-3" /></span>Projet</span>
                    <span className="text-gray-200">›</span>
                    <span className="flex items-center gap-1.5 font-semibold text-[#1E3A8A]"><span className="w-5 h-5 rounded-full bg-[#5D9CEC] text-white flex items-center justify-center text-xs font-bold">2</span>Commande</span>
                    <span className="text-gray-200">›</span>
                    <span className="text-gray-300 flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs">3</span>Dossier Juridique</span>
                    <span className="text-gray-200">›</span>
                    <span className="text-gray-300 flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs">4</span>Validation</span>
                  </div>
                  {selectedCompany && (
                    <span className="text-xs text-gray-400 hidden md:block">{selectedCompany.nom}</span>
                  )}
                </div>

                <div className="flex-1 px-6 py-10 max-w-6xl mx-auto w-full">

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
                            onClick={() => selectPlan("sommeil")}
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
                  <div className="space-y-4">
                    <div className="text-center space-y-1 mb-8">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">
                        Choisissez la formule qui vous correspond le mieux
                      </h2>
                      <p className="text-gray-400 text-sm">
                        + frais de greffe et annonces légales (~460–570 €)
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                      {PLANS.map((plan) => (
                        <div
                          key={plan.id}
                          className={cn(
                            "relative rounded-2xl flex flex-col transition-all",
                            plan.featured
                              ? "bg-gradient-to-b from-[#1E3A8A] to-[#2d52b8] text-white shadow-2xl p-6 md:-my-3"
                              : "bg-white border-2 border-gray-200 p-5"
                          )}
                        >
                          {plan.badge && (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                              <span className="bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap shadow">
                                {plan.badge}
                              </span>
                            </div>
                          )}

                          <div className="mb-4">
                            <p className={cn("text-xs font-bold uppercase tracking-widest mb-2",
                              plan.featured ? "text-blue-200" : "text-gray-400"
                            )}>
                              {plan.name}
                            </p>
                            <div className="flex items-baseline gap-1">
                              <span className={cn("text-5xl font-extrabold",
                                plan.featured ? "text-white" : "text-[#1E3A8A]"
                              )}>
                                {plan.priceHT}€
                              </span>
                              <span className={cn("text-sm font-medium", plan.featured ? "text-blue-200" : "text-gray-400")}>
                                HT
                              </span>
                            </div>
                            <div className={cn("mt-2 text-xs space-y-0.5", plan.featured ? "text-blue-200" : "text-gray-400")}>
                              <div className="flex justify-between">
                                <span>HT</span>
                                <span>{plan.priceHT} €</span>
                              </div>
                              <div className="flex justify-between">
                                <span>TVA 20 %</span>
                                <span>{(plan.priceHT * 0.2).toFixed(2)} €</span>
                              </div>
                              <div className={cn("flex justify-between font-semibold pt-0.5 border-t",
                                plan.featured ? "border-blue-400 text-white" : "border-gray-200 text-gray-700"
                              )}>
                                <span>TTC</span>
                                <span>{(plan.priceHT * 1.2).toFixed(2)} €</span>
                              </div>
                              <p className="pt-1">+ frais légaux obligatoires</p>
                            </div>
                          </div>

                          <button
                            onClick={() => selectPlan(plan.id)}
                            disabled={paymentLoading !== null}
                            className={cn(
                              "w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 mb-5",
                              plan.featured
                                ? "bg-white text-[#1E3A8A] hover:bg-blue-50"
                                : "border-2 border-[#5D9CEC] text-[#5D9CEC] hover:bg-[#5D9CEC] hover:text-white"
                            )}
                          >
                            {paymentLoading === plan.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : plan.cta}
                          </button>

                          <ul className="space-y-2.5 flex-1">
                            {plan.features.map((f) => (
                              <li key={f.label} className="flex items-start gap-2">
                                {f.included === true ? (
                                  <Check className={cn("w-4 h-4 mt-0.5 flex-shrink-0",
                                    plan.featured ? "text-blue-300" : "text-[#5D9CEC]"
                                  )} />
                                ) : f.included === "partial" ? (
                                  <span className={cn("w-4 text-center leading-none mt-0.5 flex-shrink-0 text-sm",
                                    plan.featured ? "text-amber-300" : "text-amber-500"
                                  )}>~</span>
                                ) : (
                                  <X className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-300" />
                                )}
                                <span className={cn("text-sm leading-snug",
                                  plan.featured ? "text-blue-100" : f.included ? "text-gray-700" : "text-gray-300"
                                )}>
                                  {f.label}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Dépliants explication tarifs & frais ── */}
                <div className="mt-8 space-y-3 max-w-2xl mx-auto w-full">
                  {/* Dépliant 1 : Ce qui est inclus dans nos honoraires */}
                  {[
                    {
                      title: "Qu'est-ce qui est inclus dans nos honoraires ?",
                      content: selectedProcedure === "mise-en-sommeil" ? (
                        <ul className="space-y-2.5 text-sm text-gray-600">
                          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#5D9CEC] mt-0.5 flex-shrink-0" /><span><strong className="text-gray-800">Vérification complète</strong> de votre dossier par un formaliste</span></li>
                          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#5D9CEC] mt-0.5 flex-shrink-0" /><span>Préparation et envoi du <strong className="text-gray-800">dossier au greffe</strong></span></li>
                          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#5D9CEC] mt-0.5 flex-shrink-0" /><span><strong className="text-gray-800">Enregistrement au greffe</strong> du tribunal de commerce</span></li>
                          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#5D9CEC] mt-0.5 flex-shrink-0" /><span>Suivi et <strong className="text-gray-800">assistance par email et téléphone</strong></span></li>
                        </ul>
                      ) : (
                        <ul className="space-y-2.5 text-sm text-gray-600">
                          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#5D9CEC] mt-0.5 flex-shrink-0" /><span><strong className="text-gray-800">Vérification du dossier</strong> par un formaliste expert</span></li>
                          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#5D9CEC] mt-0.5 flex-shrink-0" /><span><strong className="text-gray-800">Rédaction des actes de dissolution</strong> (PV d'assemblée, décision de l'associé unique…) et préparation du <strong className="text-gray-800">dossier greffe</strong></span></li>
                          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#5D9CEC] mt-0.5 flex-shrink-0" /><span><strong className="text-gray-800">Dépôt au greffe</strong> et suivi des formalités</span></li>
                          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#5D9CEC] mt-0.5 flex-shrink-0" /><span><strong className="text-gray-800">Publication des annonces légales</strong> <span className="text-gray-400">(formules Standard & Premium)</span></span></li>
                          <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#5D9CEC] mt-0.5 flex-shrink-0" /><span>Assistance par <strong className="text-gray-800">email et téléphone</strong></span></li>
                        </ul>
                      ),
                    },
                    {
                      title: "Quels sont les frais annexes obligatoires ?",
                      content: (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-500 text-justify">Ces frais sont <strong className="text-gray-700">fixés par l'État</strong> et les organismes officiels. Ils s'ajoutent à nos honoraires et sont <strong className="text-gray-700">identiques quelle que soit la plateforme</strong>.</p>
                          <div className="rounded-xl overflow-hidden border border-gray-100">
                            {(selectedProcedure === "mise-en-sommeil" ? FRAIS_SOMMEIL : FRAIS_DISSOLUTION).map((f, i, arr) => (
                              <div key={f.label} className={cn("flex justify-between items-center px-4 py-3 text-sm", i < arr.length - 1 ? "border-b border-gray-100" : "", i % 2 === 0 ? "bg-gray-50" : "bg-white")}>
                                <span className="text-gray-600">{f.label}</span>
                                <span className="font-semibold text-[#1E3A8A] whitespace-nowrap">{f.montant.toFixed(2).replace(".", ",")} € HT</span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center px-4 py-3 text-sm bg-[#1E3A8A] text-white font-bold">
                              <span>Total frais annexes</span>
                              <span>
                                {(selectedProcedure === "mise-en-sommeil" ? FRAIS_SOMMEIL : FRAIS_DISSOLUTION)
                                  .reduce((acc, f) => acc + f.montant, 0)
                                  .toFixed(2).replace(".", ",")} € HT
                              </span>
                            </div>
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "Pourquoi ces frais ne sont-ils pas inclus dans le prix affiché ?",
                      content: (
                        <p className="text-sm text-gray-600 leading-relaxed text-justify">
                          Les <strong className="text-gray-800">frais de greffe et d'annonces légales</strong> sont collectés directement par les <strong className="text-gray-800">organismes officiels</strong> (tribunal de commerce, journaux d'annonces légales). Nous ne pouvons pas les intégrer dans notre prix car ils <strong className="text-gray-800">varient selon le département</strong> et la forme juridique de votre société. Nous vous accompagnons dans leur règlement et vous informons à chaque étape.
                        </p>
                      ),
                    },
                  ].map((item, i) => (
                    <AccordionItem key={i} title={item.title}>{item.content}</AccordionItem>
                  ))}
                </div>

                <div className="text-center mt-6">
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
                </div>{/* end flex-1 inner */}
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
