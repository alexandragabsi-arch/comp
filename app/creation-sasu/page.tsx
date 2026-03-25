"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, ChevronRight,
  User, Building2, CreditCard, FolderOpen, CheckCircle2,
  FileUp, PenTool, HelpCircle, Lightbulb, Clock, Zap, Shield, Users, Sparkles, X,
  Coins, Percent, Edit3, MapPin, Calendar, Upload, Eye, Landmark, Download, Heart, FileText, Trash2, Plus, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentPreviewPanel } from "@/components/document-preview-panel";
import { useRef, useCallback } from "react";

/* ───────── Address Autocomplete (adresse.data.gouv.fr) ───────── */
function AddressAutocomplete({ value, onChange, placeholder, className }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [suggestions, setSuggestions] = useState<{ label: string; context: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data.features || []).map((f: any) => ({
              label: f.properties.label,
              context: f.properties.context,
            }))
          );
          setShowSuggestions(true);
        }
      } catch { /* ignore */ }
    }, 300);
  }, []);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); fetchSuggestions(e.target.value); }}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder || "Tapez une adresse..."}
        className={className || "w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(s.label); setShowSuggestions(false); setSuggestions([]); }}
              className="w-full px-4 py-2.5 text-left hover:bg-blue-50 text-sm text-gray-800 border-b border-gray-100 last:border-b-0"
            >
              <span className="font-medium">{s.label}</span>
              <span className="text-xs text-gray-400 ml-2">{s.context}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/*
 * Color palette (LegalCorners):
 *   Primary:      #2563EB
 *   Inactive:     #9CA3AF
 *   Active text:  #1E293B
 *   Selected bg:  #EFF6FF
 *   Borders:      #2563EB (selected) / #D1D5DB (default)
 *   No #000 anywhere
 */

/* ───────── Types ───────── */

type QuestionType = "choice" | "input" | "textarea";

interface Choice { value: string; label: string; subtitle?: string }

interface Question {
  id: string;
  title: string;
  description?: string;
  type: QuestionType;
  choices?: Choice[];
  placeholder?: string;
  optional?: boolean;
  info?: { title: string; content: React.ReactNode };
  hint?: string;
}

/* ───────── Questions ───────── */

const QUESTIONS: Question[] = [
  /* ── Step 1: Informations utilisateur ── */
  {
    id: "qui_realise",
    title: "Qui réalise cette formalité ?",
    type: "choice",
    choices: [
      { value: "associe", label: "Un des associés fondateurs" },
      { value: "ami", label: "Un ami / famille" },
      { value: "professionnel", label: "Un professionnel mandataire" },
    ],
  },
  /* ── Step 2: Société (infos de base) ── */
  {
    id: "nom_societe",
    title: "Quel sera le nom de la société ?",
    type: "input",
    placeholder: "Ex : Ma Société",
  },
  {
    id: "proteger_nom",
    title: "Souhaitez-vous protéger votre nom par une marque ?",
    type: "choice",
    choices: [
      { value: "oui", label: "Je veux protéger mon nom" },
      { value: "non", label: "Je n'ai pas besoin de protéger mon nom" },
      { value: "ne_sais_pas", label: "Je ne sais pas encore" },
    ],
    info: {
      title: "Le saviez-vous ?",
      content: (
        <p>
          En déposant votre marque ou votre logo auprès de l&apos;<strong>INPI</strong> (Institut National de la Propriété Intellectuelle),
          vous en devenez officiellement le propriétaire. Cela signifie que vous êtes le seul à pouvoir l&apos;utiliser et vous pouvez
          empêcher tout concurrent de s&apos;en servir sans votre accord.{" "}
          <em>La protection est valable 10 ans et peut être renouvelée indéfiniment.</em>{" "}
          Vous avez aussi la possibilité d&apos;étendre votre protection à l&apos;Europe (EUIPO) ou à l&apos;international.
        </p>
      ),
    },
  },
  {
    id: "capital_social",
    title: "Quel est le montant du capital social de votre SASU ?",
    description:
      "Choisissez le montant qui correspond à vos moyens et à votre projet : il n'y a pas de minimum obligatoire en SASU (à partir de 1 €), mais mieux vaut prévoir un capital qui couvre vos premiers frais et inspire confiance à vos partenaires.",
    type: "input",
    placeholder: "Ex : 1 000",
    info: {
      title: "Le saviez-vous ?",
      content: (
        <>
          <p>En <strong>SASU</strong>, il n&apos;existe aucun minimum obligatoire : vous pouvez créer votre société avec seulement <strong>1 €</strong>.</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Crédibilité :</strong> un capital trop faible peut donner une image fragile.</li>
            <li><strong>Praticité :</strong> un capital plus élevé permet de couvrir vos premiers frais.</li>
            <li><strong>Souplesse :</strong> vous restez libre d&apos;augmenter le capital plus tard.</li>
          </ul>
          <p className="mt-3 font-semibold text-[#2563EB]">Conseil pratique : fixez un capital cohérent avec votre activité.</p>
        </>
      ),
    },
  },
  {
    id: "statut_micro",
    title: "Êtes-vous actuellement micro-entrepreneur (auto-entrepreneur / entreprise individuelle) ?",
    description:
      "Vous êtes micro-entrepreneur si vous possédez un SIRET qui vous permet d'exercer une activité en votre nom personnel",
    type: "choice",
    choices: [
      { value: "oui", label: "Oui, je suis micro-entrepreneur (auto-entrepreneur / EI)" },
      { value: "non", label: "Non, je ne suis pas micro-entrepreneur" },
    ],
  },
  {
    id: "action_micro",
    title: "Que souhaitez-vous faire de votre activité actuelle ?",
    type: "choice",
    choices: [
      { value: "transformer", label: "Transformer ma micro-entreprise en SASU", subtitle: "Vous conservez vos clients, votre nom commercial et vos contrats actuels. Votre micro sera fermée après la création de SASU." },
      { value: "garder", label: "Garder ma micro + créer la SASU à côté", subtitle: "Deux structures séparées, selon vos besoins." },
      { value: "arreter", label: "Arrêter la micro et repartir via la SASU", subtitle: "Nouveau départ, simple et propre." },
    ],
  },
  {
    id: "fermeture_micro",
    title: "Souhaitez-vous que nous nous occupions de la fermeture ou du transfert de votre micro-entreprise ?",
    type: "choice",
    choices: [
      { value: "oui", label: "Oui (frais supplémentaires +89 € HT)" },
      { value: "non", label: "Non, je ferai la démarche moi-même" },
    ],
  },
  {
    id: "demarrage",
    title: "Quand souhaitez-vous démarrer votre projet ?",
    type: "choice",
    choices: [
      { value: "asap", label: "Dès que possible (un de nos experts vous accompagne)" },
      { value: "semaine", label: "Dans la semaine" },
      { value: "mois", label: "Dans le mois" },
      { value: "ne_sais_pas", label: "Je ne sais pas encore" },
    ],
  },
  {
    id: "activite_artisanale",
    title: "Votre activité est-elle artisanale ? (Coiffeur, boulanger, plombier, etc...)",
    description:
      "Une activité artisanale est une activité manuelle (ex. : coiffure, pâtisserie, couture sur mesure, mécanique, plomberie, etc.). De même, si vous fabriquez ou réparez quelque chose et que vous le vendez ensuite, votre activité est considérée comme partiellement artisanale.",
    type: "choice",
    optional: true,
    choices: [
      { value: "oui", label: "Oui" },
      { value: "non", label: "Non" },
    ],
    hint: "En cas de doute, utilisez le bouton Aide IA pour choisir la bonne réponse.",
    info: {
      title: "Le saviez-vous ?",
      content: (
        <>
          <p><strong>Toute activité artisanale doit être immatriculée au Répertoire des Métiers (RM)</strong>, tenu par la <strong>Chambre de Métiers et de l&apos;Artisanat (CMA)</strong>. Il s&apos;agit d&apos;une <strong>obligation légale distincte</strong> de l&apos;immatriculation au <strong>Registre du Commerce et des Sociétés (RCS)</strong>.</p>
          <p className="mt-2 italic text-[#2563EB]">
            Si vous souhaitez que nous réalisions cette démarche pour vous, un supplément de 79 € HT sera appliqué, auquel s&apos;ajoutent les frais légaux obligatoires (frais CMA et frais de greffe), dont le montant exact sera précisé au moment du paiement.
          </p>
        </>
      ),
    },
  },
  {
    id: "objet_social",
    title: "Quel est l'objet social de votre SASU ?",
    description:
      "Décrivez précisément l'activité principale de votre société.",
    type: "textarea",
    placeholder: "Ex : Conseil en stratégie digitale, développement de sites web...",
    info: {
      title: "Conseil pratique",
      content: (
        <p>Ajoutez toujours <em>&quot;et toutes opérations se rattachant directement ou indirectement à cet objet&quot;</em>.</p>
      ),
    },
  },
  /* ── Step 3: Paiement ── */
  {
    id: "regime_fiscal",
    title: "Quel régime fiscal souhaitez-vous ?",
    type: "choice",
    choices: [
      { value: "is", label: "Impôt sur les sociétés (IS) — recommandé" },
      { value: "ir", label: "Impôt sur le revenu (IR) — option temporaire, 5 ans max" },
    ],
    info: {
      title: "Le saviez-vous ?",
      content: (
        <p>L&apos;<strong>IS</strong> est le régime par défaut. Taux réduit de <strong>15 %</strong> sur les 42 500 premiers euros, puis <strong>25 %</strong>.</p>
      ),
    },
  },
  /* ── Step 4: Dossier juridique ── */
  {
    id: "adresse_siege",
    title: "Quelle est l'adresse du siège social ?",
    type: "input",
    placeholder: "Ex : 12 rue de la Paix, 75001 Paris",
    info: {
      title: "Le saviez-vous ?",
      content: (
        <p>Vous pouvez domicilier votre SASU à votre adresse personnelle (max 5 ans), dans une société de domiciliation, ou un local commercial.</p>
      ),
    },
  },
  {
    id: "president_remunere",
    title: "Le président sera-t-il rémunéré ?",
    type: "choice",
    choices: [
      { value: "oui", label: "Oui — rémunération prévue" },
      { value: "non", label: "Non — pas de rémunération au démarrage" },
    ],
    info: {
      title: "Le saviez-vous ?",
      content: (
        <p>Le président de SASU est <strong>assimilé salarié</strong>. S&apos;il n&apos;est pas rémunéré, aucune cotisation sociale n&apos;est due.</p>
      ),
    },
  },
];

/* ───────── Pages: each page = array of question indices shown together ───────── */

interface PageDef {
  questions: number[];
  sidebarStep: number;
  special?: "brand_protection" | "micro_page" | "micro_search" | "pricing" | "avocat_confirmation";
}

/* STATIC_PAGES no longer used — navigation is now phase-based */

/* ───────── Sidebar steps (7 like LegalCorners) ───────── */

const STEPS = [
  { id: 1, label: "Informations utilisateur", icon: User },
  { id: 2, label: "Société (infos de base)", icon: Building2 },
  { id: 3, label: "Paiement", icon: CreditCard },
  { id: 4, label: "Dossier juridique", icon: FolderOpen },
  { id: 5, label: "Récapitulatif & Validation", icon: CheckCircle2 },
  { id: 6, label: "Pièces justificatives", icon: FileUp },
  { id: 7, label: "Signature", icon: PenTool },
];

/* ───────── Components ───────── */

function ChoiceCard({ label, subtitle, selected, onClick }: { label: string; subtitle?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-6 py-4 rounded-lg border transition-all",
        selected
          ? "border-[#2563EB] border-2 bg-[#EFF6FF]"
          : "border-[#D1D5DB] bg-transparent hover:border-[#2563EB] hover:bg-[#EFF6FF]"
      )}
    >
      <span className="text-[15px] font-medium text-[#2563EB]">{label}</span>
      {subtitle && <p className="text-sm text-[#6B7280] mt-1 font-normal">{subtitle}</p>}
    </button>
  );
}

function InfoAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-6 border border-[#D1D5DB] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-[#EFF6FF] text-base font-bold text-[#1E293B]"
      >
        <span className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          Plus d&apos;informations
        </span>
        {open ? <ChevronUp className="w-5 h-5 text-[#2563EB]" /> : <ChevronDown className="w-5 h-5 text-[#2563EB]" />}
      </button>
      {open && (
        <div className="px-5 py-4 bg-[#F8FAFF] border-t border-[#D1D5DB]">
          <p className="text-base font-bold text-[#2563EB] mb-2">{title}</p>
          <div className="text-base text-gray-700 leading-relaxed text-justify">{children}</div>
        </div>
      )}
    </div>
  );
}

/* ───────── Brand Protection Plans ───────── */

const BRAND_PLANS = [
  {
    id: "france",
    flag: "🇫🇷",
    label: "France",
    badge: "1 classe incluse",
    price: 269,
    details: ["Frais INPI : 190 €", "Service LegalCorners : 79 €", "Classe supplémentaire : +40 €"],
    zone: "Marque nationale (INPI)",
    baseFees: 190,
    serviceFees: 79,
    extraClassPrice: 40,
  },
  {
    id: "eu",
    flag: "🇪🇺",
    label: "Union européenne",
    badge: "1 classe incluse",
    price: 950,
    details: ["Frais EUIPO : 850 €", "Service LegalCorners : 100 €", "Classe supplémentaire : +60 €"],
    zone: "Marque européenne (EUIPO)",
    baseFees: 850,
    serviceFees: 100,
    extraClassPrice: 60,
  },
  {
    id: "international",
    flag: "🌍",
    label: "International",
    badge: "Base + pays choisis",
    price: 1150,
    details: ["Frais OMPI (base) : 1 000 €", "Service LegalCorners : 150 €", "+ Frais par pays sélectionné (variable)"],
    zone: "Marque internationale (OMPI)",
    baseFees: 1000,
    serviceFees: 150,
    extraClassPrice: 0,
  },
];

function BrandProtectionSection({ onPlanChange }: { onPlanChange?: (planId: string) => void }) {
  const [selectedPlan, setSelectedPlan] = useState("france");
  const [selectedClasses, setSelectedClasses] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const plan = BRAND_PLANS.find((p) => p.id === selectedPlan)!;
  const extraCost = selectedClasses > 1 ? (selectedClasses - 1) * plan.extraClassPrice : 0;
  const total = plan.price + extraCost;

  return (
    <div className="mb-10">
      {/* Section title */}
      <h2 className="text-[20px] md:text-[22px] font-bold text-[#1E293B] text-center mb-2">
        Protégez votre nom / logo
      </h2>
      <p className="text-sm text-[#6B7280] text-center mb-6">
        Choisissez la zone de protection. Le tarif indiqué comprend <strong className="text-[#1E293B]">1 classe incluse</strong>.
      </p>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {BRAND_PLANS.map((p) => (
          <button
            key={p.id}
            onClick={() => { setSelectedPlan(p.id); onPlanChange?.(p.id); }}
            className={cn(
              "text-left rounded-xl border-2 p-5 transition-all",
              selectedPlan === p.id
                ? "border-[#2563EB] bg-[#EFF6FF]"
                : "border-[#D1D5DB] bg-white hover:border-[#93B4F6]"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 font-semibold text-[#1E293B]">
                <span className="text-lg">{p.flag}</span> {p.label}
              </span>
              <span className="text-xs font-medium text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded-full">
                {p.badge}
              </span>
            </div>
            <p className="text-2xl font-bold text-[#1E293B] mb-3">
              {p.price} € <span className="text-sm font-normal text-[#9CA3AF]">TTC</span>
            </p>
            <ul className="space-y-1">
              {p.details.map((d, i) => (
                <li key={i} className="text-xs text-[#6B7280]">• {d}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Bottom: Paramètres + Récapitulatif */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Paramètres */}
        <div className="border border-[#D1D5DB] rounded-xl p-5">
          <h3 className="font-bold text-[#1E293B] mb-1">Paramètres</h3>
          <p className="text-sm text-[#6B7280] mb-3">Choisir vos classes</p>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm bg-white transition-colors",
                dropdownOpen ? "border-[#2563EB]" : "border-[#D1D5DB]",
                selectedClasses > 0 ? "text-[#1E293B]" : "text-[#9CA3AF]"
              )}
            >
              {selectedClasses > 0
                ? `${selectedClasses} classe${selectedClasses > 1 ? "s" : ""}`
                : "Choisir la classe"}
              <ChevronDown className={cn("w-4 h-4 text-[#9CA3AF] transition-transform", dropdownOpen && "rotate-180")} />
            </button>
            {dropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-[#D1D5DB] rounded-lg shadow-lg overflow-hidden">
                {Array.from({ length: 45 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => { setSelectedClasses(n); setDropdownOpen(false); }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm transition-colors",
                      selectedClasses === n
                        ? "bg-[#EFF6FF] text-[#2563EB] font-medium"
                        : "text-[#1E293B] hover:bg-[#F9FAFB]"
                    )}
                  >
                    {n} classe{n > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            )}
          </div>
          {plan.extraClassPrice > 0 && (
            <p className="text-xs text-[#6B7280] mt-3">
              Chaque classe au-delà de la 1ʳᵉ ajoute {plan.extraClassPrice} €.
            </p>
          )}
          <p className="text-xs text-[#6B7280] mt-2">
            <strong className="text-[#1E293B]">Qu&apos;est-ce qu&apos;une classe ?</strong> Une classe est une catégorie de produits/services
            (classification de Nice). Ajoutez des classes si vous exercez dans plusieurs domaines.
          </p>
        </div>

        {/* Récapitulatif */}
        <div className="border border-[#D1D5DB] rounded-xl p-5">
          <h3 className="font-bold text-[#2563EB] mb-4">Récapitulatif</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Zone sélectionnée</span>
              <span className="text-[#1E293B] font-medium">{plan.zone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Nombre de classes</span>
              <span className="text-[#1E293B] font-medium">{selectedClasses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Frais officiels</span>
              <span className="text-[#1E293B] font-medium">{plan.baseFees} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Service LegalCorners</span>
              <span className="text-[#1E293B] font-medium">{plan.serviceFees} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Supplément classes</span>
              <span className="text-[#1E293B] font-medium">{extraCost > 0 ? `${extraCost} €` : "—"}</span>
            </div>
          </div>
          <div className="border-t border-[#D1D5DB] mt-4 pt-4 flex justify-between items-center">
            <span className="font-bold text-[#1E293B]">Total indicatif</span>
            <span className="text-lg font-bold text-[#2563EB]">{total} € TTC</span>
          </div>
          <button className="w-full mt-4 py-3 rounded-xl bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1D4ED8] active:bg-[#1E40AF] transition-colors">
            Choisir cette formule
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Single Question Block ───────── */

function QuestionBlock({
  question,
  answer,
  onAnswer,
}: {
  question: Question;
  answer: string;
  onAnswer: (val: string) => void;
}) {
  return (
    <div className="mb-10">
      <h2 className="text-[16px] md:text-[18px] font-bold text-[#1E293B] mb-2 leading-snug">
        {question.title}
      </h2>

      {question.description && (
        <p className="text-sm text-[#6B7280] leading-relaxed mb-4">{question.description}</p>
      )}

      {question.optional && (
        <span className="inline-block mb-4 px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded-full">
          optionnel
        </span>
      )}

      {/* Choice cards */}
      {question.type === "choice" && question.choices && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {question.choices.map((c) => (
            <ChoiceCard
              key={c.value}
              label={c.label}
              subtitle={c.subtitle}
              selected={answer === c.value}
              onClick={() => onAnswer(c.value)}
            />
          ))}
        </div>
      )}

      {/* Text input */}
      {question.type === "input" && (
        <input
          type="text"
          value={answer}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder={question.placeholder}
          className="w-full mt-3 px-5 py-4 rounded-lg border border-[#D1D5DB] focus:border-[#2563EB] focus:outline-none text-sm text-[#1E293B] bg-white transition-colors"
        />
      )}

      {/* Textarea */}
      {question.type === "textarea" && (
        <textarea
          value={answer}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder={question.placeholder}
          rows={4}
          className="w-full mt-3 px-5 py-4 rounded-lg border border-[#D1D5DB] focus:border-[#2563EB] focus:outline-none text-sm text-[#1E293B] resize-none bg-white transition-colors"
        />
      )}

      {question.hint && (
        <p className="text-sm text-[#2563EB] italic mt-3">{question.hint}</p>
      )}

      {question.optional && (
        <div className="flex justify-end mt-3">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-[#2563EB] text-[#2563EB] text-sm font-semibold hover:bg-[#EFF6FF] transition-colors">
            <HelpCircle className="w-4 h-4" /> Aide IA
          </button>
        </div>
      )}

      {question.info && (
        <InfoAccordion title={question.info.title}>
          {question.info.content}
        </InfoAccordion>
      )}

    </div>
  );
}

/* SidebarStep component removed — sidebar now uses dissolution-style inline rendering */

/* ───────── Accordion Item (dissolution style) ───────── */

function AccordionItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-[#D1D5DB] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-[#EFF6FF] text-left gap-3"
      >
        <span className="flex items-center gap-2 text-base font-bold text-[#1E3A8A]">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          {title}
        </span>
        {open ? <ChevronUp className="w-5 h-5 text-[#2563EB] flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-[#2563EB] flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 py-4 bg-[#F8FAFF] border-t border-[#D1D5DB] text-base text-gray-700 leading-relaxed text-justify">
          {children}
        </div>
      )}
    </div>
  );
}

/* ───────── Pricing Plans (Step 3: Paiement) — Dissolution style ───────── */

type PlanFeature = { label: string; included: boolean | "partial" };
type Plan = {
  id: string; name: string; priceHT: number; badge?: string; featured?: boolean;
  features: PlanFeature[]; cta: string;
};

const PRICING_PLANS: Plan[] = [
  {
    id: "essentielle",
    name: "Essentielle",
    priceHT: 139,
    features: [
      { label: "Statuts générés automatiquement", included: true },
      { label: "Préparation du dossier complet", included: true },
      { label: "Envoi au greffe", included: true },
      { label: "Accompagnement par mail", included: true },
      { label: "Vérification par un juriste", included: false },
      { label: "Garantie anti-rejet du greffe", included: false },
      { label: "Accompagnement téléphonique", included: false },
    ],
    cta: "Choisir Essentielle",
  },
  {
    id: "premium",
    name: "Premium",
    priceHT: 199,
    featured: true,
    badge: "Le plus choisi",
    features: [
      { label: "Statuts générés automatiquement", included: true },
      { label: "Préparation du dossier complet", included: true },
      { label: "Envoi au greffe", included: true },
      { label: "Accompagnement téléphonique et par mail", included: true },
      { label: "Vérification par un juriste sous 24h", included: true },
      { label: "Garantie anti-rejet du greffe", included: true },
      { label: "Juriste dédié jusqu'à l'immatriculation", included: true },
    ],
    cta: "Choisir Premium",
  },
  {
    id: "avocat",
    name: "Avocat",
    priceHT: 850,
    features: [
      { label: "Statuts rédigés sur mesure par un avocat", included: true },
      { label: "Préparation du dossier complet", included: true },
      { label: "Envoi au greffe", included: true },
      { label: "Accompagnement téléphonique, mail, RDV", included: true },
      { label: "Vérification par l'avocat sous 24h", included: true },
      { label: "Garantie anti-rejet du greffe", included: true },
      { label: "Avocat dédié jusqu'à l'immatriculation", included: true },
    ],
    cta: "Choisir Avocat",
  },
];

const FRAIS_ANNEXES = [
  { title: "Frais de greffe (immatriculation RCS)", amount: "37,45 €", tva: false, description: "Taxe fixe versée au Greffe du Tribunal de Commerce pour inscrire votre SASU au RCS. Montant fixé par arrêté, identique partout en France métropolitaine. Non soumis à TVA." },
  { title: "Publication d'annonce légale (JAL)", amount: "138,00 € HT (165,60 € TTC)", tva: true, description: "Forfait national fixe de 138 € HT (+ TVA 20 % = 165,60 € TTC) pour les SAS/SASU. Publication obligatoire dans un Journal d'Annonces Légales habilité dans le département du siège social." },
  { title: "Déclaration des bénéficiaires effectifs (DBE)", amount: "21,41 €", tva: false, description: "Obligation légale anti-blanchiment : déclaration des personnes physiques contrôlant la société (> 25 % du capital). Non soumis à TVA. Si déposée séparément : ~43,35 €." },
];

function PricingSection({ selected, onSelect }: { selected: string; onSelect: (val: string) => void }) {
  const [focusedPlan, setFocusedPlan] = useState<string>("premium");
  const [openFrais, setOpenFrais] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1 mb-8">
        <h2 className="text-2xl font-bold text-[#1E3A8A]">
          Choisissez la formule qui vous correspond le mieux
        </h2>
        <p className="text-gray-400 text-sm">
          + frais annexes obligatoires (~224,46 € TTC)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {PRICING_PLANS.map((plan) => (
          <div
            key={plan.id}
            onMouseEnter={() => setFocusedPlan(plan.id)}
            onClick={() => setFocusedPlan(plan.id)}
            className={cn(
              "relative rounded-2xl flex flex-col transition-all cursor-pointer",
              plan.featured
                ? "bg-gradient-to-b from-[#1E3A8A] to-[#2d52b8] text-white shadow-2xl p-6 md:-my-3"
                : focusedPlan === plan.id
                  ? "bg-white border-2 border-[#2563EB] p-5 shadow-md"
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
                <p className="pt-1">+ frais annexes obligatoires</p>
              </div>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); onSelect(plan.id); }}
              className={cn(
                "w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 mb-5",
                plan.featured
                  ? "bg-white text-[#1E3A8A] hover:bg-blue-50"
                  : selected === plan.id
                    ? "bg-[#2563EB] text-white"
                    : "border-2 border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB] hover:text-white"
              )}
            >
              {selected === plan.id ? (
                <><Check className="w-4 h-4" /> Sélectionné</>
              ) : plan.cta}
            </button>

            <ul className="space-y-2.5 flex-1">
              {plan.features.map((f) => (
                <li key={f.label} className="flex items-start gap-2">
                  {f.included ? (
                    <Check className={cn("w-4 h-4 mt-0.5 flex-shrink-0",
                      plan.featured ? "text-blue-300" : "text-[#2563EB]"
                    )} />
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

      {/* Frais annexes */}
      <div className="mt-8 space-y-3 max-w-2xl mx-auto w-full">
        <AccordionItem title="Frais annexes obligatoires (~196,86 € HT)">
          <div className="space-y-3">
            {FRAIS_ANNEXES.map((f) => (
              <div key={f.title}>
                <button
                  onClick={() => setOpenFrais(openFrais === f.title ? null : f.title)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="text-sm font-medium text-[#1E3A8A]">{f.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#2563EB]">{f.amount}</span>
                    <ChevronRight className={cn("w-4 h-4 text-gray-400 transition-transform", openFrais === f.title && "rotate-90")} />
                  </div>
                </button>
                {openFrais === f.title && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.description}</p>
                )}
              </div>
            ))}
          </div>
        </AccordionItem>

        <AccordionItem title={`Ce qui est inclus dans la formule ${PRICING_PLANS.find(p => p.id === focusedPlan)?.name ?? "Premium"}`}>
          <ul className="space-y-2.5 text-sm text-gray-600">
            {(PRICING_PLANS.find(p => p.id === focusedPlan) ?? PRICING_PLANS[1]).features.map((f) => (
              <li key={f.label} className="flex items-start gap-2">
                {f.included ? (
                  <Check className="w-4 h-4 text-[#2563EB] mt-0.5 flex-shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                )}
                <span className={f.included ? "text-gray-700" : "text-gray-300"}>{f.label}</span>
              </li>
            ))}
          </ul>
        </AccordionItem>
      </div>
    </div>
  );
}

/* ───────── Micro-entrepreneur Search ───────── */

interface SearchResult {
  siren: string;
  nom: string;
  ville?: string;
}

function MicroSearchSection({ onCompanyFound }: { onCompanyFound: (data: { denomination: string; siren: string; adresse: string }) => void }) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [found, setFound] = useState<{ denomination: string; siren: string; adresse: string } | null>(null);

  const handleSearch = async () => {
    if (search.length < 2) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setShowResults(false);
    try {
      const clean = search.replace(/\s/g, "");
      const isSiren = /^\d{9}$/.test(clean);
      if (isSiren) {
        const res = await fetch(`/api/siren?siren=${clean}`);
        if (res.ok) {
          const data = await res.json();
          const company = {
            denomination: data.denominationSociale || "",
            siren: clean,
            adresse: [data.siegeSocial, data.codePostal, data.ville].filter(Boolean).join(", "),
          };
          setFound(company);
          onCompanyFound(company);
        } else {
          setError("SIREN non trouvé");
        }
      } else {
        const res = await fetch(`/api/siren?nom=${encodeURIComponent(search)}&list=true`);
        if (res.ok) {
          const data = await res.json();
          if (data.resultats?.length > 0) {
            setResults(data.resultats);
            setShowResults(true);
          } else {
            setError("Aucune entreprise trouvée");
          }
        } else {
          setError("Aucune entreprise trouvée avec ce nom");
        }
      }
    } catch {
      setError("Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  const selectResult = async (result: SearchResult) => {
    setLoading(true);
    setShowResults(false);
    try {
      const res = await fetch(`/api/siren?siren=${result.siren}`);
      if (res.ok) {
        const data = await res.json();
        const company = {
          denomination: data.denominationSociale || result.nom,
          siren: result.siren,
          adresse: [data.siegeSocial, data.codePostal, data.ville].filter(Boolean).join(", "),
        };
        setFound(company);
        onCompanyFound(company);
        setSearch(result.nom);
      }
    } catch {
      const company = { denomination: result.nom, siren: result.siren, adresse: result.ville || "" };
      setFound(company);
      onCompanyFound(company);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-10">
      <h2 className="text-[16px] md:text-[18px] font-bold text-[#1E293B] mb-2 leading-snug">
        Recherchez votre micro-entreprise
      </h2>
      <p className="text-sm text-[#6B7280] leading-relaxed mb-4">
        Entrez le SIREN (9 chiffres) ou le nom commercial / dénomination de votre micro-entreprise
      </p>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="SIREN (9 chiffres) ou nom commercial de la micro-entreprise"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowResults(false); setResults([]); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            className="w-full px-5 py-4 rounded-lg border border-[#D1D5DB] focus:border-[#2563EB] focus:outline-none text-sm text-[#1E293B] bg-white transition-colors"
          />

          {/* Dropdown results */}
          {showResults && results.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-[#D1D5DB] rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectResult(r)}
                  className="w-full px-4 py-3 text-left hover:bg-[#EFF6FF] border-b border-gray-100 last:border-b-0 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium text-[#1E293B]">{r.nom}</div>
                    {r.ville && <div className="text-xs text-[#6B7280]">{r.ville}</div>}
                  </div>
                  <div className="text-sm text-[#2563EB] font-mono">{r.siren}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSearch}
          disabled={search.length < 2 || loading}
          className="px-6 py-4 rounded-lg bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1D4ED8] active:bg-[#1E40AF] disabled:bg-[#9CA3AF] transition-colors"
        >
          {loading ? "Recherche..." : "Rechercher"}
        </button>
      </div>

      {error && (
        <p className="text-amber-600 text-sm mt-2">{error}</p>
      )}

      <p className="text-xs text-[#6B7280] mt-2">
        Recherchez par SIREN (9 chiffres) ou par nom commercial (ex: MON ENTREPRISE)
      </p>

      {/* Company found card */}
      {found && (
        <div className="mt-4 p-5 rounded-xl border-2 border-[#2563EB] bg-[#EFF6FF]">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-[#2563EB] mt-0.5" />
            <div>
              <p className="font-bold text-[#1E293B]">{found.denomination}</p>
              <p className="text-sm text-[#6B7280] mt-1">SIREN : <span className="font-mono text-[#2563EB]">{found.siren}</span></p>
              {found.adresse && <p className="text-sm text-[#6B7280]">{found.adresse}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── Objet principal (catégories visuelles) ───────── */

const ACTIVITE_CATEGORIES = [
  {
    id: "aide_personne",
    label: "AIDE ET SERVICE\nÀ LA PERSONNE",
    emoji: "🏠",
    sousCategories: [
      "Assistance à domicile non réglementée",
      "Jardinage",
      "Entretien du domicile / ménage",
      "Soutien scolaire",
      "Garde des enfants +3 ans",
      "Garde tout public (y compris des personnes fragiles)",
      "Conseils bien-être / coaching personnel",
      "Coaching sportif",
      "Sophrologue / naturopathe",
      "Autre",
    ],
  },
  {
    id: "automobile",
    label: "AUTOMOBILE /\nTRANSPORT",
    emoji: "🚗",
    sousCategories: ["Transport de personnes (VTC)", "Transport de marchandises", "Location de véhicules", "Réparation automobile", "Autre"],
  },
  {
    id: "restauration",
    label: "BAR /\nRESTAURATION",
    emoji: "🍽️",
    sousCategories: ["Restaurant", "Bar / café", "Restauration rapide", "Traiteur", "Food truck", "Autre"],
  },
  {
    id: "batiment",
    label: "MÉTIERS DU\nBÂTIMENT",
    emoji: "🏗️",
    sousCategories: ["Maçonnerie", "Plomberie", "Électricité", "Peinture", "Menuiserie", "Carrelage", "Autre"],
  },
  {
    id: "coiffure",
    label: "COIFFURE /\nBIEN-ÊTRE",
    emoji: "✂️",
    sousCategories: ["Coiffure", "Esthétique", "Spa / massage", "Tatouage / piercing", "Autre"],
  },
  {
    id: "commerce",
    label: "COMMERCES /\nVENTE",
    emoji: "🏪",
    sousCategories: ["E-commerce", "Commerce de détail", "Commerce de gros", "Vente ambulante", "Autre"],
  },
  {
    id: "evenementiel",
    label: "ÉVÉNEMENTIEL /\nCULTURE",
    emoji: "🎪",
    sousCategories: ["Organisation d'événements", "Production audiovisuelle", "Photographie", "Musique / spectacle", "Autre"],
  },
  {
    id: "immobilier",
    label: "LOCATION /\nIMMOBILIER",
    emoji: "🔑",
    sousCategories: ["Agence immobilière", "Gestion locative", "Location meublée (LMNP)", "Promotion immobilière", "SCI", "Autre"],
  },
  {
    id: "conseil",
    label: "SERVICES DE\nCONSEILS",
    emoji: "💼",
    sousCategories: ["Conseil en management", "Conseil en stratégie", "Conseil RH", "Conseil financier", "Coaching professionnel", "Autre"],
  },
  {
    id: "informatique",
    label: "SERVICES\nINFORMATIQUES / WEB",
    emoji: "💻",
    sousCategories: ["Développement web / mobile", "Infogérance / hébergement", "Conseil en IT", "Cybersécurité", "Data / IA", "Design UI/UX", "Autre"],
  },
  {
    id: "autre",
    label: "AUTRE",
    emoji: "💬",
    sousCategories: ["Autre activité"],
  },
];

function PostPaymentObjetPrincipal({
  selected, sousCategorie, onSelect, onSousCategorie,
}: {
  selected: string; sousCategorie: string;
  onSelect: (val: string) => void; onSousCategorie: (val: string) => void;
}) {
  const activeCat = ACTIVITE_CATEGORIES.find((c) => c.id === selected);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
      </div>

      <AccordionItem title="Plus d'informations">
        <div className="text-base text-gray-600 space-y-2">
          <p>Sélectionnez la catégorie qui correspond le mieux à votre activité. Nous définirons ensuite votre objet social en détail.</p>
        </div>
      </AccordionItem>

      {/* Grille de catégories */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {ACTIVITE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { onSelect(cat.id); onSousCategorie(""); }}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all",
              selected === cat.id
                ? "border-[#2563EB] bg-blue-50 shadow-sm"
                : "border-gray-200 bg-white hover:border-[#2563EB]/50 hover:bg-blue-50/50"
            )}
          >
            <span className="text-3xl">{cat.emoji}</span>
            <span className={cn(
              "text-[10px] font-bold leading-tight whitespace-pre-line",
              selected === cat.id ? "text-[#1E3A8A]" : "text-gray-600"
            )}>
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* Sous-catégories */}
      {activeCat && (
        <div className="space-y-3">
          <p className="text-sm text-[#2563EB] font-medium">Vous avez sélectionné une activité principale</p>
          <p className="text-base font-bold text-[#1E3A8A]">Sous catégorie : {activeCat.label.replace(/\n/g, " ")}</p>
          <div className="flex flex-wrap gap-2">
            {activeCat.sousCategories.map((sc) => (
              <button
                key={sc}
                onClick={() => onSousCategorie(sc)}
                className={cn(
                  "px-4 py-2.5 rounded-xl border-2 text-base font-medium transition-all",
                  sousCategorie === sc
                    ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]"
                    : "border-gray-200 text-gray-600 hover:border-[#2563EB]/50"
                )}
              >
                {sc}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── Pre-payment questions (dissolution style) ───────── */

// Flat list of pre-payment question indices (before pricing)
const PRE_PAYMENT_QUESTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // indices into QUESTIONS[]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shouldShowQuestion(qIndex: number, answers: Record<string, any>): boolean {
  const q = QUESTIONS[qIndex];
  if (q.id === "action_micro" || q.id === "fermeture_micro") return answers.statut_micro === "oui";
  return true;
}

/* ───────── Main page ───────── */

type Phase = "intro" | "questions" | "brand_protection" | "micro_search" | "pricing" | "avocat_confirmation" | "post_payment";

export default function CreationSASUPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentQ, setCurrentQ] = useState(0); // index into activeQuestions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [postPage, setPostPage] = useState(0); // for post-payment pages

  // Handle Stripe return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const sessionId = params.get("session_id");
    const formule = params.get("formule");
    const stateKey = params.get("state");

    if (payment === "success" && sessionId) {
      // Verify payment server-side
      fetch(`/api/stripe/verify?session_id=${sessionId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.paid) {
            // Restore state from sessionStorage
            if (stateKey) {
              try {
                const saved = sessionStorage.getItem(stateKey);
                if (saved) {
                  const s = JSON.parse(saved);
                  // Restore all answers
                  Object.entries(s).forEach(([k, v]) => setAnswer(k, v));
                  sessionStorage.removeItem(stateKey);
                }
              } catch { /* ignore */ }
            }
            if (formule) setAnswer("formule", formule);
            setPhase("post_payment");
            setPostPage(0);
            // Save dossier to Supabase
            fetch("/api/dossiers", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: data.email,
                company_name: answers.nom_societe || "Création SASU",
                siren: "",
                forme_juridique: "SASU",
                type: "creation-sasu",
                status: "en_cours",
                stripe_session_id: sessionId,
                stripe_paid: true,
                data: { formule, ...answers },
              }),
            }).catch(() => {});
            // Clean URL
            window.history.replaceState({}, "", "/creation-sasu");
          }
        })
        .catch(() => {});
    } else if (payment === "cancel") {
      if (formule) setAnswer("formule", formule);
      setPhase("pricing");
      window.history.replaceState({}, "", "/creation-sasu");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setAnswer = (id: string, val: any) =>
    setAnswers((prev) => ({ ...prev, [id]: val }));

  // Build active pre-payment questions
  const activeQuestions = PRE_PAYMENT_QUESTIONS.filter((i) => shouldShowQuestion(i, answers));
  const totalQ = activeQuestions.length;
  const currentQIndex = activeQuestions[currentQ]; // actual QUESTIONS index
  const question = QUESTIONS[currentQIndex];

  // Post-payment pages (step 4: dossier juridique) — dynamic based on formule_capital
  const POST_PAGES = [
    { id: "denomination" },        // dénomination + sigle + nom commercial + enseigne
    { id: "type_structure" },      // classique / holding passive / holding animatrice
    { id: "objet_principal" },      // catégories visuelles + sous-catégories
    { id: "objet_social" },         // texte libre
    { id: "activite_description" }, // activité principale + secondaires + code NAF
    { id: "activite_saisonniere" }, // saisonnière / ambulante
    { id: "associe_unique" },       // type d'associé + infos + situation matrimoniale
    { id: "capital_social" },       // capital fixe/variable + montant + actions + formule
    { id: "depot_capital" },        // établissement bancaire + date dépôt + versement
    { id: "apport_associe" },      // apport de l'associé unique (si personnalisée)
    { id: "nomination_president" },  // nomination du président
    { id: "mandat_president" },     // règles du président (durée, révocation, rémunération, pouvoirs)
    { id: "beneficiaire_effectif" }, // déclaration des bénéficiaires effectifs (INPI/DBE)
    { id: "adresse_siege" },        // détermination siège social
    { id: "regles_statutaires" },  // règles organisation société (CAC etc) — modifier ou pas
    { id: "exercice_comptable" },   // date clôture exercice comptable
    { id: "services_comptables" }, // services comptables (si pas de CAC nommé)
    { id: "regles_cac" },          // commissaire aux comptes (si personnaliser)
    { id: "regles_duree" },        // durée de la société (si personnaliser)
    { id: "regles_transmission" }, // règles transmission/cession (si personnaliser)
    { id: "regles_nantissement" }, // nantissement + location actions (si personnaliser)
    { id: "regles_non_concurrence" },  // clause de non-concurrence (si personnaliser)
    { id: "regles_comptes_courants" }, // conditions comptes courants (si personnaliser)
    { id: "regime_fiscal" },        // impôts sur les bénéfices (IS / IR)
    { id: "regime_tva" },           // régime de TVA
    { id: "reprise_depenses" },    // reprise des dépenses engagées pour la société en formation
    { id: "date_lieu" },            // date et lieu de signature des statuts
    { id: "recapitulatif" },         // récapitulatif de toutes les informations
    { id: "justificatifs" },         // pièces justificatives à fournir
  ];

  // Skip conditional pages based on answers
  function shouldSkipPage(pageId: string | undefined): boolean {
    if (!pageId) return false;
    const customPages = ["regles_cac", "regles_duree", "regles_transmission", "regles_nantissement", "regles_non_concurrence", "regles_comptes_courants"];
    if (customPages.includes(pageId) && answers.regles_statutaires !== "personnaliser") return true;
    // Skip services_comptables if CAC is explicitly "oui"
    if (pageId === "services_comptables" && answers.nommer_cac === "oui") return true;
    // Skip apport_associe if formule simplifiée (100% numéraire, pas d'apport nature/industrie)
    if (pageId === "apport_associe" && answers.formule_capital !== "personnalisee") return true;
    return false;
  }

  // Helper to find page index by id
  function pageIndex(id: string): number {
    return POST_PAGES.findIndex((p) => p.id === id);
  }

  // Determine sidebar step from phase
  const sidebarStep =
    phase === "intro" ? 1 :
    phase === "questions" ? (question && ["qui_realise"].includes(question.id) ? 1 : 2) :
    phase === "brand_protection" || phase === "micro_search" ? 2 :
    phase === "pricing" || phase === "avocat_confirmation" ? 3 :
    phase === "post_payment" && POST_PAGES[postPage]?.id === "recapitulatif" ? 5 :
    phase === "post_payment" && POST_PAGES[postPage]?.id === "justificatifs" ? 6 :
    4;

  function goNextQuestion(freshAnswers?: Record<string, string>) {
    const a = freshAnswers ?? answers;
    const q = QUESTIONS[activeQuestions[currentQ]];

    // After certain questions, redirect to special pages
    if (q.id === "proteger_nom" && a.proteger_nom === "oui") {
      setPhase("brand_protection");
      return;
    }
    if (q.id === "statut_micro" && a.statut_micro === "oui") {
      // Show action_micro next (it's in the list)
    }
    if (q.id === "fermeture_micro" && a.statut_micro === "oui") {
      setPhase("micro_search");
      return;
    }
    if (q.id === "activite_artisanale") {
      // Last pre-payment question → go to pricing
      setPhase("pricing");
      return;
    }

    // Normal: advance to next question
    if (currentQ < totalQ - 1) {
      setCurrentQ((c) => c + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setPhase("pricing");
    }
  }

  function goPrevQuestion() {
    if (currentQ > 0) {
      setCurrentQ((c) => c - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setPhase("intro");
    }
  }

  function handleChoiceAnswer(val: string) {
    const q = QUESTIONS[activeQuestions[currentQ]];
    const freshAnswers = { ...answers, [q.id]: val };
    setAnswer(q.id, val);
    // Auto-advance on choice with fresh answers
    setTimeout(() => goNextQuestion(freshAnswers), 300);
  }

  function handleInputContinue() {
    goNextQuestion();
  }

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 fixed top-0 left-0 h-full z-20">
        <div className="p-6 border-b border-gray-100">
          <Link href="/">
            <Image src="/images/logo-legal-corners.svg" alt="LegalCorners" width={140} height={36} />
          </Link>
        </div>

        <div className="px-6 py-4 border-b border-gray-100">
          <p className="font-semibold text-[#1E3A8A] text-sm">Création d&apos;une SASU</p>
          <p className="text-sm text-gray-500 mt-0.5">Société par actions simplifiée unipersonnelle</p>
        </div>

        <div className="flex-1 px-6 py-6">
          <div className="space-y-1">
            {STEPS.map((s, index) => {
              const isActive = s.id === sidebarStep;
              const isCompleted = s.id < sidebarStep;
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                      isActive ? "bg-[#2563EB] text-white" :
                      isCompleted ? "bg-green-500 text-white" :
                      "bg-gray-100 text-gray-400"
                    )}>
                      {isCompleted ? <Check className="w-5 h-5" /> : s.id}
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={cn("w-0.5 h-8 mt-1", isCompleted ? "bg-green-500" : "bg-gray-200")} />
                    )}
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 pt-2 rounded-lg px-2 flex-1",
                    isActive ? "bg-blue-50 py-1" : ""
                  )}>
                    <Icon className={cn(
                      "w-4 h-4 flex-shrink-0",
                      isActive ? "text-[#2563EB]" : isCompleted ? "text-green-500" : "text-gray-400"
                    )} />
                    <p className={cn(
                      "text-sm font-medium flex-1",
                      isActive ? "text-[#1E3A8A]" : "text-gray-400"
                    )}>
                      {s.label}
                    </p>
                    {isActive && <ChevronRight className="w-4 h-4 text-[#2563EB]" />}
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
            <a href="mailto:support@legalcorners.fr" className="text-[#2563EB] text-sm font-medium">
              support@legalcorners.fr
            </a>
          </div>
        </div>
      </aside>

      {/* ── Mobile progress bar (visible only on mobile) ── */}
      <div className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-[#1E3A8A]">Création SASU</p>
          <p className="text-xs text-gray-500">
            {phase === "intro" ? "Bienvenue" :
             phase === "questions" ? `Question ${currentQ + 1}/${totalQ}` :
             phase === "pricing" ? "Tarifs" :
             phase === "post_payment" ? `Étape ${postPage + 1}/${POST_PAGES.length}` :
             ""}
          </p>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-full transition-all duration-300"
            style={{
              width: phase === "intro" ? "2%" :
                     phase === "questions" ? `${Math.max(5, ((currentQ + 1) / totalQ) * 30)}%` :
                     phase === "pricing" ? "35%" :
                     phase === "post_payment" ? `${35 + ((postPage + 1) / POST_PAGES.length) * 65}%` :
                     "50%"
            }}
          />
        </div>
      </div>

      {/* ── Main content ── */}
      <main className={cn(
        "flex-1 flex justify-center min-h-screen",
        phase === "questions" || phase === "intro" || phase === "brand_protection" || phase === "micro_search" || phase === "avocat_confirmation"
          ? "md:ml-72 p-4 sm:p-6 md:p-10 items-center"
          : phase === "pricing" || phase === "post_payment"
            ? "md:ml-72 p-4 sm:p-6 md:p-10 items-start pt-6 md:pt-10"
            : "md:ml-72 p-4 sm:p-6 items-start"
      )}>
        <div className={cn(
          "w-full",
          phase === "pricing" || phase === "brand_protection" || phase === "post_payment" ? "max-w-4xl" :
          "max-w-2xl"
        )}>
          <AnimatePresence mode="wait">

            {/* ══════ INTRO ══════ */}
            {phase === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10 max-w-2xl mx-auto w-full"
              >
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-[#2563EB]" strokeWidth={2.5} />
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold text-[#1E3A8A] leading-tight">
                    Créez votre <span className="text-[#2563EB]">SASU</span><br />en quelques minutes
                  </h1>
                  <p className="text-gray-700 font-medium">
                    Répondez à quelques questions, nous nous occupons du reste
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="space-y-3 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#1E3A8A] flex items-center justify-center">
                      <Clock className="w-7 h-7 text-white" />
                    </div>
                    <p className="font-bold text-[#1E3A8A] text-sm leading-snug">
                      5 à 10 minutes
                    </p>
                    <p className="text-xs text-gray-500 hidden sm:block">
                      Le questionnaire se remplit rapidement, à votre rythme.
                    </p>
                  </div>
                  <div className="space-y-3 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#1E3A8A] flex items-center justify-center">
                      <Shield className="w-7 h-7 text-white" />
                    </div>
                    <p className="font-bold text-[#1E3A8A] text-sm leading-snug">
                      100% conforme
                    </p>
                    <p className="text-xs text-gray-500 hidden sm:block">
                      Statuts conformes, dossier vérifié, envoi au greffe.
                    </p>
                  </div>
                  <div className="space-y-3 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#1E3A8A] flex items-center justify-center">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <p className="font-bold text-[#1E3A8A] text-sm leading-snug">
                      Experts disponibles
                    </p>
                    <p className="text-xs text-gray-500 hidden sm:block">
                      Notre équipe vous accompagne par mail et téléphone.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-center">
                  <button
                    onClick={() => { setPhase("questions"); setCurrentQ(0); }}
                    className="w-full py-4 bg-[#1E3A8A] hover:bg-[#162d6e] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-base"
                  >
                    Commencer la création <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════ QUESTIONS (dissolution style) ══════ */}
            {phase === "questions" && question && (
              <motion.div
                key={`q-${currentQIndex}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Question {currentQ + 1} sur {totalQ}</span>
                    <span>{Math.round((currentQ / totalQ) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
                      style={{ width: `${(currentQ / totalQ) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Question title */}
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-bold text-[#1E3A8A]">
                    {question.title}
                  </h2>
                  {question.description && (
                    <p className="text-gray-500 text-sm">{question.description}</p>
                  )}
                </div>

                {question.optional && (
                  <div className="flex justify-center">
                    <span className="px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded-full">
                      optionnel
                    </span>
                  </div>
                )}

                {/* Choice answers */}
                {question.type === "choice" && question.choices && (
                  <div className="space-y-3">
                    {question.choices.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => handleChoiceAnswer(c.value)}
                        className={cn(
                          "w-full flex items-center gap-4 p-5 rounded-xl border-2 bg-white text-left transition-all group text-base",
                          answers[question.id] === c.value
                            ? "border-[#2563EB] bg-blue-50"
                            : "border-gray-200 hover:border-[#2563EB] hover:bg-blue-50"
                        )}
                      >
                        <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 transition-colors">
                          <Sparkles className="w-6 h-6 text-[#2563EB]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-[#1E3A8A]">{c.label}</p>
                          {c.subtitle && <p className="text-sm text-gray-500 mt-0.5">{c.subtitle}</p>}
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#2563EB] flex-shrink-0 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Text input */}
                {question.type === "input" && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={answers[question.id] || ""}
                      onChange={(e) => setAnswer(question.id, e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && answers[question.id]) handleInputContinue(); }}
                      placeholder={question.placeholder}
                      className="w-full px-5 py-4 rounded-xl border-2 border-[#2563EB] bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-base"
                    />
                  </div>
                )}

                {/* Textarea */}
                {question.type === "textarea" && (
                  <div className="space-y-4">
                    <textarea
                      value={answers[question.id] || ""}
                      onChange={(e) => setAnswer(question.id, e.target.value)}
                      placeholder={question.placeholder}
                      rows={4}
                      className="w-full px-5 py-4 rounded-xl border-2 border-[#2563EB] bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-base resize-none"
                    />
                  </div>
                )}

                {question.hint && (
                  <p className="text-sm text-[#2563EB] italic text-center">{question.hint}</p>
                )}

                {/* Info accordion */}
                {question.info && (
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    <InfoAccordion title={question.info.title}>
                      {question.info.content}
                    </InfoAccordion>
                  </div>
                )}

                {/* Navigation for input/textarea types */}
                {(question.type === "input" || question.type === "textarea") && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={goPrevQuestion}
                      className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-base hover:bg-gray-50 transition-colors"
                    >
                      Retour
                    </button>
                    <button
                      onClick={handleInputContinue}
                      disabled={!answers[question.id]}
                      className="flex-1 py-3 rounded-xl bg-[#1E3A8A] text-white font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                      Continuer <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Back button for choice types */}
                {question.type === "choice" && (
                  <div className="text-center">
                    <button
                      onClick={goPrevQuestion}
                      className="text-gray-500 text-sm hover:text-[#1E3A8A] transition-colors"
                    >
                      ← Retour
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ══════ BRAND PROTECTION ══════ */}
            {phase === "brand_protection" && (
              <motion.div
                key="brand"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <BrandProtectionSection onPlanChange={(planId) => setAnswer("brand_plan", planId)} />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      // Go back to proteger_nom question
                      const idx = activeQuestions.findIndex((i) => QUESTIONS[i].id === "proteger_nom");
                      setCurrentQ(idx >= 0 ? idx : currentQ);
                      setPhase("questions");
                    }}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-base hover:bg-gray-50 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={() => {
                      // Continue to next question after proteger_nom
                      const idx = activeQuestions.findIndex((i) => QUESTIONS[i].id === "proteger_nom");
                      setCurrentQ(idx >= 0 ? idx + 1 : currentQ + 1);
                      setPhase("questions");
                    }}
                    className="flex-1 py-3 rounded-xl bg-[#1E3A8A] text-white font-semibold text-base hover:opacity-90 flex items-center justify-center gap-2"
                  >
                    Continuer <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════ MICRO SEARCH ══════ */}
            {phase === "micro_search" && (
              <motion.div
                key="micro-search"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <MicroSearchSection
                  onCompanyFound={(data) => {
                    setAnswers((prev) => ({
                      ...prev,
                      micro_denomination: data.denomination,
                      micro_siren: data.siren,
                      micro_adresse: data.adresse,
                    }));
                  }}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const idx = activeQuestions.findIndex((i) => QUESTIONS[i].id === "fermeture_micro");
                      setCurrentQ(idx >= 0 ? idx : currentQ);
                      setPhase("questions");
                    }}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-base hover:bg-gray-50 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={() => {
                      // Continue to demarrage
                      const idx = activeQuestions.findIndex((i) => QUESTIONS[i].id === "demarrage");
                      setCurrentQ(idx >= 0 ? idx : currentQ + 1);
                      setPhase("questions");
                    }}
                    className="flex-1 py-3 rounded-xl bg-[#1E3A8A] text-white font-semibold text-base hover:opacity-90 flex items-center justify-center gap-2"
                  >
                    Continuer <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════ PRICING ══════ */}
            {phase === "pricing" && (
              <motion.div
                key="pricing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <PricingSection
                  selected={answers.formule || ""}
                  onSelect={(val) => setAnswer("formule", val)}
                />

                {/* ── Récapitulatif des frais avant paiement ── */}
                {answers.formule && (() => {
                  const plan = PRICING_PLANS.find(p => p.id === answers.formule);
                  if (!plan) return null;
                  const optionsList: { id: string; label: string; ht: number }[] = [];
                  if (answers.fermeture_micro === "oui") optionsList.push({ id: "fermeture_micro", label: "Fermeture micro-entreprise", ht: 89 });
                  if (answers.activite_artisanale === "oui") optionsList.push({ id: "activite_artisanale", label: "Immatriculation CMA (artisanal)", ht: 79 });
                  if (answers.proteger_nom === "oui" && answers.brand_plan === "france") optionsList.push({ id: "brand_france", label: "Protection marque France (INPI)", ht: 269 });
                  if (answers.proteger_nom === "oui" && answers.brand_plan === "eu") optionsList.push({ id: "brand_eu", label: "Protection marque UE (EUIPO)", ht: 950 });
                  if (answers.proteger_nom === "oui" && answers.brand_plan === "international") optionsList.push({ id: "brand_international", label: "Protection marque International (OMPI)", ht: 1150 });
                  // Frais obligatoires (toujours inclus)
                  const fraisGreffe = 37.45; // exonéré TVA
                  const fraisJAL_HT = 138.00;
                  const fraisDBE = 21.41; // exonéré TVA

                  const totalOptionsHT = optionsList.reduce((s, o) => s + o.ht, 0);
                  const totalServicesHT = plan.priceHT + totalOptionsHT + fraisJAL_HT;
                  const totalServicesTVA = totalServicesHT * 0.2;
                  const totalServicesTTC = totalServicesHT * 1.2;
                  const totalFraisExoTVA = fraisGreffe + fraisDBE;
                  const totalTTC = totalServicesTTC + totalFraisExoTVA;

                  return (
                    <div className="bg-white border-2 border-[#2563EB] rounded-2xl p-5 space-y-3">
                      <p className="text-base font-bold text-[#1E3A8A]">Récapitulatif de votre commande</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Formule {plan.name}</span>
                          <span className="font-semibold text-gray-800">{plan.priceHT.toFixed(2)} € HT</span>
                        </div>
                        {optionsList.map((opt) => (
                          <div key={opt.id} className="flex justify-between">
                            <span className="text-gray-700">{opt.label}</span>
                            <span className="font-semibold text-gray-800">{opt.ht.toFixed(2)} € HT</span>
                          </div>
                        ))}
                        <div className="border-t border-gray-200 pt-2 mt-1">
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Frais obligatoires</p>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Frais de greffe (RCS)</span>
                          <span className="font-semibold text-gray-700">{fraisGreffe.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Annonce légale (JAL)</span>
                          <span className="font-semibold text-gray-700">{fraisJAL_HT.toFixed(2)} € HT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bénéficiaires effectifs (DBE)</span>
                          <span className="font-semibold text-gray-700">{fraisDBE.toFixed(2)} €</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 flex justify-between">
                          <span className="text-gray-700">TVA (20%)</span>
                          <span className="font-semibold text-gray-800">{totalServicesTVA.toFixed(2)} €</span>
                        </div>
                        <div className="border-t-2 border-[#1E3A8A] pt-2 flex justify-between text-base">
                          <span className="font-bold text-[#1E3A8A]">Total à payer TTC</span>
                          <span className="font-bold text-[#1E3A8A]">{totalTTC.toFixed(2)} €</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const idx = activeQuestions.findIndex((i) => QUESTIONS[i].id === "activite_artisanale");
                      setCurrentQ(idx >= 0 ? idx : totalQ - 1);
                      setPhase("questions");
                    }}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-base hover:bg-gray-50 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={async () => {
                      if (answers.formule === "avocat") {
                        setPhase("avocat_confirmation");
                        return;
                      }
                      // Collect selected options
                      const opts: string[] = [];
                      if (answers.fermeture_micro === "oui") opts.push("fermeture_micro");
                      if (answers.activite_artisanale === "oui") opts.push("activite_artisanale");
                      if (answers.proteger_nom === "oui" && answers.brand_plan === "france") opts.push("brand_france");
                      if (answers.proteger_nom === "oui" && answers.brand_plan === "eu") opts.push("brand_eu");
                      if (answers.proteger_nom === "oui" && answers.brand_plan === "international") opts.push("brand_international");
                      // Save state to sessionStorage before Stripe redirect
                      const stateKey = `lc_sasu_${Date.now()}`;
                      sessionStorage.setItem(stateKey, JSON.stringify(answers));
                      // Redirect to Stripe checkout
                      setAnswer("stripe_loading", "oui");
                      try {
                        const res = await fetch("/api/stripe/checkout-creation-sasu", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ formule: answers.formule, stateKey, options: opts }),
                        });
                        const data = await res.json();
                        if (data.url) {
                          window.location.href = data.url;
                        } else {
                          setAnswer("stripe_error", data.error || "Erreur lors du paiement");
                          setAnswer("stripe_loading", "");
                        }
                      } catch {
                        setAnswer("stripe_error", "Erreur de connexion au service de paiement");
                        setAnswer("stripe_loading", "");
                      }
                    }}
                    disabled={!answers.formule || answers.stripe_loading === "oui"}
                    className="flex-1 py-3 rounded-xl bg-[#1E3A8A] text-white font-semibold text-base hover:opacity-90 disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                    {answers.stripe_loading === "oui" ? "Redirection en cours..." : <>Payer et continuer <ArrowRight className="w-4 h-4" /></>}
                  </button>
                  {answers.stripe_error && <p className="text-sm text-red-500 text-center">{answers.stripe_error}</p>}
                </div>
              </motion.div>
            )}

            {/* ══════ AVOCAT CONFIRMATION ══════ */}
            {phase === "avocat_confirmation" && (
              <motion.div
                key="avocat-confirm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="rounded-xl border-2 border-[#2563EB] bg-[#EFF6FF] p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <CheckCircle2 className="w-16 h-16 text-[#2563EB]" />
                  </div>
                  <h2 className="text-[22px] font-bold text-[#1E293B] mb-3">
                    Dossier enregistré avec succès
                  </h2>
                  <p className="text-[#6B7280] leading-relaxed max-w-lg mx-auto mb-6">
                    Vous avez choisi la formule <strong className="text-[#2563EB]">Rédaction par un avocat</strong>.
                    Un avocat spécialisé va prendre contact avec vous <strong>sous 24h ouvrées</strong> pour
                    rédiger vos statuts sur mesure et vous accompagner dans votre création de SASU.
                  </p>
                  <div className="bg-white rounded-lg border border-[#D1D5DB] p-5 max-w-md mx-auto text-left">
                    <h3 className="font-semibold text-[#1E293B] mb-3">Récapitulatif tarifaire :</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Formule avocat</span>
                        <span className="font-semibold text-[#1E293B]">850,00 € HT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Frais annexes obligatoires</span>
                        <span className="font-semibold text-[#1E293B]">~196,86 € HT</span>
                      </div>
                      <div className="border-t border-[#E5E7EB] pt-2 flex justify-between">
                        <span className="font-bold text-[#1E293B]">Total estimé HT</span>
                        <span className="font-bold text-[#2563EB]">~1 046,86 € HT</span>
                      </div>
                      <p className="text-xs text-[#9CA3AF] mt-1">+ TVA applicable et options éventuelles</p>
                    </div>
                  </div>
                  <p className="text-sm text-[#6B7280] mt-6">
                    Vous recevrez un email de confirmation avec les détails de votre rendez-vous.
                  </p>
                </div>
                <div className="text-center">
                  <button
                    onClick={() => setPhase("pricing")}
                    className="text-gray-500 text-sm hover:text-[#1E3A8A] transition-colors"
                  >
                    ← Changer de formule
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════ POST-PAYMENT — Dissolution style ══════ */}
            {phase === "post_payment" && (
              <motion.div
                key={`post-${postPage}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Étape {postPage + 1} sur {POST_PAGES.length}</span>
                    <span>{Math.round((postPage / POST_PAGES.length) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
                      style={{ width: `${(postPage / POST_PAGES.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* ── Page 0: Dénomination sociale ── */}
                {POST_PAGES[postPage]?.id === "denomination" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>

                    <AccordionItem title="Plus d'informations">
                      <div className="text-base text-gray-600 space-y-2">
                        <p>La <strong className="text-[#1E3A8A]">dénomination sociale</strong> est le <strong>nom juridique officiel</strong> de la société. Vous pouvez aussi ajouter <strong>un sigle, un nom commercial</strong> ou <strong>une enseigne</strong>.</p>
                        <p>Ces informations seront reprises dans les statuts, les documents légaux et commerciaux.</p>
                      </div>
                    </AccordionItem>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-base font-bold text-[#1E3A8A] mb-1">Dénomination sociale (obligatoire)</label>
                        <p className="text-sm text-gray-500 mb-2">Nom juridique de la société, tel qu&apos;il figure dans les statuts et sur l&apos;extrait Kbis.</p>
                        <input
                          type="text"
                          value={answers.denomination_sociale || answers.nom_societe || ""}
                          onChange={(e) => setAnswer("denomination_sociale", e.target.value)}
                          placeholder="Ex : Altura Conseil"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-base font-bold text-[#1E3A8A] mb-1">Sigle (facultatif)</label>
                        <p className="text-sm text-gray-500 mb-2">Abréviation du nom de la société. Utilisé à titre interne ou pour simplifier la communication.</p>
                        <input
                          type="text"
                          value={answers.sigle || ""}
                          onChange={(e) => setAnswer("sigle", e.target.value)}
                          placeholder="AC (sigle d'Altura Conseil)"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nom commercial (facultatif)</label>
                        <p className="text-sm text-gray-500 mb-2">Nom utilisé dans le cadre de l&apos;activité commerciale. Il peut être différent de la dénomination sociale.</p>
                        <input
                          type="text"
                          value={answers.nom_commercial || ""}
                          onChange={(e) => setAnswer("nom_commercial", e.target.value)}
                          placeholder="Altura & Co (pour Altura Conseil)"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-base font-bold text-[#1E3A8A] mb-1">Enseigne (facultatif)</label>
                        <p className="text-sm text-gray-500 mb-2">Nom apposé en façade du local d&apos;exploitation, s&apos;il y a lieu. Elle identifie visuellement l&apos;établissement.</p>
                        <input
                          type="text"
                          value={answers.enseigne || ""}
                          onChange={(e) => setAnswer("enseigne", e.target.value)}
                          placeholder="Altura (enseigne visible en boutique)"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Page: Type de structure ── */}
                {POST_PAGES[postPage]?.id === "type_structure" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                      <p className="text-gray-500 text-sm">Quel type de structure souhaitez-vous créer ?</p>
                    </div>

                    <AccordionItem title="Quelle différence entre ces structures ?">
                      <div className="text-base text-gray-600 space-y-2">
                        <p><strong>Société classique (opérationnelle) :</strong> Exerce directement une activité commerciale, artisanale, libérale ou de services.</p>
                        <p><strong>Holding passive (pure) :</strong> Détient des participations dans d&apos;autres sociétés, perçoit des dividendes et plus-values. Aucune activité opérationnelle.</p>
                        <p><strong>Holding animatrice :</strong> Détient des participations ET anime activement ses filiales (direction stratégique, services de gestion). Permet de bénéficier du dispositif <strong>Dutreil</strong> et de l&apos;apport-cession (150-0 B ter CGI).</p>
                      </div>
                    </AccordionItem>

                    <div className="space-y-3">
                      {[
                        { value: "classique", label: "Société classique (opérationnelle)", subtitle: "Exerce directement une activité", icon: Building2 },
                        { value: "holding_passive", label: "Holding passive (pure)", subtitle: "Détention de participations uniquement", icon: Landmark },
                        { value: "holding_animatrice", label: "Holding animatrice", subtitle: "Détention + animation des filiales", icon: Users },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setAnswer("type_structure", opt.value)}
                          className={cn(
                            "w-full flex items-center gap-4 p-5 rounded-xl border-2 bg-white text-left transition-all group text-base",
                            answers.type_structure === opt.value
                              ? "border-[#2563EB] bg-blue-50"
                              : "border-gray-200 hover:border-[#2563EB] hover:bg-blue-50"
                          )}
                        >
                          <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 transition-colors">
                            <opt.icon className="w-6 h-6 text-[#2563EB]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-[#1E3A8A]">{opt.label}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{opt.subtitle}</p>
                          </div>
                          {answers.type_structure === opt.value && (
                            <Check className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Options spécifiques holding animatrice */}
                    {answers.type_structure === "holding_animatrice" && (
                      <div className="bg-blue-50 border border-[#2563EB]/20 rounded-xl p-5 space-y-4">
                        <p className="text-sm font-semibold text-[#1E3A8A]">Options holding animatrice</p>

                        <AccordionItem title="Comprendre ces options en langage simple">
                          <div className="text-sm text-gray-600 space-y-4 text-justify">
                            <div>
                              <p className="font-bold text-[#1E3A8A]">Convention de management fees</p>
                              <p>Votre holding facture des prestations à ses filiales (stratégie, comptabilité, RH, etc.). Cela permet de <strong>remonter du chiffre d&apos;affaires</strong> dans la holding et de <strong>déduire ces frais</strong> dans les filiales. En résumé : c&apos;est un moyen légal d&apos;organiser les flux financiers au sein du groupe.</p>
                            </div>
                            <div>
                              <p className="font-bold text-[#1E3A8A]">Convention de trésorerie (cash pooling)</p>
                              <p>La holding centralise la trésorerie de tout le groupe. Elle peut <strong>prêter de l&apos;argent à ses filiales</strong> ou inversement. C&apos;est comme une &quot;banque interne&quot; qui évite d&apos;avoir recours à un emprunt bancaire pour les besoins de trésorerie entre sociétés du groupe.</p>
                            </div>
                            <div>
                              <p className="font-bold text-[#1E3A8A]">Pacte Dutreil</p>
                              <p>Si vous envisagez de <strong>transmettre vos parts</strong> à vos enfants ou héritiers, le Pacte Dutreil permet une <strong>exonération de 75 % des droits de donation/succession</strong>. En échange, vous vous engagez à conserver les parts pendant au moins 2 ans (engagement collectif) puis 4 ans (engagement individuel).</p>
                            </div>
                          </div>
                        </AccordionItem>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-base font-bold text-[#1E3A8A] mb-1">Convention de management fees</label>
                            <p className="text-sm text-gray-500 mb-2">Facturation de prestations de direction aux filiales</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <button
                                onClick={() => setAnswer("management_fees", "oui")}
                                className={cn(
                                  "p-3 rounded-xl border-2 text-base font-medium transition-all",
                                  answers.management_fees === "oui" ? "border-[#2563EB] bg-white text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                )}
                              >
                                Oui
                              </button>
                              <button
                                onClick={() => setAnswer("management_fees", "non")}
                                className={cn(
                                  "p-3 rounded-xl border-2 text-base font-medium transition-all",
                                  answers.management_fees === "non" ? "border-[#2563EB] bg-white text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                )}
                              >
                                Non
                              </button>
                            </div>
                          </div>
                          {answers.management_fees === "oui" && (
                            <div className="mt-3 ml-4">
                              <label className="block text-base font-bold text-[#1E3A8A] mb-1">Pourcentage des management fees (% du CA filiale)</label>
                              <input type="text" value={answers.management_fees_pct || ""} onChange={(e) => setAnswer("management_fees_pct", e.target.value)} placeholder="Ex : 5" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                            </div>
                          )}

                          <div>
                            <label className="block text-base font-bold text-[#1E3A8A] mb-1">Convention de trésorerie (cash pooling)</label>
                            <p className="text-sm text-gray-500 mb-2">Centralisation de la trésorerie du groupe</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <button
                                onClick={() => setAnswer("cash_pooling", "oui")}
                                className={cn(
                                  "p-3 rounded-xl border-2 text-base font-medium transition-all",
                                  answers.cash_pooling === "oui" ? "border-[#2563EB] bg-white text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                )}
                              >
                                Oui
                              </button>
                              <button
                                onClick={() => setAnswer("cash_pooling", "non")}
                                className={cn(
                                  "p-3 rounded-xl border-2 text-base font-medium transition-all",
                                  answers.cash_pooling === "non" ? "border-[#2563EB] bg-white text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                )}
                              >
                                Non
                              </button>
                            </div>
                          </div>
                          {answers.cash_pooling === "oui" && (
                            <div className="mt-3 ml-4">
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-base font-bold text-[#1E3A8A] mb-1">Plafond par filiale et par exercice (€)</label>
                                  <input type="text" value={answers.cash_pooling_plafond || ""} onChange={(e) => setAnswer("cash_pooling_plafond", e.target.value)} placeholder="Ex : 500000" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                </div>
                                <div>
                                  <label className="block text-base font-bold text-[#1E3A8A] mb-1">Majoration du taux légal (points)</label>
                                  <input type="text" value={answers.cash_pooling_taux || ""} onChange={(e) => setAnswer("cash_pooling_taux", e.target.value)} placeholder="Ex : 2" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                </div>
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-base font-bold text-[#1E3A8A] mb-1">Pacte Dutreil (transmission)</label>
                            <p className="text-sm text-gray-500 mb-2">Prévoir un engagement de conservation pour bénéficier de l&apos;exonération Dutreil (art. 787 B CGI)</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <button
                                onClick={() => setAnswer("pacte_dutreil", "oui")}
                                className={cn(
                                  "p-3 rounded-xl border-2 text-base font-medium transition-all",
                                  answers.pacte_dutreil === "oui" ? "border-[#2563EB] bg-white text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                )}
                              >
                                Oui
                              </button>
                              <button
                                onClick={() => setAnswer("pacte_dutreil", "non")}
                                className={cn(
                                  "p-3 rounded-xl border-2 text-base font-medium transition-all",
                                  answers.pacte_dutreil === "non" ? "border-[#2563EB] bg-white text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                )}
                              >
                                Non
                              </button>
                            </div>
                          </div>
                          {answers.pacte_dutreil === "oui" && (
                            <div className="mt-3 ml-4">
                              <label className="block text-base font-bold text-[#1E3A8A] mb-1">Durée de l&apos;engagement collectif de conservation (années)</label>
                              <input type="text" value={answers.pacte_dutreil_duree || ""} onChange={(e) => setAnswer("pacte_dutreil_duree", e.target.value)} placeholder="Ex : 2" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Info holding passive */}
                    {answers.type_structure === "holding_passive" && (
                      <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">
                        <p className="text-base text-yellow-800">
                          <strong>Attention :</strong> Une holding passive ne peut pas bénéficier du dispositif Dutreil ni de l&apos;exonération d&apos;ISF/IFI sur les biens professionnels. Si vous envisagez une transmission patrimoniale, la holding animatrice est plus avantageuse.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Page 1: Objet principal (catégories visuelles) ── */}
                {POST_PAGES[postPage]?.id === "objet_principal" && (
                  <PostPaymentObjetPrincipal
                    selected={answers.objet_principal || ""}
                    sousCategorie={answers.sous_categorie || ""}
                    onSelect={(val) => setAnswer("objet_principal", val)}
                    onSousCategorie={(val) => setAnswer("sous_categorie", val)}
                  />
                )}

                {/* ── Page 2: Objet social (2 options: manuelle / IA) ── */}
                {POST_PAGES[postPage]?.id === "objet_social" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>

                    {/* Option 1: Rédaction manuelle */}
                    <div className="border border-gray-200 rounded-xl p-5 space-y-3">
                      <h3 className="text-lg font-bold text-[#1E3A8A]">Option 1 – Rédaction manuelle complète</h3>
                      <p className="text-base text-gray-600">
                        Vous rédigez vous-même votre objet social. Les champs peuvent être préremplis selon les activités choisies à l&apos;étape précédente (modifiable), ou vous pouvez les compléter maintenant. Vous écrivez ensuite votre objet social directement dans l&apos;encadré prévu à cet effet.
                      </p>
                    </div>

                    {/* Option 2: Assistance IA */}
                    <div className="border-2 border-[#2563EB] rounded-xl p-5 space-y-4 bg-[#EFF6FF]">
                      <h3 className="text-lg font-bold text-[#1E3A8A]">Option 2 – Assistance à la rédaction par notre intelligence artificielle</h3>
                      <p className="text-base text-gray-600">
                        Nous avons prévu l&apos;aide de notre intelligence artificielle afin de vous aider à la rédaction, vous pouvez modifier le texte par vous même si besoin. Il vous faudra ajouter vos activités principales si cela n&apos;a pas été choisi dans la page précédente.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-base font-bold text-[#1E3A8A] mb-1">Activité principale</label>
                          <input
                            type="text"
                            value={answers.activite_principale_desc || answers.sous_categorie || ""}
                            onChange={(e) => setAnswer("activite_principale_desc", e.target.value)}
                            placeholder="Ex : Soutien scolaire"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 bg-white transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-base font-bold text-[#1E3A8A] mb-1">Activités secondaires <span className="font-normal text-gray-400">facultatif</span></label>
                          <input
                            type="text"
                            value={answers.activites_secondaires || ""}
                            onChange={(e) => setAnswer("activites_secondaires", e.target.value)}
                            placeholder="Ex : Formation en ligne, vente de supports"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 bg-white transition-all"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={async () => {
                            const principale = answers.activite_principale_desc || answers.sous_categorie || "";
                            if (!principale) return;
                            setAnswer("objet_social_loading", "true");
                            try {
                              const res = await fetch("/api/generate-objet-social", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  activite_principale: principale,
                                  activites_secondaires: answers.activites_secondaires || "",
                                  type_structure: answers.type_structure || "classique",
                                }),
                              });
                              if (res.ok) {
                                const data = await res.json();
                                setAnswer("objet_social", data.objet_social);
                              }
                            } catch { /* ignore */ }
                            setAnswer("objet_social_loading", "");
                          }}
                          disabled={(!answers.activite_principale_desc && !answers.sous_categorie) || answers.objet_social_loading === "true"}
                          className="px-6 py-3 rounded-xl bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1D4ED8] active:bg-[#1E40AF] disabled:bg-[#9CA3AF] transition-colors flex items-center gap-2"
                        >
                          {answers.objet_social_loading === "true" ? (
                            <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Rédaction en cours…</>
                          ) : (
                            <><Sparkles className="w-4 h-4" /> Rédiger mon objet social (IA avocat)</>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Popup modal for objet social preview */}
                    {answers.show_objet_popup === "true" && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-[#1E3A8A]">Aperçu de l&apos;objet social</h3>
                            <button onClick={() => setAnswer("show_objet_popup", "")} className="p-1 hover:bg-gray-100 rounded-lg">
                              <X className="w-5 h-5 text-gray-500" />
                            </button>
                          </div>
                          <textarea
                            value={answers.objet_social || ""}
                            onChange={(e) => setAnswer("objet_social", e.target.value)}
                            rows={8}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 resize-none"
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={() => setAnswer("show_objet_popup", "")}
                              className="px-6 py-3 rounded-xl bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1D4ED8] transition-colors"
                            >
                              Valider
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Zone de rédaction finale */}
                    <textarea
                      value={answers.objet_social || ""}
                      onChange={(e) => setAnswer("objet_social", e.target.value)}
                      placeholder="Ex : La prestation de services en matière de conseil en stratégie digitale, le développement de sites web et d'applications mobiles..."
                      rows={6}
                      className="w-full px-5 py-4 rounded-xl border-2 border-[#2563EB] bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-base resize-none"
                    />

                    {/* Phrase balai — aperçu (ajoutée automatiquement dans les statuts) */}
                    {answers.objet_social && (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Aperçu dans les statuts :</p>
                        <p className="text-sm text-gray-700 leading-relaxed">La Société a pour objet :</p>
                        <p className="text-sm text-gray-800 leading-relaxed">{answers.objet_social}</p>
                        <p className="text-sm text-gray-600 italic leading-relaxed">Et, plus généralement, toutes opérations économiques, juridiques, industrielles, commerciales, civiles, financières, mobilières ou immobilières se rapportant directement ou indirectement à l&apos;objet social ainsi défini, ou à tous objets similaires, connexes ou complémentaires, susceptibles d&apos;en favoriser l&apos;extension ou le développement, tant en France qu&apos;à l&apos;étranger, pour son compte ou pour le compte de tiers, seule ou en participation.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Page 3: Activité principale + secondaires ── */}
                {POST_PAGES[postPage]?.id === "activite_description" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>

                    <AccordionItem title="Plus d'informations">
                      <div className="text-base text-gray-600 space-y-2">
                        <p>L&apos;activité principale est celle qui génère le plus de chiffre d&apos;affaires. Les activités secondaires sont complémentaires.</p>
                        <p>Ces informations permettent de déterminer votre <strong>code NAF</strong> et de vérifier les obligations réglementaires.</p>
                      </div>
                    </AccordionItem>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-base font-bold text-[#1E3A8A] mb-1">
                          Parmi les activités mentionnées dans votre objet social, quelle est l&apos;activité principale de votre société ?
                        </label>
                        <p className="text-sm text-gray-500 mb-2">(exemple : salon de coiffure, travaux de plomberie, vente en ligne de vêtements, conseil en gestion, etc.) Décrivez en quelques mots ce que fait votre entreprise au quotidien.</p>
                        <input
                          type="text"
                          value={answers.activite_principale_desc || ""}
                          onChange={(e) => setAnswer("activite_principale_desc", e.target.value)}
                          placeholder="Ex : Soutien scolaire"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-base font-bold text-[#1E3A8A] mb-1">
                          Votre société exercera-t-elle d&apos;autres activités secondaires (mentionnées dans l&apos;objet social) ?
                        </label>
                        <p className="text-sm text-gray-500 mb-2">Si oui merci de le préciser de manière simple (Exemples : vente de produits liés à l&apos;activité, formation, maintenance, prestation complémentaire, etc.)</p>
                        <input
                          type="text"
                          value={answers.activites_secondaires || ""}
                          onChange={(e) => setAnswer("activites_secondaires", e.target.value)}
                          placeholder="Ex : Formation en ligne, vente de supports pédagogiques"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                        />
                      </div>
                    </div>

                    {/* Bouton analyse IA */}
                    {answers.activite_principale_desc && (
                      <div className="space-y-4">
                        <button
                          onClick={async () => {
                            setAnswer("analyse_activite_loading", "oui");
                            setAnswer("analyse_activite_error", "");
                            try {
                              const res = await fetch("/api/analyse-activite", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  activite_principale: answers.activite_principale_desc,
                                  activites_secondaires: answers.activites_secondaires,
                                }),
                              });
                              if (!res.ok) throw new Error("Erreur API");
                              const data = await res.json();
                              setAnswer("code_naf", data.code_naf || "");
                              setAnswer("libelle_naf", data.libelle_naf || "");
                              setAnswer("est_reglementee", data.est_reglementee ? "oui" : "non");
                              if (data.reglementation && data.est_reglementee) {
                                setAnswer("reglementation_description", data.reglementation.description || "");
                                setAnswer("reglementation_conditions", JSON.stringify(data.reglementation.conditions || []));
                                setAnswer("reglementation_justificatifs", JSON.stringify(data.reglementation.justificatifs || []));
                                setAnswer("reglementation_autorite", data.reglementation.autorite_competente || "");
                              } else {
                                setAnswer("reglementation_description", "");
                                setAnswer("reglementation_conditions", "");
                                setAnswer("reglementation_justificatifs", "");
                                setAnswer("reglementation_autorite", "");
                              }
                            } catch {
                              setAnswer("analyse_activite_error", "Erreur lors de l'analyse. Réessayez.");
                            } finally {
                              setAnswer("analyse_activite_loading", "");
                            }
                          }}
                          disabled={answers.analyse_activite_loading === "oui"}
                          className="w-full py-3 rounded-xl bg-[#7C3AED] text-white font-semibold text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Sparkles className="w-4 h-4" />
                          {answers.analyse_activite_loading === "oui" ? "Analyse en cours..." : "Analyser mon activité (code NAF + réglementation)"}
                        </button>

                        {answers.analyse_activite_error && (
                          <p className="text-sm text-red-500">{answers.analyse_activite_error}</p>
                        )}

                        {/* Résultat code NAF */}
                        {answers.code_naf && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                            <p className="text-base font-bold text-[#1E3A8A] flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-[#7C3AED]" /> Code NAF suggéré
                            </p>
                            <p className="text-base text-[#1E3A8A]">
                              <strong>{answers.code_naf}</strong> — {answers.libelle_naf}
                            </p>
                            <p className="text-xs text-gray-500 italic">Le code NAF définitif sera attribué par l&apos;INSEE lors de l&apos;immatriculation.</p>
                          </div>
                        )}

                        {/* Résultat activité réglementée */}
                        {answers.est_reglementee === "oui" && (
                          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
                            <p className="text-base font-bold text-amber-800 flex items-center gap-2">
                              ⚠️ Activité réglementée détectée
                            </p>
                            <p className="text-xs text-amber-700 italic font-semibold">Les justificatifs ci-dessous vous seront demandés à l&apos;étape &quot;Pièces justificatives&quot;.</p>
                            {answers.reglementation_description && (
                              <p className="text-sm text-amber-700">{answers.reglementation_description}</p>
                            )}
                            {answers.reglementation_conditions && (() => {
                              try {
                                const conditions = JSON.parse(answers.reglementation_conditions);
                                if (conditions.length > 0) return (
                                  <div>
                                    <p className="text-sm font-bold text-amber-800">Conditions requises :</p>
                                    <ul className="list-disc pl-5 text-sm text-amber-700 space-y-1">
                                      {conditions.map((c: string, i: number) => <li key={i}>{c}</li>)}
                                    </ul>
                                  </div>
                                );
                              } catch { /* ignore parse errors */ }
                              return null;
                            })()}
                            {answers.reglementation_justificatifs && (() => {
                              try {
                                const justifs = JSON.parse(answers.reglementation_justificatifs);
                                if (justifs.length > 0) return (
                                  <div>
                                    <p className="text-sm font-bold text-amber-800">Justificatifs à fournir :</p>
                                    <ul className="list-disc pl-5 text-sm text-amber-700 space-y-1">
                                      {justifs.map((j: string, i: number) => <li key={i}>{j}</li>)}
                                    </ul>
                                  </div>
                                );
                              } catch { /* ignore parse errors */ }
                              return null;
                            })()}
                            {answers.reglementation_autorite && (
                              <p className="text-sm text-amber-700"><strong>Autorité compétente :</strong> {answers.reglementation_autorite}</p>
                            )}
                          </div>
                        )}

                        {answers.est_reglementee === "non" && (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <p className="text-sm text-green-800 flex items-center gap-2">
                              <Check className="w-4 h-4" /> <strong>Activité non réglementée</strong> — Aucune condition particulière requise pour cette activité.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Page 4: Activité saisonnière / ambulante ── */}
                {POST_PAGES[postPage]?.id === "activite_saisonniere" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>

                    <div className="space-y-3">
                      {[
                        { value: "saisonniere", label: "Oui une des activités est saisonnière" },
                        { value: "ambulante", label: "Oui une des activités est ambulante" },
                        { value: "ni_lun_ni_lautre", label: "Ni l'un ni l'autre" },
                      ].map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setAnswer("activite_saisonniere", c.value)}
                          className={cn(
                            "w-full flex items-center gap-4 p-5 rounded-xl border-2 bg-white text-left transition-all group text-base",
                            answers.activite_saisonniere === c.value
                              ? "border-[#2563EB] bg-blue-50"
                              : "border-gray-200 hover:border-[#2563EB] hover:bg-blue-50"
                          )}
                        >
                          <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 transition-colors">
                            <Sparkles className="w-6 h-6 text-[#2563EB]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-[#1E3A8A]">{c.label}</p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#2563EB] flex-shrink-0 transition-colors" />
                        </button>
                      ))}
                    </div>

                    <AccordionItem title="Plus d'informations">
                      <div className="text-sm text-gray-600 space-y-3">
                        <p><strong className="text-[#1E3A8A]">Qu&apos;est ce qu&apos;une activité saisonnière ou ambulante ?</strong></p>
                        <p>Il s&apos;agit d&apos;un type d&apos;activité professionnelle exercée de façon temporaire ou non sédentaire, souvent soumise à des règles particulières (déclarations, autorisations, régimes sociaux spécifiques).</p>
                        <p><strong>Exemple d&apos;activité ambulante</strong> : Vente sur les marchés, foires, brocantes</p>
                        <p><strong>Exemple d&apos;activité saisonnière</strong> : Travail dans les stations de ski l&apos;hiver ou ventes de glace sur plage</p>
                      </div>
                    </AccordionItem>
                  </div>
                )}

                {/* ── Page 5: Associé unique ── */}
                {POST_PAGES[postPage]?.id === "associe_unique" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>

                    {/* Info block */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
                      <p className="text-base text-gray-700">Une SASU ne comporte qu&apos;un seul associé, appelé <strong className="text-[#1E3A8A]">associé unique</strong>.</p>
                      <p className="text-base text-gray-700">Veuillez renseigner :</p>
                      <ul className="text-base text-gray-700 list-disc pl-5 space-y-1">
                        <li><em className="text-[#2563EB] font-medium">ses informations personnelles</em></li>
                        <li><em className="text-[#2563EB] font-medium">sa résidence fiscale</em></li>
                      </ul>
                      <p className="text-base text-gray-700">Une fois les informations saisies, cliquez sur <strong>&quot;Valider&quot;</strong> pour enregistrer l&apos;associé unique.</p>
                    </div>

                    {/* Type d'associé */}
                    <div className="space-y-3">
                      <p className="text-base font-bold text-[#1E3A8A]">Type d&apos;associé :</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => setAnswer("type_associe", "physique")}
                          className={cn(
                            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                            answers.type_associe === "physique"
                              ? "border-[#2563EB] bg-blue-50"
                              : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                          )}
                        >
                          <User className="w-10 h-10 text-[#2563EB]" />
                          <span className="text-sm font-medium text-[#2563EB]">Particulier (personne physique)</span>
                        </button>
                        <button
                          onClick={() => setAnswer("type_associe", "morale")}
                          className={cn(
                            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                            answers.type_associe === "morale"
                              ? "border-[#2563EB] bg-blue-50"
                              : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                          )}
                        >
                          <Building2 className="w-10 h-10 text-[#2563EB]" />
                          <span className="text-sm font-medium text-[#2563EB]">Société (personne morale)</span>
                        </button>
                      </div>
                    </div>

                    {/* Formulaire associé physique */}
                    {answers.type_associe === "physique" && (
                      <div className="space-y-4 border-t border-gray-200 pt-5">
                        <div className="space-y-2">
                          <label className="block text-base font-bold text-[#1E3A8A]">Civilité</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              onClick={() => setAnswer("associe_civilite", "M.")}
                              className={cn(
                                "p-3 rounded-xl border-2 text-base font-medium transition-all",
                                answers.associe_civilite === "M."
                                  ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]"
                                  : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                              )}
                            >
                              Monsieur
                            </button>
                            <button
                              onClick={() => setAnswer("associe_civilite", "Mme")}
                              className={cn(
                                "p-3 rounded-xl border-2 text-base font-medium transition-all",
                                answers.associe_civilite === "Mme"
                                  ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]"
                                  : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                              )}
                            >
                              Madame
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nom</label>
                            <input
                              type="text"
                              value={answers.associe_nom || ""}
                              onChange={(e) => setAnswer("associe_nom", e.target.value)}
                              placeholder="Nom de famille"
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-base font-bold text-[#1E3A8A] mb-1">Prénom</label>
                            <input
                              type="text"
                              value={answers.associe_prenom || ""}
                              onChange={(e) => setAnswer("associe_prenom", e.target.value)}
                              placeholder="Prénom"
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-base font-bold text-[#1E3A8A] mb-1">Date de naissance</label>
                          <input
                            type="date"
                            value={answers.associe_date_naissance || ""}
                            onChange={(e) => setAnswer("associe_date_naissance", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                          />
                        </div>

                        {/* Mineur émancipé */}
                        {(() => {
                          if (!answers.associe_date_naissance) return null;
                          const birth = new Date(answers.associe_date_naissance);
                          const today = new Date();
                          let age = today.getFullYear() - birth.getFullYear();
                          const m = today.getMonth() - birth.getMonth();
                          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                          if (age >= 18) return null;
                          return (
                            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
                              <p className="text-sm font-semibold text-amber-800">L&apos;associé a moins de 18 ans. Un mineur ne peut créer une SASU que s&apos;il est émancipé.</p>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => setAnswer("associe_emancipe", "oui")}
                                  className={cn("flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all", answers.associe_emancipe === "oui" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50")}
                                >
                                  Oui, mineur émancipé
                                </button>
                                <button
                                  onClick={() => setAnswer("associe_emancipe", "non")}
                                  className={cn("flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all", answers.associe_emancipe === "non" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 bg-white text-gray-600 hover:border-red-300")}
                                >
                                  Non
                                </button>
                              </div>
                              {answers.associe_emancipe === "non" && (
                                <p className="text-sm text-red-600 font-medium">Un mineur non émancipé ne peut pas être associé unique d&apos;une SASU. Veuillez vérifier la date de naissance.</p>
                              )}
                              {answers.associe_emancipe === "oui" && (
                                <p className="text-sm text-green-700">Un justificatif d&apos;émancipation (jugement du tribunal) vous sera demandé dans la section pièces justificatives.</p>
                              )}
                            </div>
                          );
                        })()}

                        <div>
                          <label className="block text-base font-bold text-[#1E3A8A] mb-1">Lieu de naissance</label>
                          <input
                            type="text"
                            value={answers.associe_lieu_naissance || ""}
                            onChange={(e) => setAnswer("associe_lieu_naissance", e.target.value)}
                            placeholder="Ville de naissance"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nationalité</label>
                          <input
                            type="text"
                            value={answers.associe_nationalite || ""}
                            onChange={(e) => setAnswer("associe_nationalite", e.target.value)}
                            placeholder="Ex : Française"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-base font-bold text-[#1E3A8A] mb-1">Adresse de résidence fiscale</label>
                          <AddressAutocomplete
                            value={answers.associe_adresse || ""}
                            onChange={(v) => setAnswer("associe_adresse", v)}
                            placeholder="Adresse complète"
                          />
                        </div>

                        {/* Résidence fiscale */}
                        <div className="border-t border-gray-200 pt-4 space-y-3">
                          <label className="block text-base font-bold text-[#1E3A8A]">Résidence fiscale</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              onClick={() => setAnswer("resident_fiscal", "oui")}
                              className={cn(
                                "p-3 rounded-xl border-2 text-base font-medium transition-all",
                                (answers.resident_fiscal || "oui") === "oui"
                                  ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]"
                                  : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                              )}
                            >
                              Résident(e) fiscal(e) français(e)
                            </button>
                            <button
                              onClick={() => setAnswer("resident_fiscal", "non")}
                              className={cn(
                                "p-3 rounded-xl border-2 text-base font-medium transition-all",
                                answers.resident_fiscal === "non"
                                  ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]"
                                  : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                              )}
                            >
                              Non-résident(e) fiscal(e)
                            </button>
                          </div>
                          {answers.resident_fiscal === "non" && (
                            <div>
                              <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Pays de résidence fiscale</label>
                              <input
                                type="text"
                                value={answers.pays_residence_fiscale || ""}
                                onChange={(e) => setAnswer("pays_residence_fiscale", e.target.value)}
                                placeholder="Ex : Suisse, Luxembourg..."
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                              />
                            </div>
                          )}
                        </div>

                        {/* Situation matrimoniale */}
                        <div className="border-t border-gray-200 pt-4 space-y-3">
                          <label className="flex items-center gap-2 text-base font-bold text-[#1E3A8A]">
                            <Heart className="w-4 h-4" />
                            Situation matrimoniale
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                              { value: "celibataire", label: "Célibataire" },
                              { value: "marie", label: "Marié(e)" },
                              { value: "pacse", label: "Pacsé(e)" },
                              { value: "divorce", label: "Divorcé(e)" },
                              { value: "veuf", label: "Veuf/Veuve" },
                            ].map((s) => (
                              <button
                                key={s.value}
                                onClick={() => setAnswer("situation_matrimoniale", s.value)}
                                className={cn(
                                  "p-3 rounded-xl border-2 text-base font-medium transition-all",
                                  answers.situation_matrimoniale === s.value
                                    ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                )}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>

                          {/* Si marié : régime matrimonial */}
                          {answers.situation_matrimoniale === "marie" && (
                            <div className="space-y-3 pl-2 border-l-2 border-[#2563EB]/30 ml-2">
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Civilité du conjoint</label>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <button
                                      onClick={() => setAnswer("conjoint_civilite", "M.")}
                                      className={cn(
                                        "p-2 rounded-xl border-2 text-sm font-medium transition-all",
                                        answers.conjoint_civilite === "M."
                                          ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]"
                                          : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                      )}
                                    >
                                      Monsieur
                                    </button>
                                    <button
                                      onClick={() => setAnswer("conjoint_civilite", "Mme")}
                                      className={cn(
                                        "p-2 rounded-xl border-2 text-sm font-medium transition-all",
                                        answers.conjoint_civilite === "Mme"
                                          ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]"
                                          : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                      )}
                                    >
                                      Madame
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Prénom du conjoint</label>
                                    <input
                                      type="text"
                                      value={answers.conjoint_prenom || ""}
                                      onChange={(e) => setAnswer("conjoint_prenom", e.target.value)}
                                      placeholder="Prénom"
                                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Nom du conjoint</label>
                                    <input
                                      type="text"
                                      value={answers.conjoint_nom || ""}
                                      onChange={(e) => setAnswer("conjoint_nom", e.target.value)}
                                      placeholder="Nom de famille"
                                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Régime matrimonial</label>
                                <div className="space-y-2">
                                  {[
                                    { value: "communaute_reduite", label: "Communauté réduite aux acquêts (défaut)" },
                                    { value: "separation_biens", label: "Séparation de biens" },
                                    { value: "participation_acquets", label: "Participation aux acquêts" },
                                    { value: "communaute_universelle", label: "Communauté universelle" },
                                  ].map((r) => (
                                    <button
                                      key={r.value}
                                      onClick={() => setAnswer("regime_matrimonial", r.value)}
                                      className={cn(
                                        "w-full text-left p-3 rounded-xl border-2 text-sm transition-all",
                                        answers.regime_matrimonial === r.value
                                          ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A] font-medium"
                                          : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                      )}
                                    >
                                      {r.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Si pacsé : nom du partenaire */}
                          {answers.situation_matrimoniale === "pacse" && (
                            <div className="space-y-3 pl-2 border-l-2 border-[#2563EB]/30 ml-2">
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Civilité du partenaire</label>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <button
                                      onClick={() => setAnswer("conjoint_civilite", "M.")}
                                      className={cn(
                                        "p-2 rounded-xl border-2 text-sm font-medium transition-all",
                                        answers.conjoint_civilite === "M."
                                          ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]"
                                          : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                      )}
                                    >
                                      Monsieur
                                    </button>
                                    <button
                                      onClick={() => setAnswer("conjoint_civilite", "Mme")}
                                      className={cn(
                                        "p-2 rounded-xl border-2 text-sm font-medium transition-all",
                                        answers.conjoint_civilite === "Mme"
                                          ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]"
                                          : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                      )}
                                    >
                                      Madame
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Prénom du partenaire</label>
                                    <input
                                      type="text"
                                      value={answers.conjoint_prenom || ""}
                                      onChange={(e) => setAnswer("conjoint_prenom", e.target.value)}
                                      placeholder="Prénom"
                                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Nom du partenaire</label>
                                    <input
                                      type="text"
                                      value={answers.conjoint_nom || ""}
                                      onChange={(e) => setAnswer("conjoint_nom", e.target.value)}
                                      placeholder="Nom de famille"
                                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Formulaire associé morale */}
                    {answers.type_associe === "morale" && (
                      <div className="space-y-4 border-t border-gray-200 pt-5">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                          <p className="text-base text-gray-700">Indiquez le numéro SIREN de la société associée pour retrouver automatiquement ses informations dans le registre officiel.</p>
                          <p className="text-base text-gray-700">Vous trouverez ce numéro sur votre extrait Kbis.</p>
                          <div className="flex justify-end">
                            <button onClick={() => setAnswer("associe_societe_mode", "manuel")} className="px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-sm font-semibold hover:opacity-90 transition-opacity">Remplir manuellement</button>
                          </div>
                        </div>

                        {/* SIREN search */}
                        <div>
                          <label className="block text-base font-bold text-[#1E3A8A] mb-1">Numéro SIREN</label>
                          <div className="flex gap-3">
                            <input type="text" value={answers.associe_societe_siren || ""} onChange={(e) => setAnswer("associe_societe_siren", e.target.value)} placeholder="Ex : 824330799" className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                            <button
                              onClick={async () => {
                                const siren = (answers.associe_societe_siren || "").replace(/\s/g, "");
                                if (siren.length !== 9) return;
                                try {
                                  const res = await fetch(`/api/siren?siren=${siren}`);
                                  if (res.ok) {
                                    const data = await res.json();
                                    setAnswer("associe_societe_nom", data.denominationSociale || "");
                                    setAnswer("associe_societe_forme", data.formeJuridique || "");
                                    setAnswer("associe_societe_capital", data.capitalSocial || "");
                                    setAnswer("associe_societe_representant", data.representant || "");
                                    setAnswer("associe_societe_adresse", [data.siegeSocial, data.codePostal, data.ville].filter(Boolean).join(", "));
                                    setAnswer("associe_societe_ville_rcs", data.ville || "");
                                    setAnswer("associe_societe_mode", "siren");
                                  }
                                } catch { /* ignore */ }
                              }}
                              disabled={!answers.associe_societe_siren || answers.associe_societe_siren.replace(/\s/g, "").length !== 9}
                              className="px-6 py-3 rounded-xl bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1D4ED8] disabled:bg-[#9CA3AF] transition-colors"
                            >Confirmer mon Numéro</button>
                          </div>
                        </div>

                        {/* Infos entreprise */}
                        {(answers.associe_societe_mode === "siren" || answers.associe_societe_mode === "manuel") && (
                          <div className="space-y-4 border-t border-gray-200 pt-4">
                            <p className="text-sm font-bold text-[#2563EB]">Informations de la société associée</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-base font-bold text-[#1E3A8A] mb-1">Dénomination de la société</label>
                                <input type="text" value={answers.associe_societe_nom || ""} onChange={(e) => setAnswer("associe_societe_nom", e.target.value)} placeholder="Nom de la société" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                              </div>
                              <div>
                                <label className="block text-base font-bold text-[#1E3A8A] mb-1">Forme juridique</label>
                                <input type="text" value={answers.associe_societe_forme || ""} onChange={(e) => setAnswer("associe_societe_forme", e.target.value)} placeholder="Ex : SAS, SARL, SA..." className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-base font-bold text-[#1E3A8A] mb-1">Capital social</label>
                                <input type="text" value={answers.associe_societe_capital || ""} onChange={(e) => setAnswer("associe_societe_capital", e.target.value)} placeholder="Ex : 1000" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                              </div>
                              <div>
                                <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nom du représentant légal</label>
                                <input type="text" value={answers.associe_societe_representant || ""} onChange={(e) => setAnswer("associe_societe_representant", e.target.value)} placeholder="Nom et prénom du représentant" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-base font-bold text-[#1E3A8A] mb-1">Adresse du siège</label>
                              <AddressAutocomplete value={answers.associe_societe_adresse || ""} onChange={(v) => setAnswer("associe_societe_adresse", v)} placeholder="Adresse complète" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Page 6: Capital social ── */}
                {POST_PAGES[postPage]?.id === "capital_social" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>

                    {/* Capital fixe / variable choice */}
                    <div className="space-y-3">
                      <p className="text-base font-bold text-[#1E3A8A]">Souhaitez vous prévoir un capital fixe ou variable ?</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          onClick={() => setAnswer("type_capital", "fixe")}
                          className={cn(
                            "text-left rounded-xl border-2 p-5 transition-all",
                            answers.type_capital === "fixe"
                              ? "border-[#2563EB] bg-[#EFF6FF]"
                              : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                          )}
                        >
                          <p className="text-sm font-semibold text-[#2563EB] mb-1">Capital fixe</p>
                          <p className="text-xs text-gray-500">Le montant est fixé une fois pour toutes dans les statuts. Toute modification future nécessitera une modification statutaire.</p>
                        </button>
                        <button
                          onClick={() => setAnswer("type_capital", "variable")}
                          className={cn(
                            "text-left rounded-xl border-2 p-5 transition-all",
                            answers.type_capital === "variable"
                              ? "border-[#2563EB] bg-[#EFF6FF]"
                              : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                          )}
                        >
                          <p className="text-sm font-semibold text-[#2563EB] mb-1">Capital variable</p>
                          <p className="text-xs text-gray-500">Le montant peut évoluer librement entre un minimum et un maximum prévus dans les statuts, sans formalités lourdes.</p>
                        </button>
                      </div>
                    </div>

                    {/* Capital variable: montant min/max */}
                    {answers.type_capital === "variable" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-base font-bold text-[#1E3A8A] mb-1">Montant minimum</label>
                          <input
                            type="number"
                            min="1"
                            value={answers.capital_minimum || ""}
                            onChange={(e) => setAnswer("capital_minimum", e.target.value)}
                            placeholder="Ex : 1 000"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-base font-bold text-[#1E3A8A] mb-1">Montant maximum</label>
                          <input
                            type="number"
                            min="1"
                            value={answers.capital_maximum || ""}
                            onChange={(e) => setAnswer("capital_maximum", e.target.value)}
                            placeholder="Ex : 100 000"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                          />
                        </div>
                      </div>
                    )}

                    <AccordionItem title="Plus d'informations">
                      <div className="text-sm text-gray-600 space-y-3">
                        <p><strong className="text-[#1E3A8A]">Un capital fixe ne peut pas bouger sans modifier les statuts.</strong> Un capital variable, lui, permet d&apos;ajouter ou retirer des fonds plus facilement, <em>sans formalités lourdes : idéal si vous pensez faire évoluer votre capital au fil du temps (investissements, entrée de ressources, réajustements...).</em></p>
                      </div>
                    </AccordionItem>

                    <hr className="border-gray-200" />

                    {/* Info formule simplifiée */}
                    <AccordionItem title="Plus d'informations">
                      <div className="text-sm text-gray-600 space-y-3">
                        <p>Le capital minimum légal pour une SASU est de 1 euro. Afin de faciliter vos démarches, nous vous proposons par défaut un ensemble de règles couramment utilisées dans les statuts afin de simplifier la création de votre SASU.</p>
                        <p className="font-bold text-[#1E3A8A]">Voici la formule dite simplifiée :</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>L&apos;associé unique a apporté la totalité du capital en numéraire (argent déposé en banque).</li>
                          <li>Cet apport est effectué à titre de biens propres de l&apos;associé unique (pas de biens communs ou indivis)</li>
                          <li>Aucun apport en nature ni en industrie.</li>
                          <li>Le capital est entièrement libéré (100 % déposé).</li>
                          <li>Le capital est fixe.</li>
                          <li>La valeur nominale d&apos;une action est de 1 €.</li>
                          <li>Le montant du capital social correspond à celui que vous avez défini ci-dessous.</li>
                        </ul>
                        <p className="italic text-gray-500">Toutefois, il est possible de modifier ces règles si vous le souhaitez par exemple : introduire des apports en nature (biens, matériel, véhicule, etc.), des apports en industrie, ou opter pour un capital variable.</p>
                      </div>
                    </AccordionItem>

                    {/* Montant du capital social */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-base font-bold text-[#1E3A8A] mb-1">Quel est le montant de votre capital social ? (€)</label>
                        <p className="text-sm text-gray-500 mb-2">Minimum 1 euro</p>
                        <input
                          type="number"
                          min="1"
                          value={answers.capital_social || ""}
                          onChange={(e) => setAnswer("capital_social", e.target.value)}
                          placeholder="1"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                        />
                      </div>
                    </div>

                    {/* Formule simplifiée / personnalisée */}
                    <div>
                      <p className="text-base font-bold text-[#1E3A8A] mb-3">Choix entre formule simplifiée ou personnalisée</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => { setAnswer("formule_capital", "simplifiee"); setAnswer("valeur_action", "1"); }}
                          className={cn(
                            "flex flex-col items-center gap-2 p-5 rounded-xl border-2 text-center transition-all",
                            answers.formule_capital === "simplifiee"
                              ? "border-[#2563EB] bg-blue-50"
                              : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                          )}
                        >
                          <Zap className="w-8 h-8 text-[#2563EB]" />
                          <span className="text-sm font-medium text-[#2563EB]">Je choisis la formule simplifiée</span>
                          <span className="text-xs text-gray-500">(Le choix le plus fréquent)</span>
                        </button>
                        <button
                          onClick={() => setAnswer("formule_capital", "personnalisee")}
                          className={cn(
                            "flex flex-col items-center gap-2 p-5 rounded-xl border-2 text-center transition-all",
                            answers.formule_capital === "personnalisee"
                              ? "border-[#2563EB] bg-blue-50"
                              : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                          )}
                        >
                          <PenTool className="w-8 h-8 text-[#2563EB]" />
                          <span className="text-sm font-medium text-[#2563EB]">Je souhaite modifier ces règles</span>
                        </button>
                      </div>
                    </div>

                    {/* Si simplifiée: valeur action = 1€, afficher résumé */}
                    {answers.formule_capital === "simplifiee" && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                        <p className="text-sm text-green-800"><strong>Formule simplifiée sélectionnée</strong></p>
                        <p className="text-sm text-green-700">Valeur nominale d&apos;une action : <strong>1 €</strong></p>
                        <p className="text-sm text-green-700">Nombre total d&apos;actions : <strong>{(Number(answers.capital_social) || 0).toLocaleString("fr-FR")}</strong></p>
                      </div>
                    )}

                    {/* Si personnalisée: demander la valeur d'une action */}
                    {answers.formule_capital === "personnalisee" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-base font-bold text-[#1E3A8A] mb-1">Valeur unitaire d&apos;une action (€)</label>
                          <input
                            type="number"
                            min="1"
                            value={answers.valeur_action || "1"}
                            onChange={(e) => setAnswer("valeur_action", e.target.value)}
                            placeholder="1"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nombre total d&apos;actions</label>
                          <div className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800">
                            {((Number(answers.capital_social) || 0) / (Number(answers.valeur_action) || 1)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Actions et capital social (personnalisée only — legacy, kept for route) ── */}
                {POST_PAGES[postPage]?.id === "actions_capital" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                      <p className="text-base text-gray-700"><strong className="text-[#1E3A8A]">Montant du capital</strong> : somme totale apportée par les associés.</p>
                      <p className="text-base text-gray-700"><strong className="text-[#1E3A8A]">Valeur unitaire d&apos;une action</strong> : prix de base d&apos;une action.</p>
                      <p className="text-base text-gray-700"><strong className="text-[#1E3A8A]">Nombre d&apos;actions</strong> : calcul automatique = Montant du capital ÷ Valeur d&apos;une action.</p>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-base font-bold text-[#1E3A8A] mb-1">Montant total du capital social (€)</label>
                        <input
                          type="number"
                          min="1"
                          value={answers.capital_social || "1"}
                          onChange={(e) => setAnswer("capital_social", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-base font-bold text-[#1E3A8A] mb-1">Valeur unitaire d&apos;une action (€)</label>
                        <input
                          type="number"
                          min="1"
                          value={answers.valeur_action || "1"}
                          onChange={(e) => setAnswer("valeur_action", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nombre total d&apos;actions</label>
                        <div className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800">
                          {((Number(answers.capital_social) || 1) / (Number(answers.valeur_action) || 1)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Page: Règles statutaires par défaut ── */}
                {POST_PAGES[postPage]?.id === "regles_statutaires" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                      <p className="text-gray-500 text-sm">Règles statutaires</p>
                    </div>

                    <AccordionItem title="Plus d&apos;informations">
                      <div className="text-sm text-gray-600 space-y-4 text-justify">
                        <p className="font-bold text-[#1E3A8A] text-center text-base">Règles statutaires proposées par défaut – SASU</p>
                        <p>Afin de simplifier la rédaction de vos statuts, nous vous proposons ci-dessous les règles les plus couramment adoptées dans les SASU.</p>

                        <p className="font-bold text-[#1E3A8A] text-center">Résumé des règles par défaut proposées :</p>

                        <p><strong className="text-[#1E3A8A]">Actions :</strong> Les actions sont librement cessibles et négociables.</p>
                        <p><strong className="text-[#1E3A8A]">Commissaire aux comptes :</strong> Aucun commissaire aux comptes n&apos;est désigné dans les statuts.</p>
                        <p><strong className="text-[#1E3A8A]">Durée de la société :</strong> La société est créée pour une durée de 99 ans, durée maximale autorisée par la loi.</p>
                        <p><strong className="text-[#1E3A8A]">Déclaration de l&apos;associé unique :</strong> L&apos;associé unique déclare n&apos;avoir accompli aucun acte pour le compte de la société avant sa création.</p>

                        <p className="font-bold text-[#1E3A8A]">Décisions de l&apos;associé unique et assemblées :</p>
                        <p className="italic">Tant que la société ne comporte qu&apos;un seul associé, toutes les décisions sont prises par l&apos;associé unique et consignées par écrit dans un registre ou un document signé et daté (papier ou électronique).</p>
                        <p className="italic">Si la société accueille ultérieurement de nouveaux associés, les assemblées seront convoquées par le Président, par tout moyen (courrier, e-mail, etc.).</p>
                        <p className="italic">Chaque associé dispose d&apos;un nombre de voix proportionnel au nombre d&apos;actions qu&apos;il détient.</p>
                        <p className="italic">En cas d&apos;égalité des voix, le Président dispose d&apos;une voix prépondérante.</p>
                        <p className="italic">Les décisions sont prises à la majorité simple (plus de 50 % des voix) des associés présents ou représentés.</p>

                        <p><strong className="text-red-600">Important :</strong> Ces clauses correspondent aux usages classiques des SASU. Toutefois, si vous avez des besoins spécifiques (contrôle des cessions d&apos;actions, limitation de pouvoirs, etc.), vous pouvez les adapter librement à l&apos;aide des options de personnalisation ci-dessous.</p>
                      </div>
                    </AccordionItem>

                    <button
                      className="w-full sm:w-auto px-6 py-3 rounded-xl border-2 border-[#2563EB] bg-[#2563EB] text-white font-semibold text-base hover:bg-[#1d4ed8] transition-all"
                    >
                      Explication simple des règles par défaut
                    </button>

                    <div className="space-y-3">
                      <p className="text-base font-bold text-[#1E3A8A]">Que préférez-vous ?</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => setAnswer("regles_statutaires", "defaut")}
                          className={cn(
                            "p-4 rounded-xl border-2 text-center text-base font-semibold transition-all",
                            answers.regles_statutaires === "defaut" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                          )}
                        >
                          Je choisis ces règles par défaut
                        </button>
                        <button
                          onClick={() => setAnswer("regles_statutaires", "personnaliser")}
                          className={cn(
                            "p-4 rounded-xl border-2 text-center text-base font-semibold transition-all",
                            answers.regles_statutaires === "personnaliser" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                          )}
                        >
                          Je souhaite modifier certaines règles
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Page: Commissaire aux Comptes (personnaliser) ── */}
                {POST_PAGES[postPage]?.id === "regles_cac" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                      <p className="text-gray-500 text-sm">Commissaire aux comptes</p>
                    </div>

                    <div className="rounded-xl border border-[#D1D5DB] bg-[#F8FAFF] p-5 space-y-3 text-sm text-gray-600">
                      <p>Le commissaire aux comptes est un contrôleur indépendant qui vérifie la régularité des comptes de la société.</p>
                      <p>À la création, sa nomination n&apos;est pas obligatoire, sauf cas particuliers. Elle le devient seulement si la société dépasse deux des trois seuils suivants :</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Chiffre d&apos;affaires &gt; 8 M€</strong></li>
                        <li><strong>Total du bilan &gt; 4 M€</strong></li>
                        <li><strong>Effectif moyen &gt; 50 salariés</strong></li>
                      </ul>
                      <p>Si votre projet prévoit une forte croissance ou un groupe de sociétés, vous pouvez choisir d&apos;en nommer un dès la création pour anticiper ces obligations.</p>
                    </div>

                    <div className="space-y-4">
                      <p className="text-base font-bold text-[#1E3A8A]">Souhaitez-vous nommer un commissaire aux Comptes ?</p>

                      <div className="space-y-3">
                        <button
                          onClick={() => { setAnswer("nommer_cac", "oui"); setAnswer("services_comptables", ""); }}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 text-left transition-all",
                            answers.nommer_cac === "oui" ? "border-[#2563EB] bg-blue-50" : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                          )}
                        >
                          <span className="block text-base font-semibold text-[#2563EB]">Oui</span>
                          <span className="block text-sm text-[#2563EB]">Vous nommez dès maintenant un commissaire aux comptes.</span>
                        </button>
                        <button
                          onClick={() => setAnswer("nommer_cac", "non")}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 text-left transition-all",
                            answers.nommer_cac === "non" ? "border-[#2563EB] bg-blue-50" : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                          )}
                        >
                          <span className="block text-base font-semibold text-[#2563EB]">Non</span>
                          <span className="block text-sm text-[#2563EB]">Vous ne prévoyez pas de CAC (pas obligatoire tant que vous êtes en dessous des seuils).</span>
                        </button>
                        <button
                          onClick={() => { setAnswer("nommer_cac", "plus_tard"); setAnswer("services_comptables", ""); }}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 text-left transition-all",
                            answers.nommer_cac === "plus_tard" ? "border-[#2563EB] bg-blue-50" : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                          )}
                        >
                          <span className="block text-base font-semibold text-[#2563EB]">Je déciderai plus tard</span>
                          <span className="block text-sm text-[#2563EB]">Vous gardez la possibilité de nommer un CAC ultérieurement, sans l&apos;inscrire dans les statuts dès la création.</span>
                        </button>
                      </div>

                      {/* Coordonnées du CAC si oui */}
                      {answers.nommer_cac === "oui" && (
                        <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-xl mt-4">
                          <p className="text-base font-bold text-[#1E3A8A]">Coordonnées du commissaire aux comptes</p>
                          <div>
                            <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Dénomination / Nom du cabinet</label>
                            <input
                              type="text"
                              value={answers.cac_denomination || ""}
                              onChange={(e) => setAnswer("cac_denomination", e.target.value)}
                              placeholder="Ex : Cabinet Durand & Associés"
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Adresse</label>
                            <AddressAutocomplete
                              value={answers.cac_adresse || ""}
                              onChange={(v) => setAnswer("cac_adresse", v)}
                              placeholder="Adresse complète du cabinet"
                            />
                          </div>

                          {/* CAC suppléant */}
                          <div className="border-t border-blue-200 pt-4 space-y-3">
                            <p className="text-base font-bold text-[#1E3A8A]">Souhaitez-vous nommer un commissaire aux comptes suppléant ?</p>
                            <p className="text-sm text-gray-600">Le suppléant remplace le titulaire en cas d&apos;empêchement. C&apos;est facultatif depuis la loi PACTE (2019).</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <button onClick={() => setAnswer("nommer_cac_suppleant", "oui")} className={cn("p-3 rounded-xl border-2 text-base font-medium transition-all", answers.nommer_cac_suppleant === "oui" ? "border-[#2563EB] bg-white text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50")}>Oui</button>
                              <button onClick={() => setAnswer("nommer_cac_suppleant", "non")} className={cn("p-3 rounded-xl border-2 text-base font-medium transition-all", (answers.nommer_cac_suppleant || "non") === "non" ? "border-[#2563EB] bg-white text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50")}>Non</button>
                            </div>

                            {answers.nommer_cac_suppleant === "oui" && (
                              <div className="space-y-3 border-l-2 border-[#2563EB]/30 pl-4 ml-2">
                                <div>
                                  <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Dénomination / Nom du suppléant</label>
                                  <input type="text" value={answers.cac_suppleant_denomination || ""} onChange={(e) => setAnswer("cac_suppleant_denomination", e.target.value)} placeholder="Ex : Cabinet Martin" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Adresse</label>
                                  <AddressAutocomplete value={answers.cac_suppleant_adresse || ""} onChange={(v) => setAnswer("cac_suppleant_adresse", v)} placeholder="Adresse complète" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sous-question si Non */}
                      {answers.nommer_cac === "non" && (
                        <div className="space-y-3 mt-4">
                          <p className="text-base font-bold text-[#1E3A8A]">Souhaitez-vous néanmoins bénéficier de services comptables ?</p>
                          <button
                            onClick={() => setAnswer("services_comptables", "logiciel")}
                            className={cn(
                              "w-full p-4 rounded-xl border-2 text-left text-base font-semibold transition-all",
                              answers.services_comptables === "logiciel" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                            )}
                          >
                            Oui, je suis intéressé(e) par un logiciel de comptabilité en ligne.
                          </button>
                          <button
                            onClick={() => setAnswer("services_comptables", "expert_comptable")}
                            className={cn(
                              "w-full p-4 rounded-xl border-2 text-left text-base font-semibold transition-all",
                              answers.services_comptables === "expert_comptable" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                            )}
                          >
                            Oui, je souhaite être mis(e) en relation avec un expert-comptable dans mon secteur.
                          </button>
                          <button
                            onClick={() => setAnswer("services_comptables", "non")}
                            className={cn(
                              "w-full p-4 rounded-xl border-2 text-left text-base font-semibold transition-all",
                              answers.services_comptables === "non" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                            )}
                          >
                            Non merci
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Page: Durée de la société (personnaliser) ── */}
                {POST_PAGES[postPage]?.id === "regles_duree" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                      <p className="text-gray-500 text-sm">Durée de la société</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-base font-bold text-[#1E3A8A]">Durée de la société</p>
                        <p className="text-sm text-gray-500 mt-1 flex items-start gap-1"><span>⏳</span> La durée légale maximale d&apos;une société est de 99 ans. Elle peut être plus courte si vous le souhaitez.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => { setAnswer("duree_societe", "99"); setAnswer("duree_societe_annees", "99"); }}
                          className={cn(
                            "p-4 rounded-xl border-2 text-center text-base font-semibold transition-all",
                            answers.duree_societe === "99" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                          )}
                        >
                          Durée standard de 99 ans
                        </button>
                        <button
                          onClick={() => setAnswer("duree_societe", "personnalisee")}
                          className={cn(
                            "p-4 rounded-xl border-2 text-center text-base font-semibold transition-all",
                            answers.duree_societe === "personnalisee" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                          )}
                        >
                          Je souhaite une durée déterminée
                        </button>
                      </div>

                      {answers.duree_societe === "personnalisee" && (
                        <div className="mt-3">
                          <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nombre d&apos;années souhaitées</label>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={answers.duree_societe_annees || ""}
                            onChange={(e) => setAnswer("duree_societe_annees", e.target.value)}
                            placeholder="Ex : 50"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Page: Règles de transmission/cession (personnaliser) ── */}
                {POST_PAGES[postPage]?.id === "regles_transmission" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                      <p className="text-gray-500 text-sm">Transmission et cession des actions</p>
                    </div>

                    <div className="space-y-4">
                      <p className="text-lg font-bold text-[#2563EB]">Comment souhaitez-vous encadrer les modalités de cession ou transmission de vos actions ?</p>
                      <p className="text-sm text-gray-600">
                        En SASU, l&apos;associé unique reste libre de décider seul de toute cession ou transmission de ses actions. Les options ci-dessous n&apos;ont <strong>aucun effet tant que la société demeure unipersonnelle</strong>. Elles permettent uniquement <strong>d&apos;anticiper les règles applicables le jour où de nouveaux associés entreraient au capital</strong> (cession, donation, succession).
                      </p>

                      <div className="space-y-3">
                        <button
                          onClick={() => { setAnswer("cession_actions", "libre"); setAnswer("transmission_heritiers", ""); }}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 text-left transition-all",
                            answers.cession_actions === "libre" ? "border-[#2563EB] bg-blue-50" : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                          )}
                        >
                          <span className="block text-base font-semibold text-[#2563EB]">Cession et transmission libres (par défaut)</span>
                          <span className="block text-sm text-[#2563EB]">Je ne souhaite pas imposer de restrictions</span>
                        </button>
                        <button
                          onClick={() => { setAnswer("cession_actions", "agrement"); setAnswer("transmission_heritiers", ""); }}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 text-left transition-all",
                            answers.cession_actions === "agrement" ? "border-[#2563EB] bg-blue-50" : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                          )}
                        >
                          <span className="block text-base font-semibold text-[#2563EB]">Clause d&apos;agrément</span>
                          <span className="block text-sm text-[#2563EB]">Je souhaite prévoir une clause d&apos;agrément</span>
                        </button>
                        <button
                          onClick={() => setAnswer("cession_actions", "heritiers")}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 text-left transition-all",
                            answers.cession_actions === "heritiers" ? "border-[#2563EB] bg-blue-50" : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                          )}
                        >
                          <span className="block text-base font-semibold text-[#2563EB]">Transmission libre uniquement à certains héritiers</span>
                          <span className="block text-sm text-[#2563EB]">Je souhaite que mes actions soient transmises librement uniquement à certaines personnes</span>
                        </button>
                      </div>

                      {/* Majorité agrément */}
                      {(answers.cession_actions === "agrement" || answers.cession_actions === "heritiers") && (
                        <div className="space-y-3 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                          <label className="block text-base font-bold text-[#1E3A8A]">Majorité requise pour l&apos;agrément</label>
                          <p className="text-sm text-gray-600">Quel pourcentage des droits de vote sera nécessaire pour approuver l&apos;entrée d&apos;un nouvel associé ?</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {["50", "66", "75"].map((pct) => (
                              <button
                                key={pct}
                                onClick={() => setAnswer("majorite_agrement_pct", pct)}
                                className={cn(
                                  "p-3 rounded-xl border-2 text-base font-medium transition-all",
                                  (answers.majorite_agrement_pct || "50") === pct
                                    ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                )}
                              >
                                {pct} %
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sous-options héritiers */}
                      {answers.cession_actions === "heritiers" && (
                        <div className="space-y-4 mt-2">
                          <p className="text-sm text-gray-600">Les personnes que vous sélectionnez ci-dessous pourront recevoir librement des actions, sans autorisation préalable des autres associés. Toute autre cession à un tiers extérieur sera soumise à la procédure d&apos;agrément prévue par les statuts.</p>

                          <div>
                            <p className="text-base font-bold text-[#1E3A8A]">À quelles personnes souhaitez-vous autoriser la transmission libre des titres ?</p>
                            <p className="text-sm text-gray-500 mb-3">(Pour toutes les autres personnes, une procédure d&apos;agrément sera requise.)</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {[
                                { value: "conjoint", label: "Conjoint / Partenaire" },
                                { value: "descendants", label: "Aux descendants (enfants, petits-enfants)" },
                                { value: "ascendants", label: "Aux ascendants (parents)" },
                                { value: "heritiers_reservataires", label: "Aux héritiers réservataires" },
                              ].map((opt) => {
                                const selected = (answers.transmission_heritiers || "").split(",").filter(Boolean);
                                const isSelected = selected.includes(opt.value);
                                return (
                                  <button
                                    key={opt.value}
                                    onClick={() => {
                                      const newSelected = isSelected
                                        ? selected.filter((v: string) => v !== opt.value)
                                        : [...selected, opt.value];
                                      setAnswer("transmission_heritiers", newSelected.join(","));
                                    }}
                                    className={cn(
                                      "p-4 rounded-xl border-2 text-center text-base font-semibold transition-all",
                                      isSelected ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                    )}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="text-sm text-gray-500 italic mt-4">Cliquez pour des explications si besoin</p>
                      <button
                        onClick={() => setAnswer("show_explication_agrement", answers.show_explication_agrement === "oui" ? "" : "oui")}
                        className="px-6 py-3 rounded-xl bg-[#1E3A8A] text-white font-semibold text-base hover:opacity-90 transition-opacity"
                      >
                        Explications clause agrément
                      </button>

                      {answers.show_explication_agrement === "oui" && (
                        <div className="space-y-5 text-sm text-gray-700 mt-4">
                          <div>
                            <p className="font-bold italic text-[#1E3A8A]">La clause d&apos;agrément, c&apos;est quoi ?</p>
                            <p>C&apos;est une règle qui impose que toute cession ou transmission d&apos;actions soit soumise à l&apos;accord de la société lorsqu&apos;il y aura plusieurs associés. Elle permet donc de contrôler l&apos;entrée de nouveaux actionnaires.</p>
                          </div>

                          <div>
                            <p className="font-bold italic text-[#2563EB]">🟦 Option 1 — Cession et transmission libres</p>
                            <p>Aucune restriction :</p>
                            <ul className="list-disc pl-8 space-y-1">
                              <li>les actions peuvent être librement vendues à un tiers,</li>
                              <li>ou transmises en cas de décès, donation ou succession.</li>
                            </ul>
                            <p className="font-bold mt-1">Aucune clause d&apos;agrément n&apos;est prévue dans les statuts.</p>
                          </div>

                          <div>
                            <p className="font-bold italic text-[#2563EB]">🟦 Option 2 — Clause d&apos;agrément</p>
                            <p>Toute cession ou transmission à une autre personne (tiers ou héritier) devra recevoir l&apos;accord préalable de la société. <strong>Intérêt :</strong> contrôle total sur l&apos;arrivée de nouveaux associés et utile si vous envisagez l&apos;évolution de la SASU vers une SAS à plusieurs associés.</p>
                            <p className="font-bold text-[#1E3A8A] mt-2">Modalités d&apos;agrément prévues par les statuts</p>
                            <p>Tant que la société demeure unipersonnelle, l&apos;associé unique conserve seul le pouvoir d&apos;agrément. Lorsque la société comptera plusieurs associés, toute cession ou transmission soumise à agrément devra être approuvée par la collectivité des associés statuant à la <strong>majorité simple (plus de 50 % des droits de vote)</strong>, conformément aux statuts.</p>
                          </div>

                          <div>
                            <p className="font-bold italic text-[#2563EB]">🟦 Option 3 — Transmission libre uniquement à certaines personnes</p>
                            <p>Certaines personnes pourront recevoir les actions sans agrément, par exemple :</p>
                            <ul className="list-disc pl-8 space-y-1">
                              <li>votre conjoint,</li>
                              <li>vos enfants,</li>
                              <li>vos héritiers réservataires.</li>
                            </ul>
                            <p>Pour toute autre personne → <strong>agrément obligatoire</strong>.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Page: Nantissement et location d'actions (personnaliser) ── */}
                {POST_PAGES[postPage]?.id === "regles_nantissement" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                      <p className="text-gray-500 text-sm">Nantissement et location des actions</p>
                    </div>

                    <AccordionItem title="Plus d&apos;informations">
                      <div className="text-sm text-gray-600 space-y-3 text-justify">
                        <p className="font-bold text-[#1E3A8A]">Nantissement des actions</p>
                        <p>Le nantissement permet d&apos;utiliser vos actions comme garantie pour un prêt bancaire ou une dette.</p>
                        <p>Oui → Vous autorisez la possibilité de nantir vos actions (utile pour accéder à certains financements).</p>
                        <p>Non → Vos actions ne pourront pas être données en garantie.</p>
                      </div>
                    </AccordionItem>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <p className="text-base font-bold text-[#1E3A8A]">Souhaitez-vous prévoir la possibilité de donner vos actions en garantie (nantissement) ?</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            onClick={() => setAnswer("nantissement_actions", "oui")}
                            className={cn(
                              "p-4 rounded-xl border-2 text-left text-base font-semibold transition-all",
                              answers.nantissement_actions === "oui" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                            )}
                          >
                            Oui → vous autorisez cette possibilité.
                          </button>
                          <button
                            onClick={() => setAnswer("nantissement_actions", "non")}
                            className={cn(
                              "p-4 rounded-xl border-2 text-left text-base font-semibold transition-all",
                              answers.nantissement_actions === "non" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                            )}
                          >
                            Non → vous interdisez cette possibilité.
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-base font-bold text-[#1E3A8A]">Souhaitez-vous prévoir la possibilité de louer temporairement vos actions ?</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            onClick={() => setAnswer("location_actions", "oui")}
                            className={cn(
                              "p-4 rounded-xl border-2 text-left text-base font-semibold transition-all",
                              answers.location_actions === "oui" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                            )}
                          >
                            Oui → vous autorisez cette pratique.
                          </button>
                          <button
                            onClick={() => setAnswer("location_actions", "non")}
                            className={cn(
                              "p-4 rounded-xl border-2 text-left text-base font-semibold transition-all",
                              answers.location_actions === "non" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                            )}
                          >
                            Non → vous l&apos;interdisez.
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Page: Non-concurrence (personnaliser) ── */}
                {POST_PAGES[postPage]?.id === "regles_non_concurrence" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                      <p className="text-gray-500 text-sm">Clause de non-concurrence des dirigeants</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-sm text-gray-700">La clause de non-concurrence interdit au président (et au DG le cas échéant) d&apos;exercer une activité concurrente pendant et après la fin de son mandat. Elle est <strong>facultative</strong>.</p>
                    </div>

                    <div className="space-y-4">
                      <p className="text-base font-bold text-[#1E3A8A]">Souhaitez-vous inclure une clause de non-concurrence dans les statuts ?</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => setAnswer("non_concurrence", "oui")}
                          className={cn(
                            "p-4 rounded-xl border-2 text-left text-base font-semibold transition-all",
                            answers.non_concurrence === "oui" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                          )}
                        >
                          Oui
                        </button>
                        <button
                          onClick={() => setAnswer("non_concurrence", "non")}
                          className={cn(
                            "p-4 rounded-xl border-2 text-left text-base font-semibold transition-all",
                            (answers.non_concurrence || "non") === "non" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                          )}
                        >
                          Non (par défaut)
                        </button>
                      </div>

                      {answers.non_concurrence === "oui" && (
                        <div className="space-y-4 p-4 border-l-2 border-[#2563EB]/30 ml-2">
                          <div>
                            <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Durée de la clause (en années après cessation)</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {["1", "2", "3"].map((y) => (
                                <button
                                  key={y}
                                  onClick={() => setAnswer("duree_non_concurrence", y)}
                                  className={cn(
                                    "p-3 rounded-xl border-2 text-base font-medium transition-all",
                                    (answers.duree_non_concurrence || "1") === y
                                      ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]"
                                      : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                  )}
                                >
                                  {y} an{Number(y) > 1 ? "s" : ""}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Périmètre géographique</label>
                            <input
                              type="text"
                              value={answers.perimetre_non_concurrence || ""}
                              onChange={(e) => setAnswer("perimetre_non_concurrence", e.target.value)}
                              placeholder="Ex : France métropolitaine, Union européenne..."
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Contrepartie financière ?</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <button
                                onClick={() => setAnswer("indemnite_non_concurrence", "oui")}
                                className={cn(
                                  "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                                  answers.indemnite_non_concurrence === "oui"
                                    ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                )}
                              >
                                Oui, avec indemnité
                              </button>
                              <button
                                onClick={() => setAnswer("indemnite_non_concurrence", "non")}
                                className={cn(
                                  "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                                  (answers.indemnite_non_concurrence || "non") === "non"
                                    ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                )}
                              >
                                Non, intégrée à la rémunération
                              </button>
                            </div>
                          </div>
                          {answers.indemnite_non_concurrence === "oui" && (
                            <div>
                              <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Montant mensuel de l&apos;indemnité (€ bruts)</label>
                              <input
                                type="number"
                                value={answers.montant_indemnite_non_concurrence || ""}
                                onChange={(e) => setAnswer("montant_indemnite_non_concurrence", e.target.value)}
                                placeholder="Ex : 500"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Page: Comptes courants d'associés (personnaliser) ── */}
                {POST_PAGES[postPage]?.id === "regles_comptes_courants" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                      <p className="text-gray-500 text-sm">Conditions des comptes courants d&apos;associés</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-sm text-gray-700">L&apos;associé unique peut prêter de l&apos;argent à la société via un <strong>compte courant d&apos;associé</strong>. Les statuts définissent les conditions de rémunération et de remboursement de ces avances.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <p className="text-base font-bold text-[#1E3A8A]">Taux d&apos;intérêt des avances en compte courant</p>
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            onClick={() => setAnswer("taux_compte_courant", "legal")}
                            className={cn(
                              "p-4 rounded-xl border-2 text-left transition-all",
                              (answers.taux_compte_courant || "legal") === "legal" ? "border-[#2563EB] bg-blue-50" : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                            )}
                          >
                            <span className="block text-base font-semibold text-[#2563EB]">Taux légal en vigueur (recommandé)</span>
                            <span className="block text-sm text-gray-600">Les avances sont rémunérées au taux d&apos;intérêt légal</span>
                          </button>
                          <button
                            onClick={() => setAnswer("taux_compte_courant", "fixe")}
                            className={cn(
                              "p-4 rounded-xl border-2 text-left transition-all",
                              answers.taux_compte_courant === "fixe" ? "border-[#2563EB] bg-blue-50" : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                            )}
                          >
                            <span className="block text-base font-semibold text-[#2563EB]">Taux fixe personnalisé</span>
                            <span className="block text-sm text-gray-600">Définir un taux d&apos;intérêt fixe annuel</span>
                          </button>
                          <button
                            onClick={() => setAnswer("taux_compte_courant", "gratuit")}
                            className={cn(
                              "p-4 rounded-xl border-2 text-left transition-all",
                              answers.taux_compte_courant === "gratuit" ? "border-[#2563EB] bg-blue-50" : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                            )}
                          >
                            <span className="block text-base font-semibold text-[#2563EB]">Avances gratuites (taux 0%)</span>
                            <span className="block text-sm text-gray-600">Les avances en compte courant ne portent pas intérêt</span>
                          </button>
                        </div>
                      </div>

                      {answers.taux_compte_courant === "fixe" && (
                        <div>
                          <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Taux d&apos;intérêt annuel (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={answers.taux_cc_valeur || ""}
                            onChange={(e) => setAnswer("taux_cc_valeur", e.target.value)}
                            placeholder="Ex : 2.5"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                          />
                        </div>
                      )}

                      <div className="space-y-3">
                        <p className="text-base font-bold text-[#1E3A8A]">Plafond des avances en compte courant ?</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            onClick={() => setAnswer("plafond_compte_courant", "non")}
                            className={cn(
                              "p-4 rounded-xl border-2 text-left text-base font-semibold transition-all",
                              (answers.plafond_compte_courant || "non") === "non" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                            )}
                          >
                            Non, pas de plafond
                          </button>
                          <button
                            onClick={() => setAnswer("plafond_compte_courant", "oui")}
                            className={cn(
                              "p-4 rounded-xl border-2 text-left text-base font-semibold transition-all",
                              answers.plafond_compte_courant === "oui" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                            )}
                          >
                            Oui, limiter le montant
                          </button>
                        </div>
                      </div>

                      {answers.plafond_compte_courant === "oui" && (
                        <div>
                          <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Montant maximum des avances (€)</label>
                          <input
                            type="number"
                            value={answers.montant_plafond_cc || ""}
                            onChange={(e) => setAnswer("montant_plafond_cc", e.target.value)}
                            placeholder="Ex : 50000"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Apport de l'associé unique ── */}
                {POST_PAGES[postPage]?.id === "apport_associe" && (() => {
                  const capitalTotal = Number(answers.capital_social) || 0;
                  const apportNum = Number(answers.apport_numeraire) || 0;
                  const apportsNatureListe: { description: string; valeur: string; bien_type?: string }[] = answers.apports_nature_liste || [];
                  const apportNature = apportsNatureListe.reduce((s: number, a) => s + (Number(a.valeur) || 0), 0) || Number(answers.apport_nature) || 0;
                  const totalApports = apportNum + apportNature;
                  const valeurAction = Number(answers.valeur_action) || 1;
                  const nbActions = capitalTotal > 0 ? capitalTotal / valeurAction : 0;
                  const pctApport = capitalTotal > 0 ? Math.round((totalApports / capitalTotal) * 100) : 0;
                  const nomComplet = answers.type_associe === "morale"
                    ? (answers.associe_denomination || "Société non renseignée")
                    : [answers.associe_prenom, answers.associe_nom].filter(Boolean).join(" ") || "Associé non renseigné";

                  return (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>

                    <AccordionItem title="Plus d'informations">
                      <div className="text-base text-gray-600 space-y-2">
                        <p>Comment remplir la fiche apport de l&apos;associé unique ? Cliquez sur l&apos;associé, remplissez sa fiche d&apos;apport, puis validez le profil.</p>
                      </div>
                    </AccordionItem>

                    {answers.formule_capital === "simplifiee" && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                        <p className="text-base text-gray-700">
                          <Lightbulb className="inline w-4 h-4 mr-1 text-[#2563EB]" />
                          <strong>Dans le parcours simplifié d&apos;une SASU, l&apos;associé unique apporte uniquement une somme d&apos;argent</strong> (&quot;apport en numéraire&quot;), <strong>entièrement libérée</strong>, c&apos;est-à-dire réellement versée et déposée sur le compte bancaire dédié dès la création. La valeur d&apos;une action est fixée à 1 euro. Le capital social correspond donc à la somme effectivement déposée, et l&apos;associé unique détient 100 % des actions.
                        </p>
                      </div>
                    )}

                    {/* ── Recap Capital ── */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] rounded-xl px-5 py-3 text-white">
                      <span className="text-sm font-medium">Capital Social</span>
                      <span className="text-lg font-bold">{capitalTotal.toLocaleString("fr-FR")} €</span>
                    </div>

                    {/* ── Carte associé animée ── */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-[#2563EB] transition-colors"
                    >
                      {/* Header carte */}
                      <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-blue-50 to-white">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                          className="flex items-center justify-center w-14 h-14 rounded-full bg-[#1E3A8A] text-white text-lg font-bold shadow-lg"
                        >
                          {answers.type_associe === "morale" ? (
                            <Building2 className="w-7 h-7" />
                          ) : (
                            (answers.associe_prenom?.[0] || "A").toUpperCase()
                          )}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-[#1E3A8A] truncate">{nomComplet}</p>
                          <p className="text-xs text-gray-500">
                            {answers.type_associe === "morale" ? "Personne morale" : "Personne physique"} — Associé unique
                          </p>
                        </div>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5, type: "spring" }}
                          className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-[#2563EB] text-xs font-bold"
                        >
                          <Percent className="w-3 h-3" />
                          100 %
                        </motion.div>
                      </div>

                      {/* Tableau d'apport */}
                      <div className="px-5 pb-5 pt-3">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Détail</th>
                              <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Valeur</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Apport en numéraire */}
                            <motion.tr
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 }}
                              className="border-b border-gray-100"
                            >
                              <td className="py-3 flex items-center gap-2 text-gray-700">
                                <Coins className="w-4 h-4 text-[#2563EB]" />
                                Apport en numéraire
                              </td>
                              <td className="py-3 text-right font-semibold text-[#1E3A8A]">
                                {apportNum.toLocaleString("fr-FR")} €
                              </td>
                            </motion.tr>

                            {/* Détail apports en nature (un par ligne) */}
                            {apportsNatureListe.length > 0 ? (
                              apportsNatureListe.map((apport, idx) => (
                                <motion.tr
                                  key={`nature-${idx}`}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.35 + idx * 0.05 }}
                                  className="border-b border-gray-100"
                                >
                                  <td className="py-3">
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <FolderOpen className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
                                      <div>
                                        <span>Apport en nature N°{idx + 1}</span>
                                        {apport.description && (
                                          <p className="text-xs text-gray-400 truncate max-w-[200px]">{apport.description}</p>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 text-right font-semibold text-[#1E3A8A]">
                                    {(Number(apport.valeur) || 0).toLocaleString("fr-FR")} €
                                  </td>
                                </motion.tr>
                              ))
                            ) : apportNature > 0 ? (
                              <motion.tr
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.35 }}
                                className="border-b border-gray-100"
                              >
                                <td className="py-3 flex items-center gap-2 text-gray-700">
                                  <FolderOpen className="w-4 h-4 text-[#2563EB]" />
                                  Apport en nature
                                </td>
                                <td className="py-3 text-right font-semibold text-[#1E3A8A]">
                                  {apportNature.toLocaleString("fr-FR")} €
                                </td>
                              </motion.tr>
                            ) : null}

                            {/* Apport en industrie */}
                            {answers.apport_industrie === "oui" && (
                              <motion.tr
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.35 + apportsNatureListe.length * 0.05 }}
                                className="border-b border-gray-100"
                              >
                                <td className="py-3 flex items-center gap-2 text-gray-700">
                                  <PenTool className="w-4 h-4 text-[#2563EB]" />
                                  Apport en industrie
                                </td>
                                <td className="py-3 text-right font-semibold text-[#1E3A8A] text-xs">
                                  hors capital
                                </td>
                              </motion.tr>
                            )}

                            {/* ── Total des apports (intégrés au capital) ── */}
                            <motion.tr
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.45 + apportsNatureListe.length * 0.05 }}
                              className="border-t-2 border-[#1E3A8A]"
                            >
                              <td className="py-3 flex items-center gap-2 font-bold text-[#1E3A8A]">
                                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                                Total des apports
                              </td>
                              <td className={cn(
                                "py-3 text-right font-bold text-lg",
                                totalApports === capitalTotal && capitalTotal > 0
                                  ? "text-green-600"
                                  : totalApports > 0
                                    ? "text-yellow-600"
                                    : "text-gray-400"
                              )}>
                                {totalApports.toLocaleString("fr-FR")} €
                              </td>
                            </motion.tr>

                            {/* Détails actions */}
                            <motion.tr
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + apportsNatureListe.length * 0.05 }}
                              className="border-b border-gray-100"
                            >
                              <td className="py-3 flex items-center gap-2 text-gray-700">
                                <CreditCard className="w-4 h-4 text-[#2563EB]" />
                                Valeur d&apos;une action
                              </td>
                              <td className="py-3 text-right font-semibold text-[#1E3A8A]">
                                {valeurAction.toLocaleString("fr-FR")} €
                              </td>
                            </motion.tr>
                            <motion.tr
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.55 + apportsNatureListe.length * 0.05 }}
                              className="border-b border-gray-100"
                            >
                              <td className="py-3 flex items-center gap-2 text-gray-700">
                                <Users className="w-4 h-4 text-[#2563EB]" />
                                Nombre d&apos;actions
                              </td>
                              <td className="py-3 text-right font-semibold text-[#1E3A8A]">
                                {nbActions.toLocaleString("fr-FR", { minimumFractionDigits: 0 })}
                              </td>
                            </motion.tr>
                            <motion.tr
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.6 + apportsNatureListe.length * 0.05 }}
                            >
                              <td className="py-3 flex items-center gap-2 text-gray-700">
                                <Percent className="w-4 h-4 text-[#2563EB]" />
                                Part du capital
                              </td>
                              <td className="py-3 text-right font-semibold text-[#1E3A8A]">
                                100 %
                              </td>
                            </motion.tr>
                          </tbody>
                        </table>

                        {/* Barre de progression animée */}
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Répartition du capital</span>
                            <span>{pctApport} % libéré</span>
                          </div>
                          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(pctApport, 100)}%` }}
                              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                              className={cn(
                                "h-full rounded-full",
                                pctApport >= 100 ? "bg-green-500" : pctApport > 0 ? "bg-[#2563EB]" : "bg-red-400"
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Warning si incohérence (personnalisée) */}
                    {totalApports !== capitalTotal && totalApports > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 space-y-3"
                      >
                        <p className="text-base text-yellow-800">
                          <strong>Attention</strong> — la répartition du capital social semble incohérente. Les apports intégrés au capital totalisent {totalApports.toLocaleString("fr-FR")} €, alors que le capital déclaré est {capitalTotal.toLocaleString("fr-FR")} € ({capitalTotal > 0 ? Math.round((totalApports / capitalTotal) * 100) : 0}%).
                        </p>
                        <p className="text-base text-yellow-800">L&apos;apport doit être égale à 100% du capital social déclaré avant validation</p>
                        <p className="text-base text-yellow-800 font-semibold">Deux options s&apos;offrent à vous :</p>
                        <p className="text-base text-yellow-800"><strong>1 – Modifier la répartition du capital social</strong></p>
                        <p className="text-xs text-yellow-700">Si le montant de l&apos;apport est incorrect ou incomplet, dans ce cas il faut modifier l&apos;apport de l&apos;associé unique</p>
                        <p className="text-base text-yellow-800"><strong>2 – Modifier le capital social</strong></p>
                        <p className="text-xs text-yellow-700">Si vous voulez changer le capital social, veuillez cliquer sur ce bouton.</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setAnswer("capital_social", String(totalApports))}
                            className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                          >
                            Définir {totalApports.toLocaleString("fr-FR")} € comme nouveau capital social
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Input apports — types différents selon PP/PM */}
                    <div className="space-y-5">
                      <div>
                        <label className="block text-base font-bold text-[#1E3A8A] mb-1">Apport en numéraire (€)</label>
                        <p className="text-sm text-gray-500 mb-2">Somme d&apos;argent effectivement déposée sur le compte bancaire dédié à la société.</p>
                        <input
                          type="number"
                          min="0"
                          value={answers.apport_numeraire || ""}
                          onChange={(e) => setAnswer("apport_numeraire", e.target.value)}
                          placeholder={String(capitalTotal) || "0"}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                        />
                      </div>

                      {answers.formule_capital === "personnalisee" && (
                        <>
                          {/* Apport en nature — PP et PM — liste dynamique */}
                          <div>
                            <label className="block text-base font-bold text-[#1E3A8A] mb-1">Apport(s) en nature</label>
                            <p className="text-sm text-gray-500 mb-2">Biens matériels ou immatériels apportés à la société (véhicule, matériel, fonds de commerce, brevet, etc.).</p>

                            {/* Liste des apports en nature */}
                            {(answers.apports_nature_liste || []).map((apport: { description: string; valeur: string; bien_type?: string }, idx: number) => (
                              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-[#1E3A8A]">Bien N° {idx + 1}</span>
                                  <button
                                    onClick={() => {
                                      const list = [...(answers.apports_nature_liste || [])];
                                      list.splice(idx, 1);
                                      setAnswer("apports_nature_liste", list);
                                      // Recalculate apport_nature total
                                      const total = list.reduce((s: number, a: { valeur: string }) => s + (Number(a.valeur) || 0), 0);
                                      setAnswer("apport_nature", String(total));
                                    }}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Description du bien</label>
                                  <textarea
                                    value={apport.description || ""}
                                    onChange={(e) => {
                                      const list = [...(answers.apports_nature_liste || [])];
                                      list[idx] = { ...list[idx], description: e.target.value };
                                      setAnswer("apports_nature_liste", list);
                                    }}
                                    placeholder="Type, marque, modèle, caractéristiques..."
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 resize-none transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Valeur déclarée (€)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={apport.valeur || ""}
                                    onChange={(e) => {
                                      const list = [...(answers.apports_nature_liste || [])];
                                      list[idx] = { ...list[idx], valeur: e.target.value };
                                      setAnswer("apports_nature_liste", list);
                                      // Recalculate apport_nature total
                                      const total = list.reduce((s: number, a: { valeur: string }) => s + (Number(a.valeur) || 0), 0);
                                      setAnswer("apport_nature", String(total));
                                    }}
                                    placeholder="0"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                                  />
                                </div>
                                {/* Bien propre / commun — si marié communauté ou pacsé indivision */}
                                {answers.type_associe !== "morale" && (
                                  answers.situation_matrimoniale === "marie" && (answers.regime_matrimonial === "communaute_reduite" || answers.regime_matrimonial === "communaute_universelle" || answers.regime_matrimonial === "participation_acquets")
                                  || answers.situation_matrimoniale === "pacse"
                                ) && (
                                  <div>
                                    <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Ce bien est :</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <button
                                        onClick={() => {
                                          const list = [...(answers.apports_nature_liste || [])];
                                          list[idx] = { ...list[idx], bien_type: "propre" };
                                          setAnswer("apports_nature_liste", list);
                                        }}
                                        className={cn(
                                          "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                                          apport.bien_type === "propre" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                        )}
                                      >
                                        Bien propre
                                      </button>
                                      <button
                                        onClick={() => {
                                          const list = [...(answers.apports_nature_liste || [])];
                                          list[idx] = { ...list[idx], bien_type: "commun" };
                                          setAnswer("apports_nature_liste", list);
                                        }}
                                        className={cn(
                                          "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                                          apport.bien_type === "commun" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                        )}
                                      >
                                        Bien commun
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* Bouton ajouter un apport en nature */}
                            <button
                              onClick={() => {
                                const list = [...(answers.apports_nature_liste || [])];
                                list.push({ description: "", valeur: "", bien_type: "propre" });
                                setAnswer("apports_nature_liste", list);
                              }}
                              className="w-full py-3 rounded-xl border-2 border-dashed border-[#2563EB]/40 text-[#2563EB] text-sm font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                            >
                              <span className="text-lg">+</span> Ajouter un apport en nature
                            </button>

                            {/* Total nature calculé */}
                            {(answers.apports_nature_liste || []).length > 0 && (() => {
                              const totalNature = (answers.apports_nature_liste || []).reduce((s: number, a: { valeur: string }) => s + (Number(a.valeur) || 0), 0);
                              const capitalSocial = Number(answers.capital_social) || 0;
                              const maxApportIndividuel = Math.max(...(answers.apports_nature_liste || []).map((a: { valeur: string }) => Number(a.valeur) || 0));
                              const needsCAA = maxApportIndividuel > 30000 || (capitalSocial > 0 && totalNature > capitalSocial / 2);
                              const canDispense = !needsCAA;

                              return (
                                <div className="mt-2 space-y-3">
                                  <div className="text-sm text-gray-600">
                                    <strong>Total apports en nature :</strong> {totalNature.toLocaleString("fr-FR")} €
                                  </div>

                                  {/* Règle CAA */}
                                  {canDispense ? (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                                      <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                      <div className="space-y-1">
                                        <p className="text-sm font-semibold text-green-800">Dispense de commissaire aux apports possible</p>
                                        <p className="text-xs text-green-700">
                                          Aucun apport ne dépasse 30 000 € et le total ne dépasse pas 50 % du capital social. Une déclaration de dispense sera générée automatiquement.
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                                      <Shield className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                      <div className="space-y-1">
                                        <p className="text-sm font-semibold text-red-800">Commissaire aux apports obligatoire</p>
                                        <p className="text-xs text-red-700">
                                          {maxApportIndividuel > 30000
                                            ? `Un apport en nature dépasse 30 000 € (${maxApportIndividuel.toLocaleString("fr-FR")} €).`
                                            : `Le total des apports en nature (${totalNature.toLocaleString("fr-FR")} €) dépasse 50 % du capital social (${(capitalSocial / 2).toLocaleString("fr-FR")} €).`
                                          }
                                          {" "}La nomination d&apos;un commissaire aux apports est obligatoire (art. L. 227-1 C. com.).
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Apport en industrie — PP uniquement */}
                          {answers.type_associe !== "morale" && (
                            <div>
                              <label className="block text-base font-bold text-[#1E3A8A] mb-1">Apport en industrie</label>
                              <p className="text-sm text-gray-500 mb-2">
                                Mise à disposition de connaissances techniques, de travail ou de services. <strong>Attention :</strong> l&apos;apport en industrie ne concourt pas à la formation du capital social, mais donne droit à des actions.
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                  onClick={() => setAnswer("apport_industrie", "oui")}
                                  className={cn(
                                    "flex items-center justify-center gap-2 p-4 rounded-xl border-2 text-base font-medium transition-all",
                                    answers.apport_industrie === "oui"
                                      ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]"
                                      : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                  )}
                                >
                                  Oui, il y a un apport en industrie
                                </button>
                                <button
                                  onClick={() => setAnswer("apport_industrie", "non")}
                                  className={cn(
                                    "flex items-center justify-center gap-2 p-4 rounded-xl border-2 text-base font-medium transition-all",
                                    answers.apport_industrie === "non"
                                      ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]"
                                      : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                  )}
                                >
                                  Non
                                </button>
                              </div>
                              {answers.apport_industrie === "oui" && (
                                <div className="mt-3">
                                  <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Description de l&apos;apport en industrie</label>
                                  <textarea
                                    value={answers.apport_industrie_description || ""}
                                    onChange={(e) => setAnswer("apport_industrie_description", e.target.value)}
                                    placeholder="Décrivez les compétences, connaissances ou services apportés..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 resize-none transition-all"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Déclaration de remploi / bien propre — si marié communauté ou pacsé indivision */}
                          {answers.type_associe !== "morale" && (
                            answers.situation_matrimoniale === "marie" && (answers.regime_matrimonial === "communaute_reduite" || answers.regime_matrimonial === "communaute_universelle" || answers.regime_matrimonial === "participation_acquets")
                            || answers.situation_matrimoniale === "pacse"
                          ) && (
                            <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5 space-y-3">
                              <div className="flex items-start gap-3">
                                <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <div className="space-y-2">
                                  <p className="text-base text-yellow-800 font-semibold">Apport de biens communs / indivis</p>
                                  <p className="text-xs text-yellow-700">
                                    {answers.situation_matrimoniale === "marie"
                                      ? "En régime de communauté, les fonds utilisés pour l'apport peuvent être des biens communs. Votre conjoint doit être informé de cet apport (art. 1832-2 C. civ. — inapplicable en SAS, mais recommandé). Vous pouvez effectuer une déclaration de remploi pour qualifier l'apport de bien propre."
                                      : "En PACS avec indivision, les fonds apportés peuvent être indivis. Vous pouvez effectuer une déclaration de remploi pour qualifier l'apport de bien propre."
                                    }
                                  </p>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-yellow-800 mb-2">Souhaitez-vous faire une déclaration de remploi (bien propre) ?</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <button
                                    onClick={() => setAnswer("declaration_remploi", "oui")}
                                    className={cn(
                                      "p-3 rounded-xl border-2 text-base font-medium transition-all",
                                      answers.declaration_remploi === "oui" ? "border-[#2563EB] bg-white text-[#1E3A8A]" : "border-yellow-300 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                    )}
                                  >
                                    Oui
                                  </button>
                                  <button
                                    onClick={() => setAnswer("declaration_remploi", "non")}
                                    className={cn(
                                      "p-3 rounded-xl border-2 text-base font-medium transition-all",
                                      answers.declaration_remploi === "non" ? "border-[#2563EB] bg-white text-[#1E3A8A]" : "border-yellow-300 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                    )}
                                  >
                                    Non
                                  </button>
                                </div>
                              </div>

                              {answers.declaration_remploi === "oui" && (
                                <div className="bg-white border border-yellow-200 rounded-xl p-4 space-y-3">
                                  <p className="text-sm text-gray-600">
                                    Une <strong>attestation d&apos;origine patrimoniale des apports</strong> (bien propre) sera automatiquement générée avec vos informations et jointe à votre dossier.
                                  </p>
                                  <button
                                    onClick={async () => {
                                      const { buildAttestationOrigine } = await import("@/app/lib/generateSasuDocuments");
                                      const { generateSasuDocumentDocx } = await import("@/app/lib/generateDocx");
                                      const text = buildAttestationOrigine(answers);
                                      const blob = await generateSasuDocumentDocx(text);
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement("a");
                                      a.href = url;
                                      a.download = "attestation-origine-patrimoniale.docx";
                                      a.click();
                                      URL.revokeObjectURL(url);
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                                  >
                                    <Download className="w-4 h-4" />
                                    Télécharger l&apos;attestation d&apos;origine patrimoniale (bien propre)
                                  </button>
                                </div>
                              )}

                              {answers.declaration_remploi === "non" && (
                                <div className="bg-white border border-yellow-200 rounded-xl p-4 space-y-3">
                                  <p className="text-sm text-gray-600">
                                    Vos apports seront qualifiés de <strong>biens communs</strong>. Une attestation sera générée avec un bloc de signature pour votre conjoint / partenaire, afin de prévenir toute contestation ultérieure.
                                  </p>
                                  <button
                                    onClick={async () => {
                                      const { buildAttestationBiensCommuns } = await import("@/app/lib/generateSasuDocuments");
                                      const { generateSasuDocumentDocx } = await import("@/app/lib/generateDocx");
                                      const text = buildAttestationBiensCommuns(answers);
                                      const blob = await generateSasuDocumentDocx(text);
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement("a");
                                      a.href = url;
                                      a.download = "attestation-origine-biens-communs.docx";
                                      a.click();
                                      URL.revokeObjectURL(url);
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                                  >
                                    <Download className="w-4 h-4" />
                                    Télécharger l&apos;attestation biens communs
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Info PM: pas d'apport en industrie */}
                          {answers.type_associe === "morale" && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                              <p className="text-base text-gray-700">
                                <Lightbulb className="inline w-4 h-4 mr-1 text-[#2563EB]" />
                                <strong>Note :</strong> Une personne morale ne peut pas effectuer d&apos;apport en industrie. Seuls les apports en numéraire et en nature sont possibles.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  );
                })()}

                {/* ── Nomination du Président ── */}
                {POST_PAGES[postPage]?.id === "nomination_president" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>

                    <AccordionItem title="Plus d'informations">
                      <div className="text-base text-gray-600 space-y-2">
                        <p>Sélectionnez une personne</p>
                      </div>
                    </AccordionItem>

                    {/* Info block */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                      <p className="text-base text-gray-700 text-justify">
                        Afin de compléter les informations légales relatives au Président, merci d&apos;indiquer les éléments de filiation ci-dessous et attester sur l&apos;honneur l&apos;absence de condamnation ou d&apos;interdiction de gérer de président. <em>(Ces informations sont requises pour les formalités d&apos;immatriculation au registre du commerce.)</em>
                      </p>
                    </div>

                    {/* Option 1 */}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-[#1E3A8A]">Option 1 : L&apos;associé unique est également Président</h3>
                      <p className="text-base text-gray-600">C&apos;est la solution la plus courante : vous cumulez les fonctions d&apos;associé unique et de Président.</p>
                    </div>

                    {/* Option 2 */}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-[#2563EB]">Option 2 : Nommer un Président distinct</h3>
                      <p className="text-base text-gray-600">Vous pouvez désigner une autre personne physique ou morale (par exemple un proche ou un partenaire professionnel) comme Président non associé.</p>
                    </div>

                    {/* Choix associé unique dans la liste */}
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setAnswer("president_option", answers.president_option === "associe" ? "" : "associe");
                          setAnswer("president_type", "");
                        }}
                        className={cn(
                          "w-full flex items-center gap-4 p-5 rounded-xl border-2 bg-white text-left transition-all",
                          answers.president_option === "associe"
                            ? "border-[#2563EB] bg-[#EFF6FF]"
                            : "border-gray-200 hover:border-[#2563EB]/50"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0",
                          answers.president_option === "associe"
                            ? "border-[#2563EB] bg-[#2563EB]"
                            : "border-gray-300"
                        )}>
                          {answers.president_option === "associe" && <Check className="w-4 h-4 text-white" />}
                        </div>
                        {answers.type_associe === "morale" ? (
                          <Building2 className="w-8 h-8 text-[#2563EB] flex-shrink-0" />
                        ) : (
                          <User className="w-8 h-8 text-[#2563EB] flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="font-bold text-[#1E3A8A]">
                            {answers.type_associe === "morale"
                              ? (answers.associe_societe_nom || "Société associée")
                              : [answers.associe_prenom, answers.associe_nom].filter(Boolean).join(" ") || "Associé unique"}
                          </p>
                          <p className="text-xs text-gray-500">Associé unique — sera nommé Président</p>
                        </div>
                      </button>
                    </div>

                    {/* Bouton ajouter un tiers */}
                    {answers.president_option !== "distinct" && (
                      <button
                        onClick={() => {
                          setAnswer("president_option", "distinct");
                          setAnswer("president_type", "");
                        }}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1D4ED8] transition-colors"
                      >
                        Ajoutez un dirigeant non associé <span className="text-lg">+</span>
                      </button>
                    )}

                    {/* Formulaire tiers */}
                    {answers.president_option === "distinct" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-2 border-gray-200 rounded-xl p-5 space-y-5"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-base font-bold text-[#1E3A8A]">Type de profil :</p>
                          <button
                            onClick={() => {
                              setAnswer("president_option", "");
                              setAnswer("president_type", "");
                            }}
                            className="p-1 hover:bg-gray-100 rounded-lg"
                          >
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            onClick={() => setAnswer("president_type", "physique")}
                            className={cn(
                              "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                              answers.president_type === "physique"
                                ? "border-[#2563EB] bg-blue-50"
                                : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                            )}
                          >
                            <User className="w-10 h-10 text-[#2563EB]" />
                            <span className="text-sm font-medium text-[#2563EB]">Particulier (personne physique)</span>
                          </button>
                          <button
                            onClick={() => setAnswer("president_type", "morale")}
                            className={cn(
                              "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                              answers.president_type === "morale"
                                ? "border-[#2563EB] bg-blue-50"
                                : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                            )}
                          >
                            <Building2 className="w-10 h-10 text-[#2563EB]" />
                            <span className="text-sm font-medium text-[#2563EB]">Société (personne morale)</span>
                          </button>
                        </div>

                        {/* ── Président PP : identité + filiation + non-condamnation ── */}
                        {answers.president_type === "physique" && (
                          <div className="space-y-4 border-t border-gray-200 pt-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-base font-bold text-[#1E3A8A] mb-1">Civilité</label>
                                <select
                                  value={answers.president_civilite || ""}
                                  onChange={(e) => setAnswer("president_civilite", e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 bg-white transition-all"
                                >
                                  <option value="">Choisir</option>
                                  <option value="M.">M.</option>
                                  <option value="Mme">Mme</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nom</label>
                                <input type="text" value={answers.president_nom || ""} onChange={(e) => setAnswer("president_nom", e.target.value)} placeholder="Nom de famille" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-base font-bold text-[#1E3A8A] mb-1">Prénom</label>
                                <input type="text" value={answers.president_prenom || ""} onChange={(e) => setAnswer("president_prenom", e.target.value)} placeholder="Prénom" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                              </div>
                              <div>
                                <label className="block text-base font-bold text-[#1E3A8A] mb-1">Date de naissance</label>
                                <input type="date" value={answers.president_date_naissance || ""} onChange={(e) => setAnswer("president_date_naissance", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                {/* Age check président */}
                                {(() => {
                                  if (!answers.president_date_naissance) return null;
                                  const birth = new Date(answers.president_date_naissance);
                                  const today = new Date();
                                  let age = today.getFullYear() - birth.getFullYear();
                                  const m = today.getMonth() - birth.getMonth();
                                  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                                  if (age >= 18) return null;
                                  if (age < 16) return (
                                    <div className="bg-red-50 border border-red-300 rounded-xl p-3 mt-2">
                                      <p className="text-sm font-semibold text-red-800">Un mineur de moins de 16 ans ne peut pas être président d&apos;une SASU, même émancipé.</p>
                                    </div>
                                  );
                                  return (
                                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 mt-2 space-y-2">
                                      <p className="text-sm font-semibold text-amber-800">Le président a entre 16 et 17 ans. Il doit être mineur émancipé pour diriger une SASU.</p>
                                      <div className="flex gap-3">
                                        <button onClick={() => setAnswer("president_emancipe", "oui")} className={cn("flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all", answers.president_emancipe === "oui" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600")}>Oui, mineur émancipé</button>
                                        <button onClick={() => setAnswer("president_emancipe", "non")} className={cn("flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all", answers.president_emancipe === "non" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 bg-white text-gray-600")}>Non</button>
                                      </div>
                                      {answers.president_emancipe === "non" && <p className="text-sm text-red-600">Un mineur non émancipé ne peut pas être président.</p>}
                                      {answers.president_emancipe === "oui" && <p className="text-sm text-green-700">Un justificatif d&apos;émancipation (jugement du tribunal) sera demandé dans les pièces justificatives.</p>}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-base font-bold text-[#1E3A8A] mb-1">Lieu de naissance (ville)</label>
                                <input type="text" value={answers.president_lieu_naissance || ""} onChange={(e) => setAnswer("president_lieu_naissance", e.target.value)} placeholder="Ville de naissance" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                              </div>
                              <div>
                                <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nationalité</label>
                                <input type="text" value={answers.president_nationalite || ""} onChange={(e) => setAnswer("president_nationalite", e.target.value)} placeholder="Ex : Française" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-base font-bold text-[#1E3A8A] mb-1">Adresse personnelle</label>
                              <AddressAutocomplete value={answers.president_adresse || ""} onChange={(v) => setAnswer("president_adresse", v)} placeholder="Adresse complète" />
                            </div>

                            {/* Filiation */}
                            <p className="text-base font-bold text-[#1E3A8A] pt-2">Filiation</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nom du père</label>
                                <input type="text" value={answers.president_pere_nom || ""} onChange={(e) => setAnswer("president_pere_nom", e.target.value)} placeholder="Nom et prénom du père" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                              </div>
                              <div>
                                <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nom de la mère</label>
                                <input type="text" value={answers.president_mere_nom || ""} onChange={(e) => setAnswer("president_mere_nom", e.target.value)} placeholder="Nom et prénom de la mère" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                              </div>
                            </div>

                            {/* Non-condamnation */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" checked={answers.president_non_condamnation === "true"} onChange={(e) => setAnswer("president_non_condamnation", e.target.checked ? "true" : "")} className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" />
                                <span className="text-base text-gray-700">J&apos;atteste sur l&apos;honneur ne pas avoir fait l&apos;objet d&apos;une condamnation pénale ou d&apos;une sanction civile ou administrative de nature à m&apos;interdire de gérer, d&apos;administrer ou de diriger une personne morale.</span>
                              </label>
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" checked={answers.president_non_interdiction === "true"} onChange={(e) => setAnswer("president_non_interdiction", e.target.checked ? "true" : "")} className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" />
                                <span className="text-base text-gray-700">J&apos;atteste sur l&apos;honneur ne pas être frappé(e) d&apos;une mesure d&apos;interdiction de gérer prévue à l&apos;article L. 653-8 du Code de commerce.</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {/* ── Président PM : SIREN + infos + RP filiation + non-condamnation ── */}
                        {answers.president_type === "morale" && (
                          <div className="space-y-4 border-t border-gray-200 pt-5">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                              <p className="text-base text-gray-700">Pour nommer un dirigeant personne morale non associé, indiquez directement le numéro RCS de la société. Nous pourrons ainsi la retrouver automatiquement dans le registre officiel et pré remplir ses informations (dénomination, adresse, dirigeants, etc.)</p>
                              <p className="text-base text-gray-700">Vous trouverez ce numéro sur votre extrait Kbis.</p>
                              <p className="text-base text-gray-700">Si vous ne le trouvez pas, vous pouvez tout de même remplir les informations manuellement.</p>
                              <div className="flex justify-end">
                                <button onClick={() => setAnswer("president_pm_mode", "manuel")} className="px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-sm font-semibold hover:opacity-90 transition-opacity">Remplir manuellement</button>
                              </div>
                            </div>

                            {/* SIREN search */}
                            <div>
                              <label className="block text-base font-bold text-[#1E3A8A] mb-1">Numéro SIREN</label>
                              <div className="flex gap-3">
                                <input type="text" value={answers.president_pm_siren || ""} onChange={(e) => setAnswer("president_pm_siren", e.target.value)} placeholder="Ex : 824330799" className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                <button
                                  onClick={async () => {
                                    const siren = (answers.president_pm_siren || "").replace(/\s/g, "");
                                    if (siren.length !== 9) return;
                                    try {
                                      const res = await fetch(`/api/siren?siren=${siren}`);
                                      if (res.ok) {
                                        const data = await res.json();
                                        setAnswer("president_pm_nom", data.denominationSociale || "");
                                        setAnswer("president_pm_forme", data.formeJuridique || "");
                                        setAnswer("president_pm_capital", data.capitalSocial || "");
                                        setAnswer("president_pm_representant", data.representant || "");
                                        setAnswer("president_pm_adresse", [data.siegeSocial, data.codePostal, data.ville].filter(Boolean).join(", "));
                                        setAnswer("president_pm_ville_rcs", data.ville || "");
                                        setAnswer("president_pm_code_postal", data.codePostal || "");
                                        setAnswer("president_pm_mode", "siren");
                                      }
                                    } catch { /* ignore */ }
                                  }}
                                  disabled={!answers.president_pm_siren || answers.president_pm_siren.replace(/\s/g, "").length !== 9}
                                  className="px-6 py-3 rounded-xl bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1D4ED8] disabled:bg-[#9CA3AF] transition-colors"
                                >Confirmer mon Numéro</button>
                              </div>
                            </div>

                            {/* Infos entreprise */}
                            {(answers.president_pm_mode === "siren" || answers.president_pm_mode === "manuel") && (
                              <div className="space-y-4 border-t border-gray-200 pt-4">
                                <p className="text-sm font-bold text-[#2563EB]">Informations entreprise</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nom de la société</label>
                                    <input type="text" value={answers.president_pm_nom || ""} onChange={(e) => setAnswer("president_pm_nom", e.target.value)} placeholder="Ex : LAW AND CO" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-base font-bold text-[#1E3A8A] mb-1">Type de société</label>
                                    <input type="text" value={answers.president_pm_forme || ""} onChange={(e) => setAnswer("president_pm_forme", e.target.value)} placeholder="Ex : SASU" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-base font-bold text-[#1E3A8A] mb-1">Capital social</label>
                                    <input type="text" value={answers.president_pm_capital || ""} onChange={(e) => setAnswer("president_pm_capital", e.target.value)} placeholder="Ex : 100" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nom et prénom du représentant</label>
                                    <input type="text" value={answers.president_pm_representant || ""} onChange={(e) => setAnswer("president_pm_representant", e.target.value)} placeholder="Ex : Nora Gabsi" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-base font-bold text-[#1E3A8A] mb-1">Adresse</label>
                                    <AddressAutocomplete value={answers.president_pm_adresse || ""} onChange={(v) => setAnswer("president_pm_adresse", v)} placeholder="Adresse complète" />
                                  </div>
                                  <div>
                                    <label className="block text-base font-bold text-[#1E3A8A] mb-1">Complément d&apos;adresse</label>
                                    <input type="text" value={answers.president_pm_adresse_complement || ""} onChange={(e) => setAnswer("president_pm_adresse_complement", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-base font-bold text-[#1E3A8A] mb-1">Ville RCS</label>
                                    <input type="text" value={answers.president_pm_ville_rcs || ""} onChange={(e) => setAnswer("president_pm_ville_rcs", e.target.value)} placeholder="Ex : PARIS" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-base font-bold text-[#1E3A8A] mb-1">Code postal</label>
                                    <input type="text" value={answers.president_pm_code_postal || ""} onChange={(e) => setAnswer("president_pm_code_postal", e.target.value)} placeholder="Ex : 75009" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                  </div>
                                </div>

                                {/* Carte société nommée */}
                                {answers.president_pm_nom && (
                                  <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#2563EB] bg-[#EFF6FF]">
                                    <Building2 className="w-6 h-6 text-[#2563EB]" />
                                    <span className="font-bold text-[#1E3A8A]">{answers.president_pm_nom}</span>
                                  </div>
                                )}

                                {/* Représentant permanent + filiation + non-condamnation */}
                                <div className="border border-gray-200 rounded-xl p-5 space-y-4">
                                  <h4 className="text-base font-bold text-[#1E3A8A]">Représentant permanent de la société dirigeante</h4>

                                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                                    <p className="text-base font-bold text-[#1E3A8A]">Représentant permanent</p>
                                    <p className="text-base text-gray-700">
                                      Lorsqu&apos;une société est nommée dirigeante, elle doit désigner une <strong>personne physique</strong> chargée de la représenter. Ce <em className="font-semibold text-[#2563EB]">représentant permanent</em> exerce les droits de la société dirigeante (signature, vote en assemblée). Ces informations seront inscrites dans les statuts et déclarées au greffe.
                                    </p>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-base font-bold text-[#1E3A8A] mb-1">Civilité</label>
                                      <select value={answers.president_rp_civilite || ""} onChange={(e) => setAnswer("president_rp_civilite", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 bg-white transition-all">
                                        <option value="">Choisir</option>
                                        <option value="M.">M.</option>
                                        <option value="Mme">Mme</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nom</label>
                                      <input type="text" value={answers.president_rp_nom || ""} onChange={(e) => setAnswer("president_rp_nom", e.target.value)} placeholder="Nom de famille" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-base font-bold text-[#1E3A8A] mb-1">Prénom</label>
                                      <input type="text" value={answers.president_rp_prenom || ""} onChange={(e) => setAnswer("president_rp_prenom", e.target.value)} placeholder="Prénom" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                    </div>
                                    <div>
                                      <label className="block text-base font-bold text-[#1E3A8A] mb-1">Fonction dans la société</label>
                                      <select value={answers.president_rp_fonction || ""} onChange={(e) => setAnswer("president_rp_fonction", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 bg-white transition-all">
                                        <option value="">Choisir</option>
                                        <option value="president">Président</option>
                                        <option value="dg">Directeur Général</option>
                                        <option value="gerant">Gérant</option>
                                        <option value="autre">Autre</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-base font-bold text-[#1E3A8A] mb-1">Date de naissance</label>
                                      <input type="date" value={answers.president_rp_date_naissance || ""} onChange={(e) => setAnswer("president_rp_date_naissance", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                      {/* Age check RP */}
                                      {(() => {
                                        if (!answers.president_rp_date_naissance) return null;
                                        const birth = new Date(answers.president_rp_date_naissance);
                                        const today = new Date();
                                        let age = today.getFullYear() - birth.getFullYear();
                                        const m = today.getMonth() - birth.getMonth();
                                        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                                        if (age < 18) return (
                                          <div className="bg-red-50 border border-red-300 rounded-xl p-3 mt-2">
                                            <p className="text-sm font-semibold text-red-800">Le représentant permanent doit être majeur (18 ans minimum).</p>
                                          </div>
                                        );
                                        return null;
                                      })()}
                                    </div>
                                    <div>
                                      <label className="block text-base font-bold text-[#1E3A8A] mb-1">Lieu de naissance (ville)</label>
                                      <input type="text" value={answers.president_rp_lieu_naissance || ""} onChange={(e) => setAnswer("president_rp_lieu_naissance", e.target.value)} placeholder="Ville de naissance" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-base font-bold text-[#1E3A8A] mb-1">Adresse personnelle</label>
                                      <AddressAutocomplete value={answers.president_rp_adresse || ""} onChange={(v) => setAnswer("president_rp_adresse", v)} placeholder="Adresse complète" />
                                    </div>
                                    <div>
                                      <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nationalité</label>
                                      <input type="text" value={answers.president_rp_nationalite || ""} onChange={(e) => setAnswer("president_rp_nationalite", e.target.value)} placeholder="Ex : Française" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                    </div>
                                  </div>

                                  {/* Filiation du RP */}
                                  <p className="text-base font-bold text-[#1E3A8A] pt-2">Filiation du représentant permanent</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nom du père</label>
                                      <input type="text" value={answers.president_rp_pere_nom || ""} onChange={(e) => setAnswer("president_rp_pere_nom", e.target.value)} placeholder="Nom et prénom du père" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                    </div>
                                    <div>
                                      <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nom de la mère</label>
                                      <input type="text" value={answers.president_rp_mere_nom || ""} onChange={(e) => setAnswer("president_rp_mere_nom", e.target.value)} placeholder="Nom et prénom de la mère" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                    </div>
                                  </div>

                                  {/* Non-condamnation du RP */}
                                  <p className="text-base font-bold text-[#1E3A8A] pt-2">Déclaration de non-condamnation du représentant permanent</p>
                                  <p className="text-sm text-gray-500">En tant que représentant permanent de la société dirigeante, cette déclaration est faite en votre nom personnel.</p>
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                      <input type="checkbox" checked={answers.president_rp_non_condamnation === "true"} onChange={(e) => setAnswer("president_rp_non_condamnation", e.target.checked ? "true" : "")} className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" />
                                      <span className="text-base text-gray-700">Je soussigné(e), en qualité de représentant permanent de la société dirigeante, atteste sur l&apos;honneur ne pas avoir fait l&apos;objet d&apos;une condamnation pénale ou d&apos;une sanction civile ou administrative de nature à m&apos;interdire de gérer, d&apos;administrer ou de diriger une personne morale.</span>
                                    </label>
                                    <label className="flex items-start gap-3 cursor-pointer">
                                      <input type="checkbox" checked={answers.president_rp_non_interdiction === "true"} onChange={(e) => setAnswer("president_rp_non_interdiction", e.target.checked ? "true" : "")} className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" />
                                      <span className="text-base text-gray-700">Je soussigné(e), en qualité de représentant permanent de la société dirigeante, atteste sur l&apos;honneur ne pas être frappé(e) d&apos;une mesure d&apos;interdiction de gérer prévue à l&apos;article L. 653-8 du Code de commerce.</span>
                                    </label>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* ── Question DG : souhaitez-vous nommer un DG ? ── */}
                    <div className="border-t border-gray-200 pt-5 space-y-3">
                      <p className="text-base font-bold text-[#1E3A8A]">Souhaitez-vous nommer un Directeur Général ?</p>
                      <p className="text-sm text-gray-500">Le DG dispose des mêmes pouvoirs que le Président vis-à-vis des tiers. C&apos;est facultatif en SASU.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => setAnswer("nommer_dg", "oui")}
                          className={cn(
                            "p-4 rounded-xl border-2 text-center text-base font-semibold transition-all",
                            answers.nommer_dg === "oui" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                          )}
                        >
                          Oui
                        </button>
                        <button
                          onClick={() => setAnswer("nommer_dg", "non")}
                          className={cn(
                            "p-4 rounded-xl border-2 text-center text-base font-semibold transition-all",
                            answers.nommer_dg === "non" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                          )}
                        >
                          Non
                        </button>
                      </div>

                      {answers.nommer_dg === "oui" && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 border-l-2 border-[#2563EB]/30 pl-4 ml-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-base font-bold text-[#1E3A8A] mb-1">Civilité</label>
                              <select value={answers.dg_civilite || ""} onChange={(e) => setAnswer("dg_civilite", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 bg-white transition-all">
                                <option value="">Choisir</option>
                                <option value="M.">M.</option>
                                <option value="Mme">Mme</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nom</label>
                              <input type="text" value={answers.dg_nom || ""} onChange={(e) => setAnswer("dg_nom", e.target.value)} placeholder="Nom de famille" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-base font-bold text-[#1E3A8A] mb-1">Prénom</label>
                              <input type="text" value={answers.dg_prenom || ""} onChange={(e) => setAnswer("dg_prenom", e.target.value)} placeholder="Prénom" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                            </div>
                            <div>
                              <label className="block text-base font-bold text-[#1E3A8A] mb-1">Date de naissance</label>
                              <input type="date" value={answers.dg_date_naissance || ""} onChange={(e) => setAnswer("dg_date_naissance", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                              {/* Age check DG */}
                              {(() => {
                                if (!answers.dg_date_naissance) return null;
                                const birth = new Date(answers.dg_date_naissance);
                                const today = new Date();
                                let age = today.getFullYear() - birth.getFullYear();
                                const m = today.getMonth() - birth.getMonth();
                                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                                if (age >= 18) return null;
                                if (age < 16) return (
                                  <div className="bg-red-50 border border-red-300 rounded-xl p-3 mt-2">
                                    <p className="text-sm font-semibold text-red-800">Un mineur de moins de 16 ans ne peut pas être Directeur Général.</p>
                                  </div>
                                );
                                return (
                                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 mt-2 space-y-2">
                                    <p className="text-sm font-semibold text-amber-800">Le DG a entre 16 et 17 ans. Il doit être mineur émancipé.</p>
                                    <div className="flex gap-3">
                                      <button onClick={() => setAnswer("dg_emancipe", "oui")} className={cn("flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all", answers.dg_emancipe === "oui" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600")}>Oui, mineur émancipé</button>
                                      <button onClick={() => setAnswer("dg_emancipe", "non")} className={cn("flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all", answers.dg_emancipe === "non" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 bg-white text-gray-600")}>Non</button>
                                    </div>
                                    {answers.dg_emancipe === "non" && <p className="text-sm text-red-600">Un mineur non émancipé ne peut pas être DG.</p>}
                                    {answers.dg_emancipe === "oui" && <p className="text-sm text-green-700">Un justificatif d&apos;émancipation sera demandé dans les pièces justificatives.</p>}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-base font-bold text-[#1E3A8A] mb-1">Lieu de naissance</label>
                              <input type="text" value={answers.dg_lieu_naissance || ""} onChange={(e) => setAnswer("dg_lieu_naissance", e.target.value)} placeholder="Ville" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                            </div>
                            <div>
                              <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nationalité</label>
                              <input type="text" value={answers.dg_nationalite || ""} onChange={(e) => setAnswer("dg_nationalite", e.target.value)} placeholder="Ex : Française" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-base font-bold text-[#1E3A8A] mb-1">Adresse personnelle</label>
                            <AddressAutocomplete value={answers.dg_adresse || ""} onChange={(v) => setAnswer("dg_adresse", v)} placeholder="Adresse complète" />
                          </div>

                          <div className="border-t border-gray-200 pt-4 space-y-3">
                            <p className="text-base font-bold text-[#1E3A8A]">Pouvoirs du Directeur Général</p>
                            <div className="space-y-2">
                              <button
                                onClick={() => setAnswer("dg_pouvoirs", "interne")}
                                className={cn(
                                  "w-full p-4 rounded-xl border-2 text-left text-base font-semibold transition-all",
                                  answers.dg_pouvoirs === "interne" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                )}
                              >
                                Direction interne uniquement
                                <span className="block text-sm font-normal text-gray-500 mt-1">Pas de représentation externe</span>
                              </button>
                              <button
                                onClick={() => setAnswer("dg_pouvoirs", "representation")}
                                className={cn(
                                  "w-full p-4 rounded-xl border-2 text-left text-base font-semibold transition-all",
                                  answers.dg_pouvoirs === "representation" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                )}
                              >
                                Direction interne + représentation externe
                                <span className="block text-sm font-normal text-gray-500 mt-1">Engage la société vis-à-vis des tiers</span>
                              </button>
                            </div>
                          </div>

                          {/* Filiation du DG */}
                          <div className="border-t border-gray-200 pt-4 space-y-3">
                            <p className="text-base font-bold text-[#1E3A8A]">Filiation du Directeur Général</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nom et prénom du père</label>
                                <input type="text" value={answers.dg_pere_nom || ""} onChange={(e) => setAnswer("dg_pere_nom", e.target.value)} placeholder="Nom et prénom du père" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                              </div>
                              <div>
                                <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nom et prénom de la mère</label>
                                <input type="text" value={answers.dg_mere_nom || ""} onChange={(e) => setAnswer("dg_mere_nom", e.target.value)} placeholder="Nom et prénom de la mère" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                              </div>
                            </div>
                          </div>

                          {/* Non-condamnation du DG */}
                          <div className="border-t border-gray-200 pt-4 space-y-3">
                            <p className="text-base font-bold text-[#1E3A8A]">Déclaration de non-condamnation du Directeur Général</p>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" checked={answers.dg_non_condamnation === "true"} onChange={(e) => setAnswer("dg_non_condamnation", e.target.checked ? "true" : "")} className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" />
                                <span className="text-base text-gray-700">Je soussigné(e), en qualité de Directeur Général désigné, atteste sur l&apos;honneur ne pas avoir fait l&apos;objet d&apos;une condamnation pénale ou d&apos;une sanction civile ou administrative de nature à m&apos;interdire de gérer, d&apos;administrer ou de diriger une personne morale.</span>
                              </label>
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" checked={answers.dg_non_interdiction === "true"} onChange={(e) => setAnswer("dg_non_interdiction", e.target.checked ? "true" : "")} className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" />
                                <span className="text-base text-gray-700">Je soussigné(e), en qualité de Directeur Général désigné, atteste sur l&apos;honneur ne pas être frappé(e) d&apos;une mesure d&apos;interdiction de gérer prévue à l&apos;article L. 653-8 du Code de commerce.</span>
                              </label>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ── Question DGD : souhaitez-vous nommer un DGD ? (si DG nommé) ── */}
                      {answers.nommer_dg === "oui" && (
                        <div className="border-t border-gray-200 pt-5 space-y-3 mt-4">
                          <p className="text-base font-bold text-[#1E3A8A]">Souhaitez-vous nommer un Directeur Général Délégué (DGD) ?</p>
                          <p className="text-sm text-gray-500">Le DGD assiste le DG ou le Président dans la direction, avec des pouvoirs délégués. C&apos;est facultatif et rare en SASU.</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button onClick={() => setAnswer("nommer_dgd", "oui")} className={cn("p-4 rounded-xl border-2 text-center text-base font-semibold transition-all", answers.nommer_dgd === "oui" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50")}>Oui</button>
                            <button onClick={() => setAnswer("nommer_dgd", "non")} className={cn("p-4 rounded-xl border-2 text-center text-base font-semibold transition-all", (answers.nommer_dgd || "non") === "non" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50")}>Non</button>
                          </div>

                          {answers.nommer_dgd === "oui" && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 border-l-2 border-[#7C3AED]/30 pl-4 ml-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-base font-bold text-[#1E3A8A] mb-1">Civilité</label>
                                  <select value={answers.dgd_civilite || ""} onChange={(e) => setAnswer("dgd_civilite", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 bg-white transition-all">
                                    <option value="">Choisir</option>
                                    <option value="M.">M.</option>
                                    <option value="Mme">Mme</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nom</label>
                                  <input type="text" value={answers.dgd_nom || ""} onChange={(e) => setAnswer("dgd_nom", e.target.value)} placeholder="Nom de famille" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-base font-bold text-[#1E3A8A] mb-1">Prénom</label>
                                  <input type="text" value={answers.dgd_prenom || ""} onChange={(e) => setAnswer("dgd_prenom", e.target.value)} placeholder="Prénom" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                </div>
                                <div>
                                  <label className="block text-base font-bold text-[#1E3A8A] mb-1">Date de naissance</label>
                                  <input type="date" value={answers.dgd_date_naissance || ""} onChange={(e) => setAnswer("dgd_date_naissance", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                  {(() => {
                                    if (!answers.dgd_date_naissance) return null;
                                    const birth = new Date(answers.dgd_date_naissance);
                                    const today = new Date();
                                    let age = today.getFullYear() - birth.getFullYear();
                                    const m = today.getMonth() - birth.getMonth();
                                    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                                    if (age >= 18) return null;
                                    if (age < 16) return (<div className="bg-red-50 border border-red-300 rounded-xl p-3 mt-2"><p className="text-sm font-semibold text-red-800">Un mineur de moins de 16 ans ne peut pas être DGD.</p></div>);
                                    return (
                                      <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 mt-2 space-y-2">
                                        <p className="text-sm font-semibold text-amber-800">Le DGD a entre 16 et 17 ans. Il doit être mineur émancipé.</p>
                                        <div className="flex gap-3">
                                          <button onClick={() => setAnswer("dgd_emancipe", "oui")} className={cn("flex-1 py-2 rounded-xl border-2 text-sm font-semibold", answers.dgd_emancipe === "oui" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600")}>Oui, émancipé</button>
                                          <button onClick={() => setAnswer("dgd_emancipe", "non")} className={cn("flex-1 py-2 rounded-xl border-2 text-sm font-semibold", answers.dgd_emancipe === "non" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 bg-white text-gray-600")}>Non</button>
                                        </div>
                                        {answers.dgd_emancipe === "non" && <p className="text-sm text-red-600">Impossible.</p>}
                                        {answers.dgd_emancipe === "oui" && <p className="text-sm text-green-700">Justificatif requis.</p>}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-base font-bold text-[#1E3A8A] mb-1">Lieu de naissance</label>
                                  <input type="text" value={answers.dgd_lieu_naissance || ""} onChange={(e) => setAnswer("dgd_lieu_naissance", e.target.value)} placeholder="Ville" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                </div>
                                <div>
                                  <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nationalité</label>
                                  <input type="text" value={answers.dgd_nationalite || ""} onChange={(e) => setAnswer("dgd_nationalite", e.target.value)} placeholder="Ex : Française" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-base font-bold text-[#1E3A8A] mb-1">Adresse personnelle</label>
                                <AddressAutocomplete value={answers.dgd_adresse || ""} onChange={(v) => setAnswer("dgd_adresse", v)} placeholder="Adresse complète" />
                              </div>
                              <div className="border-t border-gray-200 pt-4 space-y-3">
                                <p className="text-base font-bold text-[#1E3A8A]">Filiation du DGD</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nom et prénom du père</label>
                                    <input type="text" value={answers.dgd_pere_nom || ""} onChange={(e) => setAnswer("dgd_pere_nom", e.target.value)} placeholder="Nom et prénom du père" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-base font-bold text-[#1E3A8A] mb-1">Nom et prénom de la mère</label>
                                    <input type="text" value={answers.dgd_mere_nom || ""} onChange={(e) => setAnswer("dgd_mere_nom", e.target.value)} placeholder="Nom et prénom de la mère" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                  </div>
                                </div>
                              </div>
                              <div className="border-t border-gray-200 pt-4 space-y-3">
                                <p className="text-base font-bold text-[#1E3A8A]">Déclaration de non-condamnation du DGD</p>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
                                  <label className="flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" checked={answers.dgd_non_condamnation === "true"} onChange={(e) => setAnswer("dgd_non_condamnation", e.target.checked ? "true" : "")} className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" />
                                    <span className="text-base text-gray-700">Je soussigné(e) atteste sur l&apos;honneur ne pas avoir fait l&apos;objet d&apos;une condamnation ou sanction de nature à m&apos;interdire de gérer une personne morale.</span>
                                  </label>
                                  <label className="flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" checked={answers.dgd_non_interdiction === "true"} onChange={(e) => setAnswer("dgd_non_interdiction", e.target.checked ? "true" : "")} className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" />
                                    <span className="text-base text-gray-700">Je soussigné(e) atteste ne pas être frappé(e) d&apos;une mesure d&apos;interdiction de gérer (art. L. 653-8 C. com.).</span>
                                  </label>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Bénéficiaire effectif (DBE) ── */}
                {POST_PAGES[postPage]?.id === "beneficiaire_effectif" && (() => {
                  // Auto-populate first beneficial owner from associate data
                  if (!answers.beneficiaires_effectifs?.length) {
                    const isPhysique = answers.type_associe !== "morale";
                    const firstBE = {
                      nom: isPhysique ? (answers.associe_nom || "") : "",
                      prenom: isPhysique ? (answers.associe_prenom || "") : "",
                      date_naissance: isPhysique ? (answers.associe_date_naissance || "") : "",
                      lieu_naissance: isPhysique ? (answers.associe_lieu_naissance || "") : "",
                      code_postal_naissance: "",
                      pays_naissance: "France",
                      nationalite: isPhysique ? (answers.associe_nationalite || "Française") : "Française",
                      adresse: isPhysique ? (answers.associe_adresse || "") : "",
                      code_postal: "",
                      ville: "",
                      pays_residence: "France",
                      nature_controle: ["detention_capital", "detention_votes"],
                      modalite_controle: "directe",
                      pct_capital: "100",
                      pct_votes: "100",
                      auto_detected: true,
                    };
                    setTimeout(() => setAnswer("beneficiaires_effectifs", [firstBE]), 0);
                  }

                  const beneficiaires: any[] = answers.beneficiaires_effectifs || [];

                  const updateBeneficiaire = (index: number, field: string, value: any) => {
                    const updated = [...beneficiaires];
                    updated[index] = { ...updated[index], [field]: value };
                    setAnswer("beneficiaires_effectifs", updated);
                  };

                  const toggleNatureControle = (index: number, key: string) => {
                    const updated = [...beneficiaires];
                    const current: string[] = updated[index].nature_controle || [];
                    if (current.includes(key)) {
                      updated[index] = { ...updated[index], nature_controle: current.filter((k: string) => k !== key) };
                    } else {
                      updated[index] = { ...updated[index], nature_controle: [...current, key] };
                    }
                    setAnswer("beneficiaires_effectifs", updated);
                  };

                  const addBeneficiaire = () => {
                    setAnswer("beneficiaires_effectifs", [...beneficiaires, {
                      nom: "", prenom: "", date_naissance: "", lieu_naissance: "",
                      code_postal_naissance: "", pays_naissance: "France",
                      nationalite: "Française", adresse: "", code_postal: "", ville: "",
                      pays_residence: "France",
                      nature_controle: [], modalite_controle: "directe",
                      pct_capital: "", pct_votes: "", auto_detected: false,
                    }]);
                  };

                  const removeBeneficiaire = (index: number) => {
                    setAnswer("beneficiaires_effectifs", beneficiaires.filter((_: any, i: number) => i !== index));
                  };

                  const NATURE_OPTIONS = [
                    { key: "detention_capital", label: "Détention de plus de 25% du capital social" },
                    { key: "detention_votes", label: "Détention de plus de 25% des droits de vote" },
                    { key: "controle_direction", label: "Exercice d\u2019un pouvoir de contrôle sur les organes de direction" },
                    { key: "autre_moyen", label: "Autre moyen de contrôle" },
                  ];

                  const MODALITE_OPTIONS = [
                    { key: "directe", label: "Directe (en son nom propre)" },
                    { key: "indirecte", label: "Indirecte (via une ou plusieurs entités)" },
                    { key: "conjointe", label: "Conjointe (avec d\u2019autres personnes)" },
                  ];

                  return (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                      <p className="text-base text-gray-500">Déclaration des bénéficiaires effectifs (DBE)</p>
                    </div>

                    <AccordionItem title="Plus d&apos;informations">
                      <div className="text-base text-gray-600 space-y-2">
                        <p>Obligation légale depuis janvier 2017. Toute société doit déclarer les personnes physiques qui la contrôlent. Sont concernés :</p>
                        <ul className="list-disc ml-5 space-y-1">
                          <li>Toute personne physique détenant directement ou indirectement plus de 25% du capital ou des droits de vote</li>
                          <li>Toute personne physique exerçant un pouvoir de contrôle sur les organes de gestion, d&apos;administration ou de direction (le Président)</li>
                        </ul>
                      </div>
                    </AccordionItem>

                    {/* Auto-detected beneficial owner */}
                    {answers.type_associe !== "morale" ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-600" />
                          <p className="text-base font-bold text-green-800">Bénéficiaire effectif détecté automatiquement</p>
                        </div>
                        <p className="text-sm text-green-700">L&apos;associé unique détient 100% du capital et des droits de vote.</p>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                          <p className="text-base font-bold text-amber-800">Associé unique = personne morale</p>
                        </div>
                        <p className="text-sm text-amber-700">
                          L&apos;associé unique est une société (<strong>{answers.associe_societe_nom || "PM"}</strong>). Le bénéficiaire effectif doit être une <strong>personne physique</strong>. Vous devez identifier la ou les personnes physiques qui contrôlent cette société :
                        </p>
                        <ul className="text-sm text-amber-700 list-disc ml-5 space-y-1">
                          <li>Un associé de la société mère détenant plus de 25% du capital</li>
                          <li>Ou le représentant légal exerçant le contrôle effectif de la direction</li>
                        </ul>
                        <p className="text-sm text-amber-700 font-semibold">L&apos;INPI exige au minimum 1 personne physique identifiée.</p>
                      </div>
                    )}

                    {/* Beneficial owner cards */}
                    {beneficiaires.map((be: any, idx: number) => {
                      const expandedKey = `be_expanded_${idx}`;
                      const isExpanded = answers[expandedKey] !== false;
                      return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.1 }}
                        className="border-2 border-gray-200 rounded-2xl overflow-hidden"
                      >
                        {/* Card header */}
                        <button
                          type="button"
                          onClick={() => setAnswer(expandedKey, !isExpanded)}
                          className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-[#2563EB]" />
                            </div>
                            <div className="text-left">
                              <p className="text-base font-semibold text-[#1E3A8A]">
                                {be.prenom || be.nom ? `${be.prenom} ${be.nom}`.trim() : `Bénéficiaire ${idx + 1}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {be.pct_capital ? `${be.pct_capital}% capital` : ""}{be.pct_capital && be.pct_votes ? " · " : ""}{be.pct_votes ? `${be.pct_votes}% droits de vote` : ""}
                              </p>
                            </div>
                            {be.auto_detected && (
                              <span className="ml-2 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">Auto-détecté</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!be.auto_detected && (
                              <span
                                role="button"
                                onClick={(e) => { e.stopPropagation(); removeBeneficiaire(idx); }}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </span>
                            )}
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                          </div>
                        </button>

                        {/* Card body */}
                        {isExpanded && (
                          <div className="p-5 space-y-5 border-t border-gray-100">
                            {/* Identity */}
                            <div>
                              <p className="text-sm font-semibold text-[#1E3A8A] mb-3">Identité</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Nom</label>
                                  <input type="text" value={be.nom || ""} onChange={(e) => updateBeneficiaire(idx, "nom", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" placeholder="Nom" />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Prénom</label>
                                  <input type="text" value={be.prenom || ""} onChange={(e) => updateBeneficiaire(idx, "prenom", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" placeholder="Prénom" />
                                </div>
                              </div>
                            </div>

                            {/* Birth */}
                            <div>
                              <p className="text-sm font-semibold text-[#1E3A8A] mb-3">Naissance</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Date de naissance</label>
                                  <input type="date" value={be.date_naissance || ""} onChange={(e) => updateBeneficiaire(idx, "date_naissance", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Lieu de naissance</label>
                                  <input type="text" value={be.lieu_naissance || ""} onChange={(e) => updateBeneficiaire(idx, "lieu_naissance", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" placeholder="Ville de naissance" />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Code postal de naissance</label>
                                  <input type="text" value={be.code_postal_naissance || ""} onChange={(e) => updateBeneficiaire(idx, "code_postal_naissance", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" placeholder="Code postal" />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Pays de naissance</label>
                                  <input type="text" value={be.pays_naissance || "France"} onChange={(e) => updateBeneficiaire(idx, "pays_naissance", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" placeholder="France" />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Nationalité</label>
                                  <input type="text" value={be.nationalite || "Française"} onChange={(e) => updateBeneficiaire(idx, "nationalite", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" placeholder="Française" />
                                </div>
                              </div>
                            </div>

                            {/* Address */}
                            <div>
                              <p className="text-sm font-semibold text-[#1E3A8A] mb-3">Adresse de résidence</p>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Adresse</label>
                                  <AddressAutocomplete value={be.adresse || ""} onChange={(v) => updateBeneficiaire(idx, "adresse", v)} placeholder="Adresse complète" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Code postal</label>
                                    <input type="text" value={be.code_postal || ""} onChange={(e) => updateBeneficiaire(idx, "code_postal", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" placeholder="Code postal" />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Ville</label>
                                    <input type="text" value={be.ville || ""} onChange={(e) => updateBeneficiaire(idx, "ville", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" placeholder="Ville" />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Pays de résidence</label>
                                    <input type="text" value={be.pays_residence || "France"} onChange={(e) => updateBeneficiaire(idx, "pays_residence", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" placeholder="France" />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Nature du contrôle */}
                            <div>
                              <p className="text-sm font-semibold text-[#1E3A8A] mb-3">Nature du contrôle</p>
                              <div className="space-y-2">
                                {NATURE_OPTIONS.map((opt) => (
                                  <label key={opt.key} className="flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" checked={(be.nature_controle || []).includes(opt.key)} onChange={() => toggleNatureControle(idx, opt.key)} className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" />
                                    <span className="text-base text-gray-700">{opt.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Modalités du contrôle */}
                            <div>
                              <p className="text-sm font-semibold text-[#1E3A8A] mb-3">Modalités du contrôle</p>
                              <div className="space-y-2">
                                {MODALITE_OPTIONS.map((opt) => (
                                  <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
                                    <input type="radio" name={`modalite_${idx}`} checked={be.modalite_controle === opt.key} onChange={() => updateBeneficiaire(idx, "modalite_controle", opt.key)} className="h-4 w-4 border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" />
                                    <span className="text-base text-gray-700">{opt.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Pourcentages */}
                            <div>
                              <p className="text-sm font-semibold text-[#1E3A8A] mb-3">Pourcentages détenus</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">% du capital social</label>
                                  <div className="relative">
                                    <input type="number" min="0" max="100" value={be.pct_capital || ""} onChange={(e) => updateBeneficiaire(idx, "pct_capital", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all pr-10" placeholder="100" />
                                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">% des droits de vote</label>
                                  <div className="relative">
                                    <input type="number" min="0" max="100" value={be.pct_votes || ""} onChange={(e) => updateBeneficiaire(idx, "pct_votes", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all pr-10" placeholder="100" />
                                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                      );
                    })}

                    {/* Add another beneficial owner */}
                    <button
                      type="button"
                      onClick={addBeneficiaire}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#2563EB] hover:bg-blue-50 text-gray-500 hover:text-[#2563EB] transition-all text-base font-medium"
                    >
                      <Plus className="w-5 h-5" />
                      Ajouter un bénéficiaire effectif
                    </button>
                  </div>
                  );
                })()}

                {/* ── Mandat du Président ── */}
                {POST_PAGES[postPage]?.id === "mandat_president" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>

                    <AccordionItem title="Plus d'informations">
                      <div className="text-base text-gray-600 space-y-2">
                        <p>Même si la SASU n&apos;a qu&apos;un associé, il est utile de prévoir ces règles pour une éventuelle transformation en SAS.</p>
                      </div>
                    </AccordionItem>

                    {/* ── Majorité nomination/révocation ── */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-base font-bold text-[#1E3A8A]">Pour les prochaines désignations de Président (en cas de changement), quelle majorité souhaitez-vous prévoir dans les statuts pour sa nomination et sa révocation ?</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button onClick={() => setAnswer("majorite_president", "simple")} className={cn("text-left px-5 py-4 rounded-xl border-2 transition-all", answers.majorite_president === "simple" ? "border-[#2563EB] bg-[#EFF6FF]" : "border-gray-200 bg-white hover:border-[#2563EB]/50")}>
                          <p className="text-sm font-semibold text-[#2563EB]">Majorité simple</p>
                          <p className="text-xs text-gray-500 mt-1">décision adoptée à la majorité des voix des associés (≥ 50 % des parts sociales).</p>
                        </button>
                        <button onClick={() => setAnswer("majorite_president", "renforcee")} className={cn("text-left px-5 py-4 rounded-xl border-2 transition-all", answers.majorite_president === "renforcee" ? "border-[#2563EB] bg-[#EFF6FF]" : "border-gray-200 bg-white hover:border-[#2563EB]/50")}>
                          <p className="text-sm font-semibold text-[#2563EB]">Majorité renforcée</p>
                          <p className="text-xs text-gray-500 mt-1">décision adoptée à une majorité plus élevée (à préciser ci-dessous).</p>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button onClick={() => setAnswer("majorite_president", "unanimite")} className={cn("text-left px-5 py-4 rounded-xl border-2 transition-all", answers.majorite_president === "unanimite" ? "border-[#2563EB] bg-[#EFF6FF]" : "border-gray-200 bg-white hover:border-[#2563EB]/50")}>
                          <p className="text-sm font-semibold text-[#2563EB]">Unanimité</p>
                          <p className="text-xs text-gray-500 mt-1">décision adoptée uniquement si 100 % des associés votent en faveur.</p>
                        </button>
                      </div>
                      {answers.majorite_president === "renforcee" && (
                        <div className="mt-2">
                          <label className="block text-base font-bold text-[#1E3A8A] mb-1">Pourcentage de majorité renforcée (%)</label>
                          <input type="number" min="51" max="99" value={answers.majorite_president_pct || "66"} onChange={(e) => setAnswer("majorite_president_pct", e.target.value)} placeholder="66" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                        </div>
                      )}
                    </div>

                    <hr className="border-gray-200" />

                    {/* ── Révocation ── */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-base font-bold text-[#1E3A8A]">Révocation du mandat du Président</p>
                        <p className="text-xs text-gray-500 italic">Dans quelles conditions l&apos;associé unique peut-il mettre fin au mandat ? La révocation ne doit néanmoins pas être abusive.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button onClick={() => setAnswer("revocation_president", "libre")} className={cn("text-left px-5 py-4 rounded-xl border-2 transition-all", answers.revocation_president === "libre" ? "border-[#2563EB] bg-[#EFF6FF]" : "border-gray-200 bg-white hover:border-[#2563EB]/50")}>
                          <span className="text-sm font-semibold text-[#2563EB]">Libre (sans motif)</span>
                        </button>
                        <button onClick={() => setAnswer("revocation_president", "juste_motif")} className={cn("text-left px-5 py-4 rounded-xl border-2 transition-all", answers.revocation_president === "juste_motif" ? "border-[#2563EB] bg-[#EFF6FF]" : "border-gray-200 bg-white hover:border-[#2563EB]/50")}>
                          <span className="text-sm font-semibold text-[#2563EB]">Pour juste motif uniquement</span>
                        </button>
                      </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* ── Durée du mandat ── */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-base font-bold text-[#1E3A8A]">Durée du mandat du Président</p>
                        <p className="text-xs text-gray-500">Combien de temps le président exercera ses fonctions ?</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button onClick={() => setAnswer("duree_mandat", "indeterminee")} className={cn("text-left px-5 py-4 rounded-xl border-2 transition-all", answers.duree_mandat === "indeterminee" ? "border-[#2563EB] bg-[#EFF6FF]" : "border-gray-200 bg-white hover:border-[#2563EB]/50")}>
                          <span className="text-sm font-semibold text-[#2563EB]">Durée indéterminée (choix le plus courant)</span>
                        </button>
                        <button onClick={() => setAnswer("duree_mandat", "determinee")} className={cn("text-left px-5 py-4 rounded-xl border-2 transition-all", answers.duree_mandat === "determinee" ? "border-[#2563EB] bg-[#EFF6FF]" : "border-gray-200 bg-white hover:border-[#2563EB]/50")}>
                          <span className="text-sm font-semibold text-[#2563EB]">Durée déterminée</span>
                        </button>
                      </div>
                      {answers.duree_mandat === "determinee" && (
                        <div className="mt-2">
                          <label className="block text-base font-bold text-[#1E3A8A] mb-1">Durée du mandat (en années)</label>
                          <input type="number" min="1" max="99" value={answers.duree_mandat_annees || ""} onChange={(e) => setAnswer("duree_mandat_annees", e.target.value)} placeholder="Ex : 3" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                        </div>
                      )}
                    </div>

                    <hr className="border-gray-200" />

                    {/* ── Renouvellement ── */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-base font-bold text-[#1E3A8A]">Renouvellement du mandat du Président</p>
                        <p className="text-xs text-gray-500">À la fin du mandat, peut-il être reconduit ?</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button onClick={() => setAnswer("renouvellement_mandat", "renouvelable")} className={cn("text-left px-5 py-4 rounded-xl border-2 transition-all", answers.renouvellement_mandat === "renouvelable" ? "border-[#2563EB] bg-[#EFF6FF]" : "border-gray-200 bg-white hover:border-[#2563EB]/50")}>
                          <span className="text-sm font-semibold text-[#2563EB]">Renouvelable</span>
                        </button>
                        <button onClick={() => setAnswer("renouvellement_mandat", "non_renouvelable")} className={cn("text-left px-5 py-4 rounded-xl border-2 transition-all", answers.renouvellement_mandat === "non_renouvelable" ? "border-[#2563EB] bg-[#EFF6FF]" : "border-gray-200 bg-white hover:border-[#2563EB]/50")}>
                          <span className="text-sm font-semibold text-[#2563EB]">Non renouvelable</span>
                        </button>
                      </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* ── Rémunération ── */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-base font-bold text-[#1E3A8A]">Souhaitez-vous que le Président soit rémunéré pour ses fonctions ?</p>
                        <p className="text-xs text-gray-500 italic">(Le montant de la rémunération ne doit néanmoins pas être précisé dans les statuts.)</p>
                      </div>
                      <button onClick={() => setAnswer("president_remunere", "non")} className={cn("w-full text-left px-5 py-4 rounded-xl border-2 transition-all", answers.president_remunere === "non" ? "border-[#2563EB] bg-[#EFF6FF]" : "border-gray-200 bg-white hover:border-[#2563EB]/50")}>
                        <p className="text-sm font-semibold text-[#2563EB]">Non</p>
                        <p className="text-xs text-gray-500">Le Président n&apos;est pas rémunéré.</p>
                      </button>
                      <button onClick={() => setAnswer("president_remunere", "oui_ulterieur")} className={cn("w-full text-left px-5 py-4 rounded-xl border-2 transition-all", answers.president_remunere === "oui_ulterieur" ? "border-[#2563EB] bg-[#EFF6FF]" : "border-gray-200 bg-white hover:border-[#2563EB]/50")}>
                        <p className="text-sm font-semibold text-[#2563EB]">Oui, mais à décider ultérieurement par l&apos;associé unique</p>
                        <p className="text-xs text-gray-500">Le Président pourra être rémunéré selon les conditions fixées par l&apos;associé unique</p>
                      </button>
                      <button onClick={() => setAnswer("president_remunere", "oui_office")} className={cn("w-full text-left px-5 py-4 rounded-xl border-2 transition-all", answers.president_remunere === "oui_office" ? "border-[#2563EB] bg-[#EFF6FF]" : "border-gray-200 bg-white hover:border-[#2563EB]/50")}>
                        <p className="text-sm font-semibold text-[#2563EB]">Oui, rémunération prévue d&apos;office</p>
                        <p className="text-xs text-gray-500">Le Président est rémunéré dans les conditions fixées par l&apos;associé unique</p>
                      </button>
                    </div>

                    <hr className="border-gray-200" />

                    {/* ── Limitation des pouvoirs ── */}
                    <div className="space-y-3">
                      <AccordionItem title="Plus d'informations">
                        <div className="text-base text-gray-600 space-y-2">
                          <p><strong className="text-[#2563EB]">Le saviez-vous ?</strong> Le Président engage toujours la SASU vis-à-vis des tiers. Les limites éventuellement prévues dans les statuts n&apos;ont qu&apos;un effet interne : elles servent uniquement à encadrer ses pouvoirs vis-à-vis de l&apos;associé unique. <em className="text-[#2563EB] font-semibold">En cas de dépassement, la société reste engagée, mais le Président peut être sanctionné en interne.</em></p>
                        </div>
                      </AccordionItem>

                      <div>
                        <p className="text-base font-bold text-[#1E3A8A]">Souhaitez-vous limiter certains pouvoirs du Président dans les statuts ?</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button onClick={() => setAnswer("limitation_pouvoirs", "oui")} className={cn("text-left px-5 py-4 rounded-xl border-2 transition-all", answers.limitation_pouvoirs === "oui" ? "border-[#2563EB] bg-[#EFF6FF]" : "border-gray-200 bg-white hover:border-[#2563EB]/50")}>
                          <span className="text-sm font-semibold text-[#2563EB]">Oui</span>
                        </button>
                        <button onClick={() => setAnswer("limitation_pouvoirs", "non")} className={cn("text-left px-5 py-4 rounded-xl border-2 transition-all", answers.limitation_pouvoirs === "non" ? "border-[#2563EB] bg-[#EFF6FF]" : "border-gray-200 bg-white hover:border-[#2563EB]/50")}>
                          <span className="text-sm font-semibold text-[#2563EB]">Non</span>
                        </button>
                      </div>

                      {answers.limitation_pouvoirs === "oui" && (
                        <div className="space-y-4 mt-3">
                          <div>
                            <p className="text-base font-bold text-[#1E3A8A]">Limitation des pouvoirs du Président</p>
                            <p className="text-sm text-gray-600 mt-1">Conformément à l&apos;article L.227-6 du Code de commerce, l&apos;associé unique décide que certaines décisions ne pourront pas être prises par le Président seul.</p>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>L&apos;accord préalable de l&apos;associé unique est requis pour les actes suivants :</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>l&apos;acquisition, la vente ou l&apos;apport de tout bien immobilier ;</li>
                              <li>la souscription de tout emprunt au nom de la société ;</li>
                              <li>la constitution de garanties ou sûretés réelles (hypothèques, nantissements, etc.) ;</li>
                              <li>et, plus généralement, tout engagement, contrat ou dépense excédant un montant de [_] euros HT.</li>
                            </ul>
                            <p className="mt-2">Tant que la société ne comporte qu&apos;un seul associé, celui-ci prend seul toutes les décisions, y compris celles nécessitant son accord préalable au titre de la présente clause.</p>
                          </div>
                          <div>
                            <p className="text-base font-bold text-[#1E3A8A] mb-1">Montant de limitation :</p>
                            <p className="text-sm text-gray-500 mb-2">100 000 euros maximum</p>
                            <input type="number" min="1" max="100000" value={answers.montant_limitation || ""} onChange={(e) => setAnswer("montant_limitation", e.target.value)} placeholder="Ex : 12000" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                          </div>
                        </div>
                      )}
                    </div>

                    <hr className="border-gray-200" />

                    {/* ── Majorité décisions futures (entrée associés) ── */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-base font-bold text-[#1E3A8A]">En cas d&apos;évolution de la société (entrée de nouveaux associés), ces décisions seront soumises à l&apos;approbation des associés, quelle majorité souhaitez-vous prévoir ?</p>
                        <p className="text-xs text-gray-500 italic">L&apos;associé unique reste seul décisionnaire à ce stade.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button onClick={() => setAnswer("majorite_decisions", "simple")} className={cn("text-left px-5 py-4 rounded-xl border-2 transition-all", answers.majorite_decisions === "simple" ? "border-[#2563EB] bg-[#EFF6FF]" : "border-gray-200 bg-white hover:border-[#2563EB]/50")}>
                          <span className="text-sm font-semibold text-[#2563EB]">Majorité simple (≥ 50 % des actions)</span>
                        </button>
                        <button onClick={() => setAnswer("majorite_decisions", "renforcee")} className={cn("text-left px-5 py-4 rounded-xl border-2 transition-all", answers.majorite_decisions === "renforcee" ? "border-[#2563EB] bg-[#EFF6FF]" : "border-gray-200 bg-white hover:border-[#2563EB]/50")}>
                          <span className="text-sm font-semibold text-[#2563EB]">Majorité renforcée</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button onClick={() => setAnswer("majorite_decisions", "unanimite")} className={cn("text-left px-5 py-4 rounded-xl border-2 transition-all", answers.majorite_decisions === "unanimite" ? "border-[#2563EB] bg-[#EFF6FF]" : "border-gray-200 bg-white hover:border-[#2563EB]/50")}>
                          <span className="text-sm font-semibold text-[#2563EB]">Unanimité des associés</span>
                        </button>
                      </div>
                      {answers.majorite_decisions === "renforcee" && (
                        <div className="mt-2">
                          <label className="block text-base font-bold text-[#1E3A8A] mb-1">Pourcentage de majorité renforcée (%)</label>
                          <input type="number" min="51" max="99" value={answers.majorite_decisions_pct || "66"} onChange={(e) => setAnswer("majorite_decisions_pct", e.target.value)} placeholder="66" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Dépôt du capital ── */}
                {POST_PAGES[postPage]?.id === "depot_capital" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                      <p className="text-gray-500 text-sm">Dépôt du capital</p>
                    </div>

                    {/* Message formule par défaut */}
                    {answers.formule_capital !== "personnalisee" && (
                      <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-1">
                        <p className="text-sm text-green-800 font-semibold">Formule simplifiée</p>
                        <p className="text-sm text-green-700">Votre capital est constitué uniquement d&apos;apports en numéraire (argent), intégralement libéré (100 % déposé).</p>
                      </div>
                    )}

                    <div className="space-y-5">
                      <div>
                        <label className="block text-base font-bold text-[#1E3A8A] mb-1">
                          Dans quel établissement bancaire avez-vous déposé le capital ?
                        </label>
                        <input
                          type="text"
                          value={answers.banque_depot || ""}
                          onChange={(e) => setAnswer("banque_depot", e.target.value)}
                          placeholder="Nom de la banque / néobanque"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-base font-bold text-[#1E3A8A] mb-1">
                          Adresse de l&apos;établissement bancaire
                        </label>
                        <input
                          type="text"
                          value={answers.banque_adresse || ""}
                          onChange={(e) => setAnswer("banque_adresse", e.target.value)}
                          placeholder="Adresse de la banque"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-base font-bold text-[#1E3A8A] mb-1">
                          À quelle date le dépôt a-t-il été effectué ?
                        </label>
                        <input
                          type="date"
                          value={answers.date_depot || ""}
                          onChange={(e) => setAnswer("date_depot", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                        />
                      </div>

                      {/* État du versement — formule personnalisée uniquement */}
                      {answers.formule_capital === "personnalisee" && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-base font-bold text-[#1E3A8A] mb-1">
                              Quel est l&apos;état du versement de vos apports en numéraire (argent) ?
                            </label>
                            <p className="text-xs text-gray-500 italic mb-3">
                              Si un versement a déjà eu lieu, le justificatif devra être déposé dans la partie &quot;Justificatifs&quot;.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button
                              onClick={() => setAnswer("etat_versement", "100")}
                              className={cn(
                                "text-left px-5 py-4 rounded-xl border-2 transition-all",
                                answers.etat_versement === "100"
                                  ? "border-[#2563EB] bg-[#EFF6FF]"
                                  : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                              )}
                            >
                              <span className="text-sm font-medium text-[#2563EB]">100 % deja versé  (attestation bancaire à fournir)</span>
                            </button>
                            <button
                              onClick={() => setAnswer("etat_versement", "partiel")}
                              className={cn(
                                "text-left px-5 py-4 rounded-xl border-2 transition-all",
                                answers.etat_versement === "partiel"
                                  ? "border-[#2563EB] bg-[#EFF6FF]"
                                  : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                              )}
                            >
                              <span className="text-sm font-medium text-[#2563EB]">Un versement partiel a été effectué (minimum légal : 50 %)</span>
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button
                              onClick={() => setAnswer("etat_versement", "aucun")}
                              className={cn(
                                "text-left px-5 py-4 rounded-xl border-2 transition-all",
                                answers.etat_versement === "aucun"
                                  ? "border-[#2563EB] bg-[#EFF6FF]"
                                  : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                              )}
                            >
                              <span className="text-sm font-medium text-[#2563EB]">Aucun versement n&apos;a ete effectué pour le moment</span>
                            </button>
                          </div>

                          {/* Si versement partiel : champ pourcentage */}
                          {answers.etat_versement === "partiel" && (
                            <div className="mt-3">
                              <label className="block text-base font-bold text-[#1E3A8A] mb-1">
                                Pourcentage versé (%)
                              </label>
                              <p className="text-sm text-gray-500 mb-2">Minimum légal : 50 % du montant des apports en numéraire</p>
                              <input
                                type="number"
                                min="50"
                                max="99"
                                value={answers.pourcentage_verse || "50"}
                                onChange={(e) => setAnswer("pourcentage_verse", e.target.value)}
                                placeholder="50"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                              />
                              {Number(answers.pourcentage_verse) < 50 && answers.pourcentage_verse && (
                                <p className="text-xs text-red-500 mt-1">Le minimum légal est de 50 % pour une SASU.</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Régime fiscal (adapté holdings) ── */}
                {POST_PAGES[postPage]?.id === "regime_fiscal" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                      <p className="text-gray-500 text-sm">Régime d&apos;imposition des bénéfices</p>
                    </div>

                    {/* Info holding : IS obligatoire */}
                    {(answers.type_structure === "holding_passive" || answers.type_structure === "holding_animatrice") && (
                      <div className="bg-blue-50 border border-[#2563EB]/20 rounded-xl p-4 flex items-start gap-3">
                        <Landmark className="w-5 h-5 text-[#2563EB] mt-0.5 flex-shrink-0" />
                        <div className="text-base text-[#1E3A8A] space-y-1">
                          <p><strong>Holding :</strong> l&apos;impôt sur les sociétés (IS) est le régime naturel et recommandé pour une holding.</p>
                          <p>Le régime mère-fille permet d&apos;exonérer <strong>95 %</strong> des dividendes reçus des filiales (5 % de quote-part de frais réintégrée).</p>
                          {answers.type_structure === "holding_animatrice" && (
                            <p>En tant que holding animatrice, vous pouvez aussi bénéficier de l&apos;intégration fiscale si vous détenez au moins 95 % d&apos;une filiale.</p>
                          )}
                        </div>
                      </div>
                    )}

                    <AccordionItem title="Le saviez-vous ?">
                      <div className="text-base text-gray-600 space-y-2">
                        <p>L&apos;<strong>IS</strong> est le régime par défaut de la SASU. Taux réduit de <strong>15 %</strong> sur les 42 500 premiers euros de bénéfice, puis <strong>25 %</strong>.</p>
                        <p>L&apos;<strong>IR</strong> est une option temporaire (5 ans max) : les bénéfices sont imposés directement au nom de l&apos;associé unique.</p>
                        {(answers.type_structure === "holding_passive" || answers.type_structure === "holding_animatrice") && (
                          <p><strong>Régime mère-fille :</strong> Si la holding détient au moins 5 % du capital d&apos;une filiale depuis plus de 2 ans, les dividendes reçus sont exonérés à 95 %.</p>
                        )}
                      </div>
                    </AccordionItem>

                    {/* Aide IA fiscalité */}
                    <button
                      onClick={() => {
                        const isHolding = answers.type_structure === "holding_passive" || answers.type_structure === "holding_animatrice";
                        const reco = isHolding
                          ? "Pour une holding, l'IS est fortement recommandé : vous bénéficiez du régime mère-fille (exonération de 95 % des dividendes reçus) et du taux réduit à 15 % sur les premiers 42 500 €. L'IR n'est pertinent que dans de rares cas de déficit reportable sur vos revenus personnels."
                          : "Pour la plupart des SASU, l'IS est le choix optimal : taux réduit de 15 % jusqu'à 42 500 € de bénéfice, puis 25 %. Vous maîtrisez votre rémunération et vos dividendes. L'IR peut être intéressant les premières années si vous prévoyez des pertes (reportables sur vos revenus) ou un résultat faible imposé dans les tranches basses du barème.";
                        setAnswer("aide_ia_fiscal", reco);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                      <Sparkles className="w-4 h-4" />
                      Aide IA : quelle option choisir ?
                    </button>
                    {answers.aide_ia_fiscal && (
                      <div className="bg-[#F5F3FF] border border-[#7C3AED]/30 rounded-xl p-4 text-base text-gray-700 text-justify leading-relaxed">
                        <p className="font-bold text-[#7C3AED] mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Recommandation IA</p>
                        <p>{answers.aide_ia_fiscal}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <button
                        onClick={() => setAnswer("regime_fiscal", "is")}
                        className={cn(
                          "w-full flex items-center gap-4 p-5 rounded-xl border-2 bg-white text-left transition-all group text-base",
                          answers.regime_fiscal === "is"
                            ? "border-[#2563EB] bg-blue-50"
                            : "border-gray-200 hover:border-[#2563EB] hover:bg-blue-50"
                        )}
                      >
                        <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 transition-colors">
                          <Landmark className="w-6 h-6 text-[#2563EB]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-[#1E3A8A]">Impôt sur les sociétés (IS) — recommandé</p>
                          <p className="text-sm text-gray-500 mt-0.5">15 % jusqu&apos;à 42 500 €, puis 25 %</p>
                        </div>
                        {answers.regime_fiscal === "is" && <Check className="w-5 h-5 text-[#2563EB] flex-shrink-0" />}
                      </button>

                      <button
                        onClick={() => setAnswer("regime_fiscal", "ir")}
                        className={cn(
                          "w-full flex items-center gap-4 p-5 rounded-xl border-2 bg-white text-left transition-all group text-base",
                          answers.regime_fiscal === "ir"
                            ? "border-[#2563EB] bg-blue-50"
                            : "border-gray-200 hover:border-[#2563EB] hover:bg-blue-50"
                        )}
                      >
                        <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 transition-colors">
                          <User className="w-6 h-6 text-[#2563EB]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-[#1E3A8A]">Impôt sur le revenu (IR) — option temporaire, 5 ans max</p>
                          <p className="text-sm text-gray-500 mt-0.5">Bénéfices imposés au barème progressif de l&apos;associé</p>
                        </div>
                        {answers.regime_fiscal === "ir" && <Check className="w-5 h-5 text-[#2563EB] flex-shrink-0" />}
                      </button>
                    </div>

                    {/* Options spécifiques IS + holding */}
                    {answers.regime_fiscal === "is" && (answers.type_structure === "holding_passive" || answers.type_structure === "holding_animatrice") && (
                      <div className="space-y-4 border-t border-gray-200 pt-4">
                        <p className="text-base font-bold text-[#1E3A8A]">Options fiscales holding</p>

                        <div>
                          <label className="block text-sm font-semibold text-[#1E3A8A] mb-2">Régime mère-fille</label>
                          <p className="text-sm text-gray-500 mb-2">Exonération de 95 % des dividendes reçus des filiales (détention ≥ 5 % depuis 2 ans)</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              onClick={() => setAnswer("regime_mere_fille", "oui")}
                              className={cn(
                                "p-3 rounded-xl border-2 text-base font-medium transition-all",
                                answers.regime_mere_fille === "oui" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                              )}
                            >
                              Oui, opter
                            </button>
                            <button
                              onClick={() => setAnswer("regime_mere_fille", "non")}
                              className={cn(
                                "p-3 rounded-xl border-2 text-base font-medium transition-all",
                                answers.regime_mere_fille === "non" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                              )}
                            >
                              Non
                            </button>
                          </div>
                        </div>

                        {answers.type_structure === "holding_animatrice" && (
                          <div>
                            <label className="block text-sm font-semibold text-[#1E3A8A] mb-2">Intégration fiscale</label>
                            <p className="text-sm text-gray-500 mb-2">Consolider les résultats des filiales détenues à 95 % ou plus</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <button
                                onClick={() => setAnswer("integration_fiscale", "oui")}
                                className={cn(
                                  "p-3 rounded-xl border-2 text-base font-medium transition-all",
                                  answers.integration_fiscale === "oui" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                )}
                              >
                                Oui, opter
                              </button>
                              <button
                                onClick={() => setAnswer("integration_fiscale", "non")}
                                className={cn(
                                  "p-3 rounded-xl border-2 text-base font-medium transition-all",
                                  answers.integration_fiscale === "non" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                )}
                              >
                                Non
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Warning IR + holding */}
                    {answers.regime_fiscal === "ir" && (answers.type_structure === "holding_passive" || answers.type_structure === "holding_animatrice") && (
                      <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">
                        <p className="text-base text-yellow-800">
                          <strong>Attention :</strong> L&apos;option IR pour une holding est rarement avantageuse. Les dividendes perçus des filiales seraient imposés au barème progressif sans bénéficier du régime mère-fille. L&apos;IS est fortement recommandé pour les holdings.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Page: Exercice comptable ── */}
                {POST_PAGES[postPage]?.id === "exercice_comptable" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                      <p className="text-gray-500 text-sm">Date de clôture de l&apos;exercice comptable</p>
                    </div>

                    <AccordionItem title="Plus d&apos;informations">
                      <div className="text-sm text-gray-600 space-y-4 text-justify">
                        <p className="font-bold text-[#1E3A8A]">Date de clôture de l&apos;exercice comptable, que choisir ?</p>

                        <div>
                          <p className="font-bold text-[#1E3A8A]">Clôture au 31 décembre (par défaut)</p>
                          <p>L&apos;exercice se termine avec l&apos;année civile. Simple, courant et pratique pour la gestion.</p>
                        </div>

                        <div>
                          <p className="font-bold text-[#1E3A8A]">Clôture spéciale la 1<sup>re</sup> année</p>
                          <p>Le premier exercice comptable peut durer au maximum 24 mois à compter de la date d&apos;immatriculation.</p>
                          <p><strong className="text-[#1E3A8A]">Exemple :</strong> Si votre société est créée le 15 avril 2025, vous pourrez fixer la fin de votre premier exercice jusqu&apos;au 15 avril 2027 au plus tard. Mais, vous pouvez aussi choisir une date fixe comme le 31 décembre 2026, pour être aligné sur l&apos;année civile.</p>
                        </div>

                        <div>
                          <p className="font-bold text-[#1E3A8A]">Autre date permanente</p>
                          <p>Vous pouvez fixer une autre date chaque année (ex. 30 septembre). Ce choix peut mieux correspondre à votre cycle d&apos;activité, mais demande un suivi régulier.</p>
                        </div>
                      </div>
                    </AccordionItem>

                    <div className="space-y-4">
                      <p className="text-base font-bold text-[#1E3A8A]">Date de clôture de l&apos;exercice comptable</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => { setAnswer("cloture_exercice", "31_dec"); setAnswer("cloture_1ere_annee_date", ""); setAnswer("cloture_suivantes_31dec", ""); setAnswer("cloture_date_permanente", ""); }}
                          className={cn(
                            "p-4 rounded-xl border-2 text-center text-base font-semibold transition-all",
                            answers.cloture_exercice === "31_dec" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                          )}
                        >
                          Clôture au 31 décembre chaque année (recommandé)
                        </button>
                        <button
                          onClick={() => { setAnswer("cloture_exercice", "differente_1ere"); setAnswer("cloture_date_permanente", ""); }}
                          className={cn(
                            "p-4 rounded-xl border-2 text-center text-base font-semibold transition-all",
                            answers.cloture_exercice === "differente_1ere" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                          )}
                        >
                          Je souhaite une clôture différente la 1re année
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => { setAnswer("cloture_exercice", "autre_permanente"); setAnswer("cloture_1ere_annee_date", ""); setAnswer("cloture_suivantes_31dec", ""); }}
                          className={cn(
                            "p-4 rounded-xl border-2 text-center text-base font-semibold transition-all",
                            answers.cloture_exercice === "autre_permanente" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                          )}
                        >
                          Je souhaite une autre date permanente
                        </button>
                      </div>

                      {/* Sous-options: clôture différente la 1re année */}
                      {answers.cloture_exercice === "differente_1ere" && (
                        <div className="space-y-5 mt-2">
                          <div>
                            <p className="text-base font-bold text-[#1E3A8A] mb-1">Quelle date souhaitez-vous fixer pour la clôture du premier exercice ?</p>
                            <p className="text-sm text-gray-500 mb-2">Le premier exercice comptable peut durer au maximum 24 mois à compter de la date d&apos;immatriculation.</p>
                            <input
                              type="date"
                              value={answers.cloture_1ere_annee_date || ""}
                              onChange={(e) => setAnswer("cloture_1ere_annee_date", e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                            />
                          </div>

                          <div className="space-y-3">
                            <p className="text-base font-bold text-[#1E3A8A]">Souhaitez-vous que les exercices suivants se clôturent au 31 décembre ?</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <button
                                onClick={() => setAnswer("cloture_suivantes_31dec", "oui")}
                                className={cn(
                                  "p-4 rounded-xl border-2 text-center text-base font-semibold transition-all",
                                  answers.cloture_suivantes_31dec === "oui" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                )}
                              >
                                Oui (recommandé)
                              </button>
                              <button
                                onClick={() => setAnswer("cloture_suivantes_31dec", "non")}
                                className={cn(
                                  "p-4 rounded-xl border-2 text-center text-base font-semibold transition-all",
                                  answers.cloture_suivantes_31dec === "non" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                                )}
                              >
                                Non, je fixerai une autre date permanente
                              </button>
                            </div>
                          </div>

                          {/* Si non, demander la date permanente */}
                          {answers.cloture_suivantes_31dec === "non" && (
                            <div>
                              <p className="text-base font-bold text-[#1E3A8A] mb-1">Quelle est la date de clôture souhaitée chaque année ?</p>
                              <select
                                value={answers.cloture_date_permanente || ""}
                                onChange={(e) => setAnswer("cloture_date_permanente", e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                              >
                                <option value="">Sélectionnez une date</option>
                                <option value="31_01">31 janvier</option>
                                <option value="28_02">28/29 février</option>
                                <option value="31_03">31 mars</option>
                                <option value="30_04">30 avril</option>
                                <option value="31_05">31 mai</option>
                                <option value="30_06">30 juin</option>
                                <option value="31_07">31 juillet</option>
                                <option value="31_08">31 août</option>
                                <option value="30_09">30 septembre</option>
                                <option value="31_10">31 octobre</option>
                                <option value="30_11">30 novembre</option>
                              </select>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Sous-options: autre date permanente */}
                      {answers.cloture_exercice === "autre_permanente" && (
                        <div className="mt-2">
                          <p className="text-base font-bold text-[#1E3A8A] mb-1">Quelle est la date de clôture souhaitée chaque année ?</p>
                          <select
                            value={answers.cloture_date_permanente || ""}
                            onChange={(e) => setAnswer("cloture_date_permanente", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                          >
                            <option value="">Sélectionnez une date</option>
                            <option value="31_01">31 janvier</option>
                            <option value="28_02">28/29 février</option>
                            <option value="31_03">31 mars</option>
                            <option value="30_04">30 avril</option>
                            <option value="31_05">31 mai</option>
                            <option value="30_06">30 juin</option>
                            <option value="31_07">31 juillet</option>
                            <option value="31_08">31 août</option>
                            <option value="30_09">30 septembre</option>
                            <option value="31_10">31 octobre</option>
                            <option value="30_11">30 novembre</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Page: Services comptables ── */}
                {POST_PAGES[postPage]?.id === "services_comptables" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                      <p className="text-gray-500 text-sm">Services comptables</p>
                    </div>

                    <AccordionItem title="Plus d&apos;informations">
                      <div className="text-sm text-gray-600 space-y-3 text-justify">
                        <p>Même sans commissaire aux comptes, vous devez tenir une comptabilité rigoureuse. Un expert-comptable ou un logiciel de comptabilité peut vous accompagner dans la gestion de vos obligations (déclarations fiscales, bilan annuel, TVA, etc.).</p>
                      </div>
                    </AccordionItem>

                    <div className="rounded-xl border border-[#D1D5DB] bg-[#F8FAFF] p-4">
                      <p className="text-sm text-gray-600">Dans la formule par défaut, vous avez indiqué ne pas vouloir nommer de commissaire aux comptes.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-base font-bold text-[#1E3A8A]">Souhaitez-vous néanmoins bénéficier de services comptables ?</p>
                        <p className="text-sm text-gray-500 mb-3">Dans la formule par défaut, vous avez indiqué ne pas vouloir nommer de commissaire aux comptes.</p>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={() => setAnswer("services_comptables", "logiciel")}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 text-left text-base font-semibold transition-all",
                            answers.services_comptables === "logiciel" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                          )}
                        >
                          Oui, je suis intéressé(e) par un logiciel de comptabilité en ligne.
                        </button>
                        <button
                          onClick={() => setAnswer("services_comptables", "expert_comptable")}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 text-left text-base font-semibold transition-all",
                            answers.services_comptables === "expert_comptable" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                          )}
                        >
                          Oui, je souhaite être mis(e) en relation avec un expert-comptable dans mon secteur.
                        </button>
                        <button
                          onClick={() => setAnswer("services_comptables", "non")}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 text-left text-base font-semibold transition-all",
                            answers.services_comptables === "non" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                          )}
                        >
                          Non merci
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Page: Régime de TVA ── */}
                {POST_PAGES[postPage]?.id === "regime_tva" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                      <p className="text-gray-500 text-sm">Régime de TVA</p>
                    </div>

                    {/* Info spécifique holding */}
                    {(answers.type_structure === "holding_passive" || answers.type_structure === "holding_animatrice") && (
                      <div className="bg-blue-50 border border-[#2563EB]/20 rounded-xl p-4 flex items-start gap-3">
                        <Landmark className="w-5 h-5 text-[#2563EB] mt-0.5 flex-shrink-0" />
                        <div className="text-base text-[#1E3A8A] space-y-1">
                          {answers.type_structure === "holding_passive" && (
                            <>
                              <p><strong>Holding passive :</strong> Les dividendes et plus-values de cession de titres sont <strong>hors champ TVA</strong>.</p>
                              <p>Si la holding n&apos;a aucune prestation de services imposable, elle n&apos;est pas assujettie à la TVA et ne peut pas récupérer la TVA sur ses achats.</p>
                            </>
                          )}
                          {answers.type_structure === "holding_animatrice" && (
                            <>
                              <p><strong>Holding animatrice :</strong> La facturation de management fees aux filiales est soumise à la TVA.</p>
                              <p>Vous pouvez récupérer la TVA sur vos achats (conseils juridiques, comptabilité, etc.) au prorata de votre activité taxable.</p>
                              <p>Un <strong>coefficient de déduction</strong> (prorata) doit être calculé entre activités taxables (management fees) et non taxables (dividendes).</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <AccordionItem title="Le saviez-vous ?">
                      <div className="text-base text-gray-600 space-y-2">
                        <p><strong>Franchise en base :</strong> Pas de TVA facturée ni récupérée. Plafonds : 91 900 € (ventes) / 36 800 € (services).</p>
                        <p><strong>Réel simplifié :</strong> Déclaration annuelle (CA12) + 2 acomptes semestriels. Pour les CA ≤ 840 000 € (ventes) ou 254 000 € (services).</p>
                        <p><strong>Réel normal :</strong> Déclaration mensuelle (CA3). Obligatoire au-delà des seuils du simplifié ou sur option.</p>
                        <p><strong>Mini-réel :</strong> IS au réel simplifié + TVA au réel normal. Permet de récupérer la TVA mensuellement.</p>
                      </div>
                    </AccordionItem>

                    {/* Aide IA TVA */}
                    <button
                      onClick={() => {
                        const isHoldingPassive = answers.type_structure === "holding_passive";
                        const isHoldingAnim = answers.type_structure === "holding_animatrice";
                        const hasFees = answers.management_fees === "oui";
                        let reco = "";
                        if (isHoldingPassive) {
                          reco = "Pour une holding passive, vous n'êtes généralement pas assujetti à la TVA car vos revenus (dividendes, plus-values) sont hors champ. Choisissez « Non assujetti ». Si vous facturez ponctuellement des prestations, optez pour la franchise en base.";
                        } else if (isHoldingAnim && hasFees) {
                          reco = "Votre holding animatrice facture des management fees : vous êtes assujetti à la TVA. Le réel simplifié est adapté si votre CA est inférieur aux seuils (254 000 € services). Si vous avez beaucoup de TVA à récupérer rapidement, le réel normal ou mini-réel permet des déclarations mensuelles.";
                        } else {
                          reco = "Pour une SASU classique en démarrage, la franchise en base est souvent le meilleur choix : pas de TVA à facturer ni déclarer, tant que votre CA reste sous les seuils (91 900 € ventes / 36 800 € services). Si vous avez des investissements importants à faire au démarrage (matériel, locaux), le réel simplifié vous permet de récupérer la TVA sur ces achats.";
                        }
                        setAnswer("aide_ia_tva", reco);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                      <Sparkles className="w-4 h-4" />
                      Aide IA : quel régime de TVA choisir ?
                    </button>
                    {answers.aide_ia_tva && (
                      <div className="bg-[#F5F3FF] border border-[#7C3AED]/30 rounded-xl p-4 text-base text-gray-700 text-justify leading-relaxed">
                        <p className="font-bold text-[#7C3AED] mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Recommandation IA</p>
                        <p>{answers.aide_ia_tva}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      {/* Franchise en base — pas pour les holdings animatrices avec management fees */}
                      {!(answers.type_structure === "holding_animatrice" && answers.management_fees === "oui") && (
                        <button
                          onClick={() => setAnswer("regime_tva", "franchise")}
                          className={cn(
                            "w-full flex items-center gap-4 p-5 rounded-xl border-2 bg-white text-left transition-all group text-base",
                            answers.regime_tva === "franchise"
                              ? "border-[#2563EB] bg-blue-50"
                              : "border-gray-200 hover:border-[#2563EB] hover:bg-blue-50"
                          )}
                        >
                          <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 transition-colors">
                            <Shield className="w-6 h-6 text-[#2563EB]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-[#1E3A8A]">Franchise en base de TVA</p>
                            <p className="text-sm text-gray-500 mt-0.5">Pas de TVA facturée ni récupérée — idéal pour les petites structures</p>
                          </div>
                          {answers.regime_tva === "franchise" && <Check className="w-5 h-5 text-[#2563EB] flex-shrink-0" />}
                        </button>
                      )}

                      <button
                        onClick={() => setAnswer("regime_tva", "reel_simplifie")}
                        className={cn(
                          "w-full flex items-center gap-4 p-5 rounded-xl border-2 bg-white text-left transition-all group text-base",
                          answers.regime_tva === "reel_simplifie"
                            ? "border-[#2563EB] bg-blue-50"
                            : "border-gray-200 hover:border-[#2563EB] hover:bg-blue-50"
                        )}
                      >
                        <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 transition-colors">
                          <CreditCard className="w-6 h-6 text-[#2563EB]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-[#1E3A8A]">Réel simplifié</p>
                          <p className="text-sm text-gray-500 mt-0.5">Déclaration annuelle + 2 acomptes — le plus courant</p>
                        </div>
                        {answers.regime_tva === "reel_simplifie" && <Check className="w-5 h-5 text-[#2563EB] flex-shrink-0" />}
                      </button>

                      <button
                        onClick={() => setAnswer("regime_tva", "reel_normal")}
                        className={cn(
                          "w-full flex items-center gap-4 p-5 rounded-xl border-2 bg-white text-left transition-all group text-base",
                          answers.regime_tva === "reel_normal"
                            ? "border-[#2563EB] bg-blue-50"
                            : "border-gray-200 hover:border-[#2563EB] hover:bg-blue-50"
                        )}
                      >
                        <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 transition-colors">
                          <Coins className="w-6 h-6 text-[#2563EB]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-[#1E3A8A]">Réel normal</p>
                          <p className="text-sm text-gray-500 mt-0.5">Déclaration mensuelle — récupération rapide de TVA</p>
                        </div>
                        {answers.regime_tva === "reel_normal" && <Check className="w-5 h-5 text-[#2563EB] flex-shrink-0" />}
                      </button>

                      {/* Mini-réel : option spéciale */}
                      <button
                        onClick={() => setAnswer("regime_tva", "mini_reel")}
                        className={cn(
                          "w-full flex items-center gap-4 p-5 rounded-xl border-2 bg-white text-left transition-all group text-base",
                          answers.regime_tva === "mini_reel"
                            ? "border-[#2563EB] bg-blue-50"
                            : "border-gray-200 hover:border-[#2563EB] hover:bg-blue-50"
                        )}
                      >
                        <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 transition-colors">
                          <Zap className="w-6 h-6 text-[#2563EB]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-[#1E3A8A]">Mini-réel</p>
                          <p className="text-sm text-gray-500 mt-0.5">IS simplifié + TVA mensuelle — bon compromis pour récupérer la TVA rapidement</p>
                        </div>
                        {answers.regime_tva === "mini_reel" && <Check className="w-5 h-5 text-[#2563EB] flex-shrink-0" />}
                      </button>
                    </div>

                    {/* Holding passive : option non assujetti */}
                    {answers.type_structure === "holding_passive" && (
                      <div className="border-t border-gray-200 pt-4">
                        <button
                          onClick={() => setAnswer("regime_tva", "non_assujetti")}
                          className={cn(
                            "w-full flex items-center gap-4 p-5 rounded-xl border-2 bg-white text-left transition-all group text-base",
                            answers.regime_tva === "non_assujetti"
                              ? "border-[#2563EB] bg-blue-50"
                              : "border-gray-200 hover:border-[#2563EB] hover:bg-blue-50"
                          )}
                        >
                          <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 transition-colors">
                            <X className="w-6 h-6 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-[#1E3A8A]">Non assujetti à la TVA</p>
                            <p className="text-sm text-gray-500 mt-0.5">Holding pure sans prestation de services — pas de TVA</p>
                          </div>
                          {answers.regime_tva === "non_assujetti" && <Check className="w-5 h-5 text-[#2563EB] flex-shrink-0" />}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Page 8: Adresse siège social ── */}
                {POST_PAGES[postPage]?.id === "adresse_siege" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                      <p className="text-gray-500 text-sm">Siège social</p>
                    </div>

                    {/* Step 1: Type de domiciliation */}
                    <div className="space-y-3">
                      <p className="text-base font-bold text-[#1E3A8A]">Où sera domicilié le siège social de votre SASU ?</p>

                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            setAnswer("type_domiciliation", "domicile_dirigeant");
                            // Pré-remplir avec l'adresse du dirigeant
                            const addr = answers.associe_adresse
                              || answers.president_adresse
                              || answers.president_rp_adresse
                              || "";
                            if (addr) setAnswer("adresse_siege", addr);
                          }}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3",
                            answers.type_domiciliation === "domicile_dirigeant" ? "border-[#2563EB] bg-blue-50" : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                          )}
                        >
                          <MapPin className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
                          <div className="flex-1">
                            <p className={cn("font-semibold text-base", answers.type_domiciliation === "domicile_dirigeant" ? "text-[#1E3A8A]" : "text-gray-700")}>Au domicile du dirigeant (président)</p>
                            <p className="text-sm text-gray-500 mt-0.5">Vous utilisez votre adresse personnelle comme siège social</p>
                          </div>
                          {answers.type_domiciliation === "domicile_dirigeant" && <Check className="w-5 h-5 text-[#2563EB] flex-shrink-0" />}
                        </button>

                        <button
                          onClick={() => setAnswer("type_domiciliation", "local_commercial_bail")}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3",
                            answers.type_domiciliation === "local_commercial_bail" ? "border-[#2563EB] bg-blue-50" : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                          )}
                        >
                          <Building2 className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
                          <div className="flex-1">
                            <p className={cn("font-semibold text-base", answers.type_domiciliation === "local_commercial_bail" ? "text-[#1E3A8A]" : "text-gray-700")}>Dans un local commercial (locataire)</p>
                            <p className="text-sm text-gray-500 mt-0.5">Vous disposez d&apos;un bail commercial ou professionnel</p>
                          </div>
                          {answers.type_domiciliation === "local_commercial_bail" && <Check className="w-5 h-5 text-[#2563EB] flex-shrink-0" />}
                        </button>

                        <button
                          onClick={() => setAnswer("type_domiciliation", "local_commercial_proprio")}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3",
                            answers.type_domiciliation === "local_commercial_proprio" ? "border-[#2563EB] bg-blue-50" : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                          )}
                        >
                          <Building2 className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
                          <div className="flex-1">
                            <p className={cn("font-semibold text-base", answers.type_domiciliation === "local_commercial_proprio" ? "text-[#1E3A8A]" : "text-gray-700")}>Dans un local commercial (propriétaire)</p>
                            <p className="text-sm text-gray-500 mt-0.5">Vous êtes propriétaire du local</p>
                          </div>
                          {answers.type_domiciliation === "local_commercial_proprio" && <Check className="w-5 h-5 text-[#2563EB] flex-shrink-0" />}
                        </button>

                        <button
                          onClick={() => setAnswer("type_domiciliation", "societe_domiciliation")}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3",
                            answers.type_domiciliation === "societe_domiciliation" ? "border-[#2563EB] bg-blue-50" : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                          )}
                        >
                          <Landmark className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
                          <div className="flex-1">
                            <p className={cn("font-semibold text-base", answers.type_domiciliation === "societe_domiciliation" ? "text-[#1E3A8A]" : "text-gray-700")}>Auprès d&apos;une société de domiciliation</p>
                            <p className="text-sm text-gray-500 mt-0.5">Entreprise spécialisée (ex : SeDomicilier, LegalPlace...)</p>
                          </div>
                          {answers.type_domiciliation === "societe_domiciliation" && <Check className="w-5 h-5 text-[#2563EB] flex-shrink-0" />}
                        </button>

                        <button
                          onClick={() => setAnswer("type_domiciliation", "pepiniere")}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3",
                            answers.type_domiciliation === "pepiniere" ? "border-[#2563EB] bg-blue-50" : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                          )}
                        >
                          <Users className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
                          <div className="flex-1">
                            <p className={cn("font-semibold text-base", answers.type_domiciliation === "pepiniere" ? "text-[#1E3A8A]" : "text-gray-700")}>Pépinière d&apos;entreprises / incubateur / coworking</p>
                            <p className="text-sm text-gray-500 mt-0.5">Espace partagé avec convention d&apos;hébergement</p>
                          </div>
                          {answers.type_domiciliation === "pepiniere" && <Check className="w-5 h-5 text-[#2563EB] flex-shrink-0" />}
                        </button>
                      </div>
                    </div>

                    {/* Step 2: Adresse */}
                    {answers.type_domiciliation && (
                      <div className="space-y-2">
                        <label className="block text-base font-bold text-[#1E3A8A]">Adresse du siège social</label>
                        <AddressAutocomplete
                          value={answers.adresse_siege || ""}
                          onChange={(v) => setAnswer("adresse_siege", v)}
                          placeholder={QUESTIONS[11].placeholder}
                          className="w-full px-5 py-4 rounded-xl border-2 border-[#2563EB] bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-base"
                        />
                      </div>
                    )}

                    {/* Step 3: Conditional fields based on type */}
                    {answers.type_domiciliation === "domicile_dirigeant" && (
                      <div className="border-l-2 border-[#2563EB]/30 pl-4 ml-2 space-y-4">
                        <div className="bg-blue-50 border border-[#2563EB]/20 rounded-xl p-4 flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-[#2563EB] mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-[#1E3A8A]">
                            La domiciliation au domicile du dirigeant est autorisée pour une durée de 5 ans maximum (sauf si le bail ou le règlement de copropriété l&apos;interdit). Passé ce délai, vous devrez transférer le siège social.
                          </p>
                        </div>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={answers.domicile_bail_autorise === "oui"}
                            onChange={(e) => setAnswer("domicile_bail_autorise", e.target.checked ? "oui" : "")}
                            className="mt-1 w-4 h-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
                          />
                          <span className="text-sm text-gray-700">Je confirme que mon bail ou règlement de copropriété n&apos;interdit pas l&apos;exercice d&apos;une activité professionnelle à cette adresse</span>
                        </label>
                      </div>
                    )}

                    {answers.type_domiciliation === "societe_domiciliation" && (
                      <div className="border-l-2 border-[#2563EB]/30 pl-4 ml-2 space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">Nom de la société de domiciliation</label>
                          <input
                            type="text"
                            value={answers.nom_domiciliataire || ""}
                            onChange={(e) => setAnswer("nom_domiciliataire", e.target.value)}
                            placeholder="Ex : SeDomicilier, LegalPlace..."
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-[#1E3A8A] mb-1">SIREN de la société de domiciliation</label>
                          <input
                            type="text"
                            value={answers.siren_domiciliataire || ""}
                            onChange={(e) => setAnswer("siren_domiciliataire", e.target.value)}
                            placeholder="Ex : 123 456 789"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                          />
                        </div>
                      </div>
                    )}

                    {/* Info accordion */}
                    <AccordionItem title="Plus d&apos;informations">
                      <div className="text-sm text-gray-600 space-y-3 text-justify">
                        <p>L&apos;INPI exige un <strong>justificatif de jouissance du local</strong> (bail, titre de propriété, contrat de domiciliation...) pour valider l&apos;adresse du siège social.</p>
                        <p>Au domicile du dirigeant : un <strong>justificatif de domicile de moins de 3 mois</strong> est obligatoire (facture EDF, eau, internet ou avis d&apos;imposition).</p>
                        <p>Le justificatif correspondant à votre situation vous sera demandé dans la page <strong>&quot;Pièces justificatives&quot;</strong>.</p>
                      </div>
                    </AccordionItem>
                  </div>
                )}

                {/* ── Page: Reprise des dépenses ── */}
                {POST_PAGES[postPage]?.id === "reprise_depenses" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                      <p className="text-gray-500 text-sm">Reprise des dépenses</p>
                    </div>

                    <AccordionItem title="Plus d&apos;informations">
                      <div className="text-sm text-gray-600 space-y-3 text-justify">
                        <p>Avant l&apos;immatriculation, vous pouvez avoir engagé des dépenses pour le compte de la société en formation (frais juridiques, achat de matériel, dépôt de marque, etc.).</p>
                        <p>Ces dépenses peuvent être <strong>reprises par la société</strong> une fois immatriculée, à condition qu&apos;elles soient listées dans un <strong>état des actes</strong> annexé aux statuts.</p>
                        <p>La société pourra alors les déduire fiscalement et rembourser le fondateur.</p>
                      </div>
                    </AccordionItem>

                    <div className="space-y-4">
                      <p className="text-base font-bold text-[#1E3A8A]">Avez-vous engagé des dépenses pour le compte de la société avant son immatriculation ?</p>
                      <p className="text-sm text-gray-500">Exemples : frais juridiques, achat de matériel, dépôt de marque, location de locaux, abonnements logiciels, etc.</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => setAnswer("reprise_depenses", "oui")}
                          className={cn(
                            "p-4 rounded-xl border-2 text-center text-base font-semibold transition-all",
                            answers.reprise_depenses === "oui" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                          )}
                        >
                          Oui
                          <span className="block text-sm font-normal text-gray-500 mt-1">Je souhaite que la société reprenne ces dépenses</span>
                        </button>
                        <button
                          onClick={() => { setAnswer("reprise_depenses", "non"); setAnswer("depenses_liste", ""); }}
                          className={cn(
                            "p-4 rounded-xl border-2 text-center text-base font-semibold transition-all",
                            answers.reprise_depenses === "non" ? "border-[#2563EB] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#2563EB]/50"
                          )}
                        >
                          Non
                          <span className="block text-sm font-normal text-gray-500 mt-1">Aucune dépense à reprendre</span>
                        </button>
                      </div>

                      {/* Liste des dépenses si oui */}
                      {answers.reprise_depenses === "oui" && (
                        <div className="space-y-4 mt-2">
                          <div>
                            <label className="block text-base font-bold text-[#1E3A8A] mb-1">
                              Listez les dépenses engagées
                            </label>
                            <p className="text-sm text-gray-500 mb-2">Indiquez la nature de chaque dépense et son montant. Ces informations seront reprises dans l&apos;état des actes annexé aux statuts.</p>
                            <textarea
                              value={answers.depenses_liste || ""}
                              onChange={(e) => setAnswer("depenses_liste", e.target.value)}
                              placeholder={"Ex :\n- Frais juridiques (création) : 500 €\n- Achat ordinateur : 1 200 €\n- Dépôt de marque INPI : 190 €"}
                              rows={6}
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all resize-none"
                            />
                          </div>

                          <div>
                            <label className="block text-base font-bold text-[#1E3A8A] mb-1">
                              Montant total des dépenses (€)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={answers.depenses_total || ""}
                              onChange={(e) => setAnswer("depenses_total", e.target.value)}
                              placeholder="Ex : 1890"
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-base text-gray-800 transition-all"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Page: Date et lieu de signature des statuts ── */}
                {POST_PAGES[postPage]?.id === "date_lieu" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                      <p className="text-gray-500 text-sm">Date et lieu de signature des statuts</p>
                    </div>

                    <AccordionItem title="Le saviez-vous ?">
                      <div className="text-base text-gray-600">
                        <p>
                          La <strong>date de signature des statuts</strong> marque officiellement la constitution de votre société.
                          Le <strong>lieu</strong> correspond généralement à l&apos;adresse du siège social, mais peut être différent
                          (par exemple le cabinet de votre avocat ou expert-comptable).
                        </p>
                      </div>
                    </AccordionItem>

                    {/* Date de signature */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-[#1E3A8A]">
                        <Calendar className="w-4 h-4" />
                        Date de signature des statuts
                      </label>
                      <input
                        type="date"
                        value={answers.date_signature || ""}
                        onChange={(e) => setAnswer("date_signature", e.target.value)}
                        className="w-full px-5 py-4 rounded-xl border-2 border-[#2563EB] bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-base"
                      />
                    </div>

                    {/* Lieu de signature */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-[#1E3A8A]">
                        <MapPin className="w-4 h-4" />
                        Lieu de signature des statuts
                      </label>
                      <div className="space-y-3">
                        <button
                          onClick={() => setAnswer("lieu_signature_type", "siege")}
                          className={cn(
                            "w-full flex items-center gap-4 p-5 rounded-xl border-2 bg-white text-left transition-all group text-base",
                            answers.lieu_signature_type === "siege"
                              ? "border-[#2563EB] bg-blue-50"
                              : "border-gray-200 hover:border-[#2563EB] hover:bg-blue-50"
                          )}
                        >
                          <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 transition-colors">
                            <Building2 className="w-6 h-6 text-[#2563EB]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-[#1E3A8A]">Au siège social</p>
                            <p className="text-sm text-gray-500 mt-0.5">{answers.adresse_siege || "Adresse du siège social"}</p>
                          </div>
                          {answers.lieu_signature_type === "siege" && (
                            <Check className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
                          )}
                        </button>
                        <button
                          onClick={() => setAnswer("lieu_signature_type", "autre")}
                          className={cn(
                            "w-full flex items-center gap-4 p-5 rounded-xl border-2 bg-white text-left transition-all group text-base",
                            answers.lieu_signature_type === "autre"
                              ? "border-[#2563EB] bg-blue-50"
                              : "border-gray-200 hover:border-[#2563EB] hover:bg-blue-50"
                          )}
                        >
                          <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 transition-colors">
                            <MapPin className="w-6 h-6 text-[#2563EB]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-[#1E3A8A]">Autre adresse</p>
                            <p className="text-sm text-gray-500 mt-0.5">Précisez une adresse différente</p>
                          </div>
                          {answers.lieu_signature_type === "autre" && (
                            <Check className="w-5 h-5 text-[#2563EB] flex-shrink-0" />
                          )}
                        </button>
                      </div>
                      {answers.lieu_signature_type === "autre" && (
                        <input
                          type="text"
                          value={answers.lieu_signature_autre || ""}
                          onChange={(e) => setAnswer("lieu_signature_autre", e.target.value)}
                          placeholder="Ex : 12 rue de la Paix, 75002 Paris"
                          className="w-full px-5 py-4 rounded-xl border-2 border-[#2563EB] bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-base mt-2"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* ── Page: Récapitulatif ── */}
                {POST_PAGES[postPage]?.id === "recapitulatif" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                      <p className="text-gray-500 text-sm">Récapitulatif de votre dossier</p>
                    </div>

                    <div className="bg-blue-50 border border-[#2563EB]/20 rounded-xl p-4 flex items-start gap-3">
                      <Eye className="w-5 h-5 text-[#2563EB] mt-0.5 flex-shrink-0" />
                      <p className="text-base text-[#1E3A8A]">
                        Vérifiez attentivement les informations ci-dessous avant de continuer. Vous pourrez revenir modifier chaque section en cliquant sur &quot;Modifier&quot;.
                      </p>
                    </div>

                    {/* Dénomination */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="font-semibold text-[#1E3A8A] text-sm">Dénomination</h3>
                        <button onClick={() => setPostPage(pageIndex("denomination"))} className="text-xs text-[#2563EB] hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" /> Modifier</button>
                      </div>
                      <div className="px-5 py-3 space-y-1 text-sm">
                        <p><span className="text-gray-500">Nom :</span> <span className="text-gray-800 font-medium">{answers.nom_societe || "—"}</span></p>
                        {answers.sigle && <p><span className="text-gray-500">Sigle :</span> <span className="text-gray-800 font-medium">{answers.sigle}</span></p>}
                        {answers.nom_commercial && <p><span className="text-gray-500">Nom commercial :</span> <span className="text-gray-800 font-medium">{answers.nom_commercial}</span></p>}
                        {answers.enseigne && <p><span className="text-gray-500">Enseigne :</span> <span className="text-gray-800 font-medium">{answers.enseigne}</span></p>}
                      </div>
                    </div>

                    {/* Type de structure */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="font-semibold text-[#1E3A8A] text-sm">Type de structure</h3>
                        <button onClick={() => setPostPage(pageIndex("type_structure"))} className="text-xs text-[#2563EB] hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" /> Modifier</button>
                      </div>
                      <div className="px-5 py-3 text-sm">
                        <p><span className="text-gray-500">Structure :</span> <span className="text-gray-800 font-medium">{answers.type_structure === "classique" ? "Société classique" : answers.type_structure === "holding_passive" ? "Holding passive" : answers.type_structure === "holding_animatrice" ? "Holding animatrice" : "—"}</span></p>
                      </div>
                    </div>

                    {/* Objet social */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="font-semibold text-[#1E3A8A] text-sm">Objet social</h3>
                        <button onClick={() => setPostPage(pageIndex("objet_social"))} className="text-xs text-[#2563EB] hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" /> Modifier</button>
                      </div>
                      <div className="px-5 py-3 text-sm">
                        <p className="text-gray-800">{answers.objet_social || "—"}</p>
                      </div>
                    </div>

                    {/* Associé unique */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="font-semibold text-[#1E3A8A] text-sm">Associé unique</h3>
                        <button onClick={() => setPostPage(pageIndex("associe_unique"))} className="text-xs text-[#2563EB] hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" /> Modifier</button>
                      </div>
                      <div className="px-5 py-3 space-y-1 text-sm">
                        <p><span className="text-gray-500">Type :</span> <span className="text-gray-800 font-medium">{answers.type_associe === "physique" ? "Personne physique" : answers.type_associe === "morale" ? "Personne morale" : "—"}</span></p>
                        {answers.type_associe === "physique" && (
                          <>
                            {answers.assoc_nom && <p><span className="text-gray-500">Nom :</span> <span className="text-gray-800 font-medium">{answers.assoc_prenom} {answers.assoc_nom}</span></p>}
                            {answers.associe_date_naissance && <p><span className="text-gray-500">Né(e) le :</span> <span className="text-gray-800 font-medium">{answers.associe_date_naissance}</span></p>}
                          </>
                        )}
                        {answers.type_associe === "morale" && (
                          <>
                            {answers.assoc_pm_denomination && <p><span className="text-gray-500">Dénomination :</span> <span className="text-gray-800 font-medium">{answers.assoc_pm_denomination}</span></p>}
                            {answers.assoc_pm_siren && <p><span className="text-gray-500">SIREN :</span> <span className="text-gray-800 font-medium">{answers.assoc_pm_siren}</span></p>}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Capital social */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="font-semibold text-[#1E3A8A] text-sm">Capital social</h3>
                        <button onClick={() => setPostPage(pageIndex("capital_social"))} className="text-xs text-[#2563EB] hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" /> Modifier</button>
                      </div>
                      <div className="px-5 py-3 space-y-1 text-sm">
                        <p><span className="text-gray-500">Type :</span> <span className="text-gray-800 font-medium">{answers.type_capital === "fixe" ? "Capital fixe" : answers.type_capital === "variable" ? "Capital variable" : "—"}</span></p>
                        <p><span className="text-gray-500">Montant :</span> <span className="text-gray-800 font-medium">{answers.capital_social ? `${answers.capital_social} €` : "—"}</span></p>
                      </div>
                    </div>

                    {/* Président */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="font-semibold text-[#1E3A8A] text-sm">Président</h3>
                        <button onClick={() => setPostPage(pageIndex("nomination_president"))} className="text-xs text-[#2563EB] hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" /> Modifier</button>
                      </div>
                      <div className="px-5 py-3 space-y-1 text-sm">
                        <p><span className="text-gray-500">Président :</span> <span className="text-gray-800 font-medium">
                          {answers.president_option === "associe"
                            ? `L'associé unique${answers.type_associe !== "morale" ? ` (${answers.associe_prenom || ""} ${answers.associe_nom || ""})`.trim() : ` (${answers.associe_societe_nom || ""})`}`
                            : answers.president_type === "physique"
                            ? `${answers.president_prenom || ""} ${answers.president_nom || ""} (personne physique)`
                            : answers.president_type === "morale"
                            ? `${answers.president_pm_nom || ""} (personne morale)`
                            : "—"}
                        </span></p>
                        {answers.mandat_duree_type && <p><span className="text-gray-500">Durée du mandat :</span> <span className="text-gray-800 font-medium">{answers.mandat_duree_type === "indeterminee" ? "Indéterminée" : `${answers.mandat_duree_annees || "—"} ans`}</span></p>}
                      </div>
                    </div>

                    {/* Dépôt du capital */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="font-semibold text-[#1E3A8A] text-sm">Dépôt du capital</h3>
                        <button onClick={() => setPostPage(pageIndex("depot_capital"))} className="text-xs text-[#2563EB] hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" /> Modifier</button>
                      </div>
                      <div className="px-5 py-3 space-y-1 text-sm">
                        <p><span className="text-gray-500">Établissement :</span> <span className="text-gray-800 font-medium">{answers.banque_nom || "—"}</span></p>
                        {answers.depot_date && <p><span className="text-gray-500">Date de dépôt :</span> <span className="text-gray-800 font-medium">{answers.depot_date}</span></p>}
                      </div>
                    </div>

                    {/* Régime fiscal */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="font-semibold text-[#1E3A8A] text-sm">Régime fiscal</h3>
                        <button onClick={() => setPostPage(pageIndex("regime_fiscal"))} className="text-xs text-[#2563EB] hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" /> Modifier</button>
                      </div>
                      <div className="px-5 py-3 text-sm space-y-1">
                        <p><span className="text-gray-500">Régime :</span> <span className="text-gray-800 font-medium">{answers.regime_fiscal === "is" ? "Impôt sur les sociétés (IS)" : answers.regime_fiscal === "ir" ? "Impôt sur le revenu (IR)" : "—"}</span></p>
                        {answers.regime_mere_fille === "oui" && <p><span className="text-gray-500">Mère-fille :</span> <span className="text-gray-800 font-medium">Oui</span></p>}
                        {answers.integration_fiscale === "oui" && <p><span className="text-gray-500">Intégration fiscale :</span> <span className="text-gray-800 font-medium">Oui</span></p>}
                      </div>
                    </div>

                    {/* Régime TVA */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="font-semibold text-[#1E3A8A] text-sm">Régime de TVA</h3>
                        <button onClick={() => setPostPage(pageIndex("regime_tva"))} className="text-xs text-[#2563EB] hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" /> Modifier</button>
                      </div>
                      <div className="px-5 py-3 text-sm">
                        <p><span className="text-gray-500">TVA :</span> <span className="text-gray-800 font-medium">
                          {answers.regime_tva === "franchise" ? "Franchise en base" : answers.regime_tva === "reel_simplifie" ? "Réel simplifié" : answers.regime_tva === "reel_normal" ? "Réel normal" : answers.regime_tva === "mini_reel" ? "Mini-réel" : answers.regime_tva === "non_assujetti" ? "Non assujetti" : "—"}
                        </span></p>
                      </div>
                    </div>

                    {/* Date et lieu */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="font-semibold text-[#1E3A8A] text-sm">Date et lieu de signature</h3>
                        <button onClick={() => setPostPage(pageIndex("date_lieu"))} className="text-xs text-[#2563EB] hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" /> Modifier</button>
                      </div>
                      <div className="px-5 py-3 space-y-1 text-sm">
                        <p><span className="text-gray-500">Date :</span> <span className="text-gray-800 font-medium">{answers.date_signature || "—"}</span></p>
                        <p><span className="text-gray-500">Lieu :</span> <span className="text-gray-800 font-medium">
                          {answers.lieu_signature_type === "siege" ? answers.adresse_siege || "Au siège social" : answers.lieu_signature_autre || "—"}
                        </span></p>
                      </div>
                    </div>

                    {/* Options souscrites */}
                    {(answers.fermeture_micro === "oui" || answers.activite_artisanale === "oui" || answers.proteger_nom === "oui") && (
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                          <h3 className="font-semibold text-[#1E3A8A] text-sm">Options souscrites</h3>
                        </div>
                        <div className="px-5 py-3 space-y-2 text-sm">
                          {answers.fermeture_micro === "oui" && (
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-gray-800">Fermeture micro-entreprise{answers.micro_siren ? ` (SIREN ${answers.micro_siren})` : ""}</span>
                            </div>
                          )}
                          {answers.activite_artisanale === "oui" && (
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-gray-800">Immatriculation CMA (activité artisanale)</span>
                            </div>
                          )}
                          {answers.proteger_nom === "oui" && (
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-gray-800">Protection de marque — {answers.brand_plan === "france" ? "France (INPI)" : answers.brand_plan === "eu" ? "Union européenne (EUIPO)" : answers.brand_plan === "international" ? "International (OMPI)" : "à définir"}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Exercice comptable */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="font-semibold text-[#1E3A8A] text-sm">Exercice comptable</h3>
                        <button onClick={() => setPostPage(pageIndex("exercice_comptable"))} className="text-xs text-[#2563EB] hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" /> Modifier</button>
                      </div>
                      <div className="px-5 py-3 text-sm">
                        <p><span className="text-gray-500">Clôture :</span> <span className="text-gray-800 font-medium">{answers.cloture_exercice === "31_dec" ? "31 décembre" : answers.cloture_date_permanente || "—"}</span></p>
                      </div>
                    </div>

                    {/* Siège social - type domiciliation */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="font-semibold text-[#1E3A8A] text-sm">Siège social</h3>
                        <button onClick={() => setPostPage(pageIndex("adresse_siege"))} className="text-xs text-[#2563EB] hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" /> Modifier</button>
                      </div>
                      <div className="px-5 py-3 space-y-1 text-sm">
                        <p><span className="text-gray-500">Adresse :</span> <span className="text-gray-800 font-medium">{answers.adresse_siege || "—"}</span></p>
                        <p><span className="text-gray-500">Type :</span> <span className="text-gray-800 font-medium">{
                          answers.type_domiciliation === "domicile_dirigeant" ? "Domicile du dirigeant" :
                          answers.type_domiciliation === "local_commercial_bail" ? "Local commercial (bail)" :
                          answers.type_domiciliation === "local_commercial_proprio" ? "Local commercial (propriétaire)" :
                          answers.type_domiciliation === "societe_domiciliation" ? `Société de domiciliation${answers.nom_domiciliataire ? ` (${answers.nom_domiciliataire})` : ""}` :
                          answers.type_domiciliation === "pepiniere" ? "Pépinière / incubateur / coworking" :
                          "—"
                        }</span></p>
                      </div>
                    </div>

                    {/* Statuts — Aperçu + Téléchargement */}
                    <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] rounded-xl p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-white" />
                        <div>
                          <p className="text-white font-bold text-base">Statuts de votre SASU</p>
                          <p className="text-blue-200 text-sm">Générés automatiquement à partir de vos réponses</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={async () => {
                            const { buildStatutsComplets } = await import("@/app/lib/statutsSasuBuilder");
                            const { generateStatutsSasuDocx } = await import("@/app/lib/generateDocx");
                            const text = buildStatutsComplets(answers);
                            const denomination = answers.nom_societe || answers.denomination_sociale || "SASU";
                            const blob = await generateStatutsSasuDocx(text, {
                              denomination,
                              capital: String(answers.capital_social || "1"),
                              siege: answers.adresse_siege || "[ADRESSE]",
                            });
                            const url = URL.createObjectURL(blob);
                            setAnswer("statuts_preview", text);
                            setAnswer("statuts_docx_url", url);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-[#1E3A8A] font-semibold text-sm hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Aperçu
                        </button>
                        <button
                          onClick={async () => {
                            const { buildStatutsComplets } = await import("@/app/lib/statutsSasuBuilder");
                            const { generateStatutsSasuDocx } = await import("@/app/lib/generateDocx");
                            const text = buildStatutsComplets(answers);
                            const denomination = answers.nom_societe || answers.denomination_sociale || "SASU";
                            const blob = await generateStatutsSasuDocx(text, {
                              denomination,
                              capital: String(answers.capital_social || "1"),
                              siege: answers.adresse_siege || "[ADRESSE]",
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `statuts-${denomination.toLowerCase().replace(/\s+/g, "-")}.docx`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/20 text-white font-semibold text-sm hover:bg-white/30 transition-colors border border-white/30"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger (.docx)
                        </button>
                      </div>
                    </div>

                    {/* Aperçu pleine page des statuts (style cession) */}
                    {answers.statuts_preview && answers.statuts_docx_url && (
                      <DocumentPreviewPanel
                        title={`Statuts constitutifs — ${answers.nom_societe || answers.denomination_sociale || "SASU"}`}
                        text={answers.statuts_preview}
                        docxBlobUrl={answers.statuts_docx_url}
                        docxFileName={`statuts-${(answers.nom_societe || "SASU").toLowerCase().replace(/\s+/g, "-")}.docx`}
                        pdfFileName={`statuts-${(answers.nom_societe || "SASU").toLowerCase().replace(/\s+/g, "-")}.pdf`}
                        onClose={() => { setAnswer("statuts_preview", ""); setAnswer("statuts_docx_url", ""); }}
                      />
                    )}
                  </div>
                )}

                {/* ── Page: Justificatifs ── */}
                {POST_PAGES[postPage]?.id === "justificatifs" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                      <p className="text-gray-500 text-sm">Pièces justificatives à fournir</p>
                    </div>

                    <div className="bg-blue-50 border border-[#2563EB]/20 rounded-xl p-4 flex items-start gap-3">
                      <FileUp className="w-5 h-5 text-[#2563EB] mt-0.5 flex-shrink-0" />
                      <p className="text-base text-[#1E3A8A]">
                        Veuillez fournir les documents ci-dessous pour constituer votre dossier. Les formats acceptés sont <strong>PDF, JPG, PNG</strong> (max 10 Mo par fichier).
                      </p>
                    </div>

                    {/* Pièce d'identité */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-[#2563EB]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-[#1E3A8A] text-sm">
                            Pièce d&apos;identité {answers.president_type === "morale" ? "du représentant permanent" : "du président"}
                          </p>
                          <p className="text-xs text-gray-500">Carte d&apos;identité ou passeport (recto-verso)</p>
                        </div>
                        {answers.justif_identite && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
                      </div>
                      <label className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#2563EB]/40 text-[#2563EB] text-sm font-medium cursor-pointer hover:bg-blue-50 transition-colors">
                        <Upload className="w-4 h-4" />
                        {answers.justif_identite ? "Remplacer le fichier" : "Importer le document"}
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setAnswer("justif_identite", e.target.files[0].name); }} />
                      </label>
                      {answers.justif_identite && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> {answers.justif_identite}</p>}
                    </div>

                    {/* Justificatif d'émancipation — si mineur émancipé */}
                    {answers.associe_emancipe === "oui" && (
                      <div className="bg-white border border-amber-300 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[#1E3A8A] text-sm">Justificatif d&apos;émancipation</p>
                            <p className="text-xs text-gray-500">Jugement du tribunal judiciaire prononçant l&apos;émancipation du mineur</p>
                          </div>
                          {answers.justif_emancipation && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
                        </div>
                        <label className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-amber-400 text-amber-700 text-sm font-medium cursor-pointer hover:bg-amber-50 transition-colors">
                          <Upload className="w-4 h-4" />
                          {answers.justif_emancipation ? "Remplacer le fichier" : "Importer le document"}
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setAnswer("justif_emancipation", e.target.files[0].name); }} />
                        </label>
                        {answers.justif_emancipation && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> {answers.justif_emancipation}</p>}
                      </div>
                    )}

                    {/* Justificatif d'émancipation président — si mineur émancipé */}
                    {answers.president_emancipe === "oui" && (
                      <div className="bg-white border border-amber-300 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[#1E3A8A] text-sm">Justificatif d&apos;émancipation du Président</p>
                            <p className="text-xs text-gray-500">Jugement du tribunal judiciaire prononçant l&apos;émancipation</p>
                          </div>
                          {answers.justif_emancipation_president && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
                        </div>
                        <label className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-amber-400 text-amber-700 text-sm font-medium cursor-pointer hover:bg-amber-50 transition-colors">
                          <Upload className="w-4 h-4" />
                          {answers.justif_emancipation_president ? "Remplacer le fichier" : "Importer le document"}
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setAnswer("justif_emancipation_president", e.target.files[0].name); }} />
                        </label>
                        {answers.justif_emancipation_president && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> {answers.justif_emancipation_president}</p>}
                      </div>
                    )}

                    {/* Justificatif d'émancipation DG — si mineur émancipé */}
                    {answers.dg_emancipe === "oui" && (
                      <div className="bg-white border border-amber-300 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[#1E3A8A] text-sm">Justificatif d&apos;émancipation du Directeur Général</p>
                            <p className="text-xs text-gray-500">Jugement du tribunal judiciaire prononçant l&apos;émancipation</p>
                          </div>
                          {answers.justif_emancipation_dg && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
                        </div>
                        <label className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-amber-400 text-amber-700 text-sm font-medium cursor-pointer hover:bg-amber-50 transition-colors">
                          <Upload className="w-4 h-4" />
                          {answers.justif_emancipation_dg ? "Remplacer le fichier" : "Importer le document"}
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setAnswer("justif_emancipation_dg", e.target.files[0].name); }} />
                        </label>
                        {answers.justif_emancipation_dg && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> {answers.justif_emancipation_dg}</p>}
                      </div>
                    )}

                    {/* Extrait Kbis de la société dirigeante — si président PM */}
                    {answers.president_type === "morale" && (
                      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-[#2563EB]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[#1E3A8A] text-sm">Extrait Kbis de la société dirigeante</p>
                            <p className="text-xs text-gray-500">Kbis de moins de 3 mois de {answers.president_pm_nom || "la société présidente"}</p>
                          </div>
                          {answers.justif_kbis_president && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
                        </div>
                        <label className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#2563EB]/40 text-[#2563EB] text-sm font-medium cursor-pointer hover:bg-blue-50 transition-colors">
                          <Upload className="w-4 h-4" />
                          {answers.justif_kbis_president ? "Remplacer le fichier" : "Importer le document"}
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setAnswer("justif_kbis_president", e.target.files[0].name); }} />
                        </label>
                        {answers.justif_kbis_president && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> {answers.justif_kbis_president}</p>}
                      </div>
                    )}

                    {/* Justificatifs siège social — conditionnels selon type_domiciliation */}

                    {/* Domicile du dirigeant */}
                    {answers.type_domiciliation === "domicile_dirigeant" && (
                      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-5 h-5 text-[#2563EB]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[#1E3A8A] text-sm">Justificatif de domicile du dirigeant</p>
                            <p className="text-xs text-gray-500">Facture EDF, eau, internet ou avis d&apos;imposition de moins de 3 mois</p>
                          </div>
                          {answers.justif_domicile && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
                        </div>
                        <label className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#2563EB]/40 text-[#2563EB] text-sm font-medium cursor-pointer hover:bg-blue-50 transition-colors">
                          <Upload className="w-4 h-4" />
                          {answers.justif_domicile ? "Remplacer le fichier" : "Importer le document"}
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setAnswer("justif_domicile", e.target.files[0].name); }} />
                        </label>
                        {answers.justif_domicile && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> {answers.justif_domicile}</p>}
                      </div>
                    )}

                    {/* Local commercial — bail */}
                    {answers.type_domiciliation === "local_commercial_bail" && (
                      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-[#2563EB]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[#1E3A8A] text-sm">Copie du bail commercial ou professionnel</p>
                            <p className="text-xs text-gray-500">Bail en cours de validité</p>
                          </div>
                          {answers.justif_bail && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
                        </div>
                        <label className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#2563EB]/40 text-[#2563EB] text-sm font-medium cursor-pointer hover:bg-blue-50 transition-colors">
                          <Upload className="w-4 h-4" />
                          {answers.justif_bail ? "Remplacer le fichier" : "Importer le document"}
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setAnswer("justif_bail", e.target.files[0].name); }} />
                        </label>
                        {answers.justif_bail && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> {answers.justif_bail}</p>}
                      </div>
                    )}

                    {/* Local commercial — propriétaire */}
                    {answers.type_domiciliation === "local_commercial_proprio" && (
                      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-[#2563EB]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[#1E3A8A] text-sm">Titre de propriété ou taxe foncière</p>
                            <p className="text-xs text-gray-500">Document attestant que vous êtes propriétaire du local</p>
                          </div>
                          {answers.justif_propriete && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
                        </div>
                        <label className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#2563EB]/40 text-[#2563EB] text-sm font-medium cursor-pointer hover:bg-blue-50 transition-colors">
                          <Upload className="w-4 h-4" />
                          {answers.justif_propriete ? "Remplacer le fichier" : "Importer le document"}
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setAnswer("justif_propriete", e.target.files[0].name); }} />
                        </label>
                        {answers.justif_propriete && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> {answers.justif_propriete}</p>}
                      </div>
                    )}

                    {/* Société de domiciliation */}
                    {answers.type_domiciliation === "societe_domiciliation" && (
                      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Landmark className="w-5 h-5 text-[#2563EB]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[#1E3A8A] text-sm">Contrat de domiciliation</p>
                            <p className="text-xs text-gray-500">Contrat signé avec la société de domiciliation</p>
                          </div>
                          {answers.justif_contrat_domiciliation && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
                        </div>
                        <label className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#2563EB]/40 text-[#2563EB] text-sm font-medium cursor-pointer hover:bg-blue-50 transition-colors">
                          <Upload className="w-4 h-4" />
                          {answers.justif_contrat_domiciliation ? "Remplacer le fichier" : "Importer le document"}
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setAnswer("justif_contrat_domiciliation", e.target.files[0].name); }} />
                        </label>
                        {answers.justif_contrat_domiciliation && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> {answers.justif_contrat_domiciliation}</p>}
                      </div>
                    )}

                    {/* Pépinière / incubateur / coworking */}
                    {answers.type_domiciliation === "pepiniere" && (
                      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-[#2563EB]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[#1E3A8A] text-sm">Convention d&apos;hébergement</p>
                            <p className="text-xs text-gray-500">Convention signée avec la pépinière, l&apos;incubateur ou le coworking</p>
                          </div>
                          {answers.justif_convention_hebergement && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
                        </div>
                        <label className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#2563EB]/40 text-[#2563EB] text-sm font-medium cursor-pointer hover:bg-blue-50 transition-colors">
                          <Upload className="w-4 h-4" />
                          {answers.justif_convention_hebergement ? "Remplacer le fichier" : "Importer le document"}
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setAnswer("justif_convention_hebergement", e.target.files[0].name); }} />
                        </label>
                        {answers.justif_convention_hebergement && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> {answers.justif_convention_hebergement}</p>}
                      </div>
                    )}

                    {/* Fallback — aucun type sélectionné */}
                    {!answers.type_domiciliation && (
                      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-[#2563EB]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[#1E3A8A] text-sm">Justificatif de domiciliation du siège</p>
                            <p className="text-xs text-gray-500">Sélectionnez un type de domiciliation dans la page &quot;Siège social&quot; pour voir le justificatif requis</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Justificatifs activité réglementée — si détectée */}
                    {answers.est_reglementee === "oui" && answers.reglementation_justificatifs && (() => {
                      try {
                        const justifs = JSON.parse(answers.reglementation_justificatifs);
                        if (justifs.length === 0) return null;
                        return (
                          <div className="space-y-3">
                            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
                              <p className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-2">⚠️ Justificatifs requis — Activité réglementée ({answers.activite_principale_desc})</p>
                              {answers.reglementation_description && <p className="text-sm text-amber-700 mb-2">{answers.reglementation_description}</p>}
                              {answers.reglementation_autorite && <p className="text-xs text-amber-600">Autorité compétente : {answers.reglementation_autorite}</p>}
                            </div>
                            {justifs.map((justif: string, idx: number) => (
                              <div key={idx} className="bg-white border border-amber-200 rounded-xl p-5 space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                                    <Shield className="w-5 h-5 text-amber-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-[#1E3A8A] text-sm">{justif}</p>
                                    <p className="text-xs text-gray-500">Requis pour l&apos;exercice de votre activité réglementée</p>
                                  </div>
                                  {answers[`justif_reglemente_${idx}`] && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
                                </div>
                                <label className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-amber-400 text-amber-700 text-sm font-medium cursor-pointer hover:bg-amber-50 transition-colors">
                                  <Upload className="w-4 h-4" />
                                  {answers[`justif_reglemente_${idx}`] ? "Remplacer le fichier" : "Importer le document"}
                                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setAnswer(`justif_reglemente_${idx}`, e.target.files[0].name); }} />
                                </label>
                                {answers[`justif_reglemente_${idx}`] && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> {answers[`justif_reglemente_${idx}`]}</p>}
                              </div>
                            ))}
                          </div>
                        );
                      } catch { return null; }
                    })()}

                    {/* Attestation de mise à disposition / hébergement — génération auto */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Landmark className="w-5 h-5 text-[#2563EB]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-[#1E3A8A] text-sm">Attestation de mise à disposition / hébergement</p>
                          <p className="text-xs text-gray-500">Document à faire signer par l&apos;hébergeur ou le metteur à disposition</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          const { buildAttestationHebergement } = await import("@/app/lib/generateSasuDocuments");
                          const { generateSasuDocumentDocx } = await import("@/app/lib/generateDocx");
                          const text = buildAttestationHebergement(answers);
                          const blob = await generateSasuDocumentDocx(text);
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "attestation-hebergement-mise-a-disposition.docx";
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        <Download className="w-4 h-4" />
                        Télécharger l&apos;attestation d&apos;hébergement
                      </button>
                      <p className="text-xs text-gray-500">À compléter par les champs manquants, imprimer et faire signer par l&apos;hébergeur.</p>
                    </div>

                    {/* Attestation de dépôt du capital */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Coins className="w-5 h-5 text-[#2563EB]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-[#1E3A8A] text-sm">Attestation de dépôt du capital</p>
                          <p className="text-xs text-gray-500">Délivrée par votre banque ou notaire</p>
                        </div>
                        {answers.justif_depot_capital && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
                      </div>
                      <label className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#2563EB]/40 text-[#2563EB] text-sm font-medium cursor-pointer hover:bg-blue-50 transition-colors">
                        <Upload className="w-4 h-4" />
                        {answers.justif_depot_capital ? "Remplacer le fichier" : "Importer le document"}
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setAnswer("justif_depot_capital", e.target.files[0].name); }} />
                      </label>
                      {answers.justif_depot_capital && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> {answers.justif_depot_capital}</p>}
                    </div>

                    {/* Déclaration de non-condamnation et de filiation — génération auto */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Shield className="w-5 h-5 text-[#2563EB]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-[#1E3A8A] text-sm">
                            Déclaration de non-condamnation et de filiation
                            {answers.president_type === "morale" && " (représentant permanent)"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {answers.president_type === "morale"
                              ? "Générée au nom du représentant permanent de la société dirigeante"
                              : "Générée automatiquement à partir de vos informations"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          const { buildNonCondamnation } = await import("@/app/lib/generateSasuDocuments");
                          const { generateSasuDocumentDocx } = await import("@/app/lib/generateDocx");
                          const text = buildNonCondamnation({
                            ...answers,
                            prenom_pere: answers.president_pere_nom?.split(" ").slice(1).join(" ") || answers.president_rp_pere_nom?.split(" ").slice(1).join(" "),
                            nom_pere: answers.president_pere_nom?.split(" ")[0] || answers.president_rp_pere_nom?.split(" ")[0],
                            prenom_mere: answers.president_mere_nom?.split(" ").slice(1).join(" ") || answers.president_rp_mere_nom?.split(" ").slice(1).join(" "),
                            nom_mere: answers.president_mere_nom?.split(" ")[0] || answers.president_rp_mere_nom?.split(" ")[0],
                          });
                          const blob = await generateSasuDocumentDocx(text);
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "declaration-non-condamnation-filiation.docx";
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        <Download className="w-4 h-4" />
                        Télécharger la déclaration de non-condamnation
                      </button>
                      <p className="text-xs text-gray-500">Document à imprimer, signer et joindre au dossier.</p>
                    </div>

                    {/* Dispense de commissaire aux apports — si apport en nature */}
                    {(answers.apports_nature_liste || []).length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <FileUp className="w-5 h-5 text-[#2563EB]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[#1E3A8A] text-sm">Déclaration de dispense de commissaire aux apports</p>
                            <p className="text-xs text-gray-500">Générée automatiquement — requise si apport en nature sans commissaire</p>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            const { buildDispenseCAA } = await import("@/app/lib/generateSasuDocuments");
                            const { generateSasuDocumentDocx } = await import("@/app/lib/generateDocx");
                            const text = buildDispenseCAA(answers);
                            const blob = await generateSasuDocumentDocx(text);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = "declaration-dispense-commissaire-apports.docx";
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger la déclaration de dispense
                        </button>
                        <p className="text-xs text-gray-500">Document à imprimer, signer et joindre au dossier d&apos;immatriculation.</p>
                      </div>
                    )}

                    {/* Attestation d'origine patrimoniale — si déclaration remploi = oui */}
                    {answers.declaration_remploi === "oui" && (
                      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Heart className="w-5 h-5 text-[#2563EB]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[#1E3A8A] text-sm">Attestation d&apos;origine patrimoniale des apports</p>
                            <p className="text-xs text-gray-500">Générée automatiquement — bien propre</p>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            const { buildAttestationOrigine } = await import("@/app/lib/generateSasuDocuments");
                            const { generateSasuDocumentDocx } = await import("@/app/lib/generateDocx");
                            const text = buildAttestationOrigine(answers);
                            const blob = await generateSasuDocumentDocx(text);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = "attestation-origine-patrimoniale.docx";
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger l&apos;attestation d&apos;origine patrimoniale
                        </button>
                        <p className="text-xs text-gray-500">Document à imprimer, signer et joindre au dossier.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Page 9: Président rémunéré ── */}
                {POST_PAGES[postPage]?.id === "president_remunere" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>
                    {QUESTIONS[12].info && (
                      <AccordionItem title={QUESTIONS[12].info.title}>
                        <div className="text-base text-gray-600">{QUESTIONS[12].info.content}</div>
                      </AccordionItem>
                    )}
                    <div className="space-y-3">
                      {QUESTIONS[12].choices?.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setAnswer("president_remunere", c.value)}
                          className={cn(
                            "w-full flex items-center gap-4 p-5 rounded-xl border-2 bg-white text-left transition-all group text-base",
                            answers.president_remunere === c.value
                              ? "border-[#2563EB] bg-blue-50"
                              : "border-gray-200 hover:border-[#2563EB] hover:bg-blue-50"
                          )}
                        >
                          <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 transition-colors">
                            <Sparkles className="w-6 h-6 text-[#2563EB]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-[#1E3A8A]">{c.label}</p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#2563EB] flex-shrink-0 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      if (postPage > 0) {
                        // Skip conditional pages backwards
                        let prev = postPage - 1;
                        while (prev > 0 && shouldSkipPage(POST_PAGES[prev]?.id)) {
                          prev--;
                        }
                        setPostPage(prev);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      } else {
                        setPhase("pricing");
                      }
                    }}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-base hover:bg-gray-50 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={() => {
                      if (postPage < POST_PAGES.length - 1) {
                        // Skip conditional pages forwards
                        let next = postPage + 1;
                        while (next < POST_PAGES.length - 1 && shouldSkipPage(POST_PAGES[next]?.id)) {
                          next++;
                        }
                        setPostPage(next);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className="flex-1 py-3 rounded-xl bg-[#1E3A8A] text-white font-semibold text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    Continuer <ArrowRight className="w-4 h-4" />
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
