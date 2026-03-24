"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, ChevronRight,
  User, Building2, CreditCard, FolderOpen, CheckCircle2,
  FileUp, PenTool, HelpCircle, Lightbulb, Clock, Zap, Shield, Users, Sparkles, X,
  Coins, Percent, Edit3, AlertTriangle, FileText, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-6 border border-[#D1D5DB] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-[#EFF6FF] text-sm font-semibold text-[#1E293B]"
      >
        <span className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          Plus d&apos;informations
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="px-5 py-4 bg-white border-t border-[#D1D5DB]">
          <p className="text-sm font-bold text-[#2563EB] mb-2">{title}</p>
          <div className="text-sm text-[#6B7280] leading-relaxed">{children}</div>
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

function BrandProtectionSection() {
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
            onClick={() => setSelectedPlan(p.id)}
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

function AccordionItem({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left gap-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">💡</span>
          <span className="text-sm font-semibold text-[#2563EB]">{title}</span>
        </div>
        <ChevronDown className={cn("w-5 h-5 text-[#2563EB] flex-shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-blue-100 pt-3">
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
  { title: "Frais de greffe (immatriculation RCS)", amount: "37,45 €", description: "Frais légaux versés au Greffe du Tribunal de Commerce pour inscrire votre SASU au Registre du Commerce et des Sociétés (RCS). Ce montant est fixé par arrêté et identique partout en France métropolitaine. C'est cette inscription qui donne naissance juridiquement à votre société." },
  { title: "Publication d'annonce légale (JAL)", amount: "138,00 € HT", description: "La loi impose de publier un avis de constitution dans un Journal d'Annonces Légales (JAL) habilité dans le département du siège social. Depuis la réforme de 2021, le tarif est un forfait national fixe de 138 € HT pour les SAS/SASU (environ 165 € HT pour Mayotte et La Réunion). Nous nous chargeons de la publication pour vous." },
  { title: "Déclaration des bénéficiaires effectifs (DBE)", amount: "21,41 €", description: "Obligation légale anti-blanchiment : vous devez déclarer l'identité des personnes physiques qui contrôlent votre société (plus de 25 % du capital ou des droits de vote). Déposée en même temps que l'immatriculation, le tarif est de 21,41 €. Si déposée séparément, le coût passe à environ 43,35 €." },
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
          + frais annexes obligatoires (~196,86 € HT)
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
        <div className="text-sm text-gray-600 space-y-2">
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
          <p className="text-sm font-bold text-[#1E3A8A]">Sous catégorie : {activeCat.label.replace(/\n/g, " ")}</p>
          <div className="flex flex-wrap gap-2">
            {activeCat.sousCategories.map((sc) => (
              <button
                key={sc}
                onClick={() => onSousCategorie(sc)}
                className={cn(
                  "px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all",
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

function shouldShowQuestion(qIndex: number, answers: Record<string, string>): boolean {
  const q = QUESTIONS[qIndex];
  if (q.id === "action_micro" || q.id === "fermeture_micro") return answers.statut_micro === "oui";
  return true;
}

/* ───────── Main page ───────── */

type Phase = "intro" | "questions" | "brand_protection" | "micro_search" | "pricing" | "avocat_confirmation" | "post_payment";

export default function CreationSASUPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentQ, setCurrentQ] = useState(0); // index into activeQuestions
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [postPage, setPostPage] = useState(0); // for post-payment pages

  const setAnswer = (id: string, val: string) =>
    setAnswers((prev) => ({ ...prev, [id]: val }));

  // Build active pre-payment questions
  const activeQuestions = PRE_PAYMENT_QUESTIONS.filter((i) => shouldShowQuestion(i, answers));
  const totalQ = activeQuestions.length;
  const currentQIndex = activeQuestions[currentQ]; // actual QUESTIONS index
  const question = QUESTIONS[currentQIndex];

  // Post-payment pages (step 4: dossier juridique) — dynamic based on formule_capital
  const POST_PAGES_ALL = [
    { id: "regles_statutaires" },   // règles par défaut ou personnaliser
    { id: "date_cloture" },         // date de clôture exercice comptable
    { id: "services_comptables" },  // commissaire aux comptes / services comptables
    { id: "denomination" },         // dénomination + sigle + nom commercial + enseigne
    { id: "objet_principal" },      // catégories visuelles + sous-catégories
    { id: "objet_social" },         // texte libre
    { id: "activite_description" }, // activité principale + secondaires + code NAF
    { id: "activite_saisonniere" }, // saisonnière / ambulante
    { id: "associe_unique" },       // type d'associé + infos
    { id: "capital_social" },       // capital fixe/variable + montant + actions + formule
    { id: "apport_associe" },      // apport de l'associé unique
    { id: "nomination_president" },  // nomination du président (1 seul)
    { id: "mandat_president" },     // majorité, révocation, durée, rémunération, pouvoirs
    { id: "nomination_dg" },        // souhaitez-vous nommer DG/DGD ? oui/non + formulaire
    { id: "mandat_dg" },           // majorité, révocation, durée, renouvellement, rémunération DG/DGD
    { id: "depot_capital" },        // établissement bancaire + date dépôt
    { id: "regime_fiscal" },        // IS / IR
    { id: "adresse_siege" },        // adresse + type d'hébergement
    { id: "rbe" },                  // bénéficiaires effectifs (détection auto >25%)
  ];

  // Filter pages dynamically based on answers
  const POST_PAGES = POST_PAGES_ALL;

  // Determine sidebar step from phase
  const sidebarStep =
    phase === "intro" ? 1 :
    phase === "questions" ? (question && ["qui_realise"].includes(question.id) ? 1 : 2) :
    phase === "brand_protection" || phase === "micro_search" ? 2 :
    phase === "pricing" || phase === "avocat_confirmation" ? 3 :
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
          <p className="text-xs text-gray-500 mt-0.5">Société par actions simplifiée unipersonnelle</p>
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

      {/* ── Main content ── */}
      <main className={cn(
        "flex-1 flex justify-center min-h-screen",
        phase === "questions" || phase === "intro"
          ? "md:ml-72 p-6 md:p-10 items-center"
          : phase === "pricing" || phase === "post_payment"
            ? "md:ml-72 p-6 md:p-10 items-start pt-10"
            : "md:ml-72 p-6 items-start"
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

                <div className="grid grid-cols-3 gap-4 text-center">
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
                          "w-full flex items-center gap-4 p-5 rounded-xl border-2 bg-white text-left transition-all group",
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
                      className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
                    >
                      Retour
                    </button>
                    <button
                      onClick={handleInputContinue}
                      disabled={!answers[question.id]}
                      className="flex-1 py-3 rounded-xl bg-[#1E3A8A] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center justify-center gap-2"
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
                <BrandProtectionSection />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      // Go back to proteger_nom question
                      const idx = activeQuestions.findIndex((i) => QUESTIONS[i].id === "proteger_nom");
                      setCurrentQ(idx >= 0 ? idx : currentQ);
                      setPhase("questions");
                    }}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
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
                    className="flex-1 py-3 rounded-xl bg-[#1E3A8A] text-white font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2"
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
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
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
                    className="flex-1 py-3 rounded-xl bg-[#1E3A8A] text-white font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2"
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
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const idx = activeQuestions.findIndex((i) => QUESTIONS[i].id === "activite_artisanale");
                      setCurrentQ(idx >= 0 ? idx : totalQ - 1);
                      setPhase("questions");
                    }}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={() => {
                      if (answers.formule === "avocat") {
                        setPhase("avocat_confirmation");
                      } else {
                        setPhase("post_payment");
                        setPostPage(0);
                      }
                    }}
                    disabled={!answers.formule}
                    className="flex-1 py-3 rounded-xl bg-[#1E3A8A] text-white font-semibold text-sm hover:opacity-90 disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                    Continuer <ArrowRight className="w-4 h-4" />
                  </button>
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

                {/* ── Page: Règles statutaires par défaut ── */}
                {POST_PAGES[postPage]?.id === "regles_statutaires" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>

                    <AccordionItem title="Plus d'informations">
                      <div className="text-sm text-gray-600 space-y-4">
                        <p className="font-bold text-[#1E3A8A]">Règles statutaires proposées par défaut – SASU</p>
                        <p>Afin de simplifier la rédaction de vos statuts, nous vous proposons ci-dessous les règles les plus couramment adoptées dans les SASU.</p>

                        <p className="font-bold text-[#1E3A8A] text-center">Résumé des règles par défaut proposées :</p>

                        <div className="space-y-2 text-center">
                          <p><strong className="text-[#2563EB]">Actions :</strong> Les actions sont librement cessibles et négociables.</p>
                          <p><strong className="text-[#2563EB]">Commissaire aux comptes :</strong> Aucun commissaire aux comptes n&apos;est désigné dans les statuts.</p>
                          <p><strong className="text-[#2563EB]">Durée de la société :</strong> La société est créée pour une durée de 99 ans, durée maximale autorisée par la loi.</p>
                          <p><strong className="text-[#2563EB]">Déclaration de l&apos;associé unique :</strong> L&apos;associé unique déclare n&apos;avoir accompli aucun acte pour le compte de la société avant sa création.</p>
                          <p className="font-bold text-[#1E3A8A]">Décisions de l&apos;associé unique et assemblées :</p>
                          <p className="italic">Tant que la société ne comporte qu&apos;un seul associé, toutes les décisions sont prises par l&apos;associé unique et consignées par écrit dans un registre ou un document signé et daté (papier ou électronique).</p>
                          <p className="italic">Si la société accueille ultérieurement de nouveaux associés, les assemblées seront convoquées par le Président, par tout moyen (courrier, e-mail, etc.).</p>
                          <p className="italic">Chaque associé dispose d&apos;un nombre de voix proportionnel au nombre d&apos;actions qu&apos;il détient.</p>
                          <p className="italic">En cas d&apos;égalité des voix, le Président dispose d&apos;une voix prépondérante.</p>
                          <p className="italic">Les décisions sont prises à la majorité simple (plus de 50 % des voix) des associés présents ou représentés.</p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3">
                          <p><strong>Important :</strong> Ces clauses correspondent aux usages classiques des SASU. Toutefois, si vous avez des besoins spécifiques (contrôle des cessions d&apos;actions, limitation de pouvoirs, etc.), vous pouvez les adapter librement à l&apos;aide des options de personnalisation ci-dessous.</p>
                        </div>
                      </div>
                    </AccordionItem>

                    {/* Bouton explication simple */}
                    <button
                      onClick={() => setAnswer("show_regles_explications", answers.show_regles_explications === "true" ? "" : "true")}
                      className="px-6 py-3 rounded-xl bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1D4ED8] transition-colors"
                    >
                      Explication simple des règles par défaut
                    </button>

                    {answers.show_regles_explications === "true" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3 text-sm text-gray-700"
                      >
                        <p><strong className="text-[#2563EB]">Actions librement cessibles :</strong> vous pouvez vendre vos actions à qui vous voulez, sans restriction.</p>
                        <p><strong className="text-[#2563EB]">Pas de commissaire aux comptes :</strong> pas de contrôle externe obligatoire tant que votre SASU ne dépasse pas certains seuils.</p>
                        <p><strong className="text-[#2563EB]">Durée 99 ans :</strong> la société est créée pour durer aussi longtemps que vous le souhaitez.</p>
                        <p><strong className="text-[#2563EB]">Décisions :</strong> tant que vous êtes seul associé, vous décidez seul, par écrit. Simple et rapide.</p>
                        <p><strong className="text-[#2563EB]">Voix prépondérante :</strong> si des associés arrivent plus tard et qu&apos;il y a égalité, le Président tranche.</p>
                      </motion.div>
                    )}

                    {/* Choix */}
                    <div className="space-y-3">
                      <p className="text-base font-bold text-[#1E3A8A]">Que préférez-vous ?</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            setAnswer("regles_choice", "defaut");
                            setTimeout(() => { setPostPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }, 300);
                          }}
                          className={cn(
                            "text-left px-5 py-4 rounded-xl border-2 transition-all",
                            answers.regles_choice === "defaut"
                              ? "border-[#2563EB] bg-[#EFF6FF]"
                              : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                          )}
                        >
                          <span className="text-sm font-medium text-[#2563EB]">Je choisis ces règles par défaut</span>
                        </button>
                        <button
                          onClick={() => {
                            setAnswer("regles_choice", "personnaliser");
                            setTimeout(() => { setPostPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }, 300);
                          }}
                          className={cn(
                            "text-left px-5 py-4 rounded-xl border-2 transition-all",
                            answers.regles_choice === "personnaliser"
                              ? "border-[#2563EB] bg-[#EFF6FF]"
                              : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                          )}
                        >
                          <span className="text-sm font-medium text-[#2563EB]">Je souhaite modifier certaines règles</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Page: Date de clôture exercice comptable ── */}
                {POST_PAGES[postPage]?.id === "date_cloture" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>

                    <AccordionItem title="Plus d'informations">
                      <div className="text-sm text-gray-600 space-y-4">
                        <p className="font-bold text-[#1E3A8A]">Date de clôture de l&apos;exercice comptable, que choisir ?</p>
                        <div className="space-y-3">
                          <div>
                            <p className="font-bold text-[#1E3A8A]">Clôture au 31 décembre (par défaut)</p>
                            <p>L&apos;exercice se termine avec l&apos;année civile. Simple, courant et pratique pour la gestion.</p>
                          </div>
                          <div>
                            <p className="font-bold text-[#1E3A8A]">Clôture spéciale la 1<sup>re</sup> année</p>
                            <p>Le premier exercice comptable peut durer au maximum 24 mois à compter de la date d&apos;immatriculation.</p>
                            <p><strong>Exemple :</strong> Si votre société est créée le 15 avril 2025, vous pourrez fixer la fin de votre premier exercice jusqu&apos;au 15 avril 2027 au plus tard. Mais, vous pouvez aussi choisir une date fixe comme le 31 décembre 2026, pour être aligné sur l&apos;année civile.</p>
                          </div>
                          <div>
                            <p className="font-bold text-[#1E3A8A]">Autre date permanente</p>
                            <p>Vous pouvez fixer une autre date chaque année (ex. 30 septembre). Ce choix peut mieux correspondre à votre cycle d&apos;activité, mais demande un suivi régulier.</p>
                          </div>
                        </div>
                      </div>
                    </AccordionItem>

                    <p className="text-base font-bold text-[#1E3A8A]">Date de clôture de l&apos;exercice comptable</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        onClick={() => { setAnswer("date_cloture", "31_decembre"); setTimeout(() => { setPostPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }, 300); }}
                        className={cn(
                          "text-left px-5 py-4 rounded-xl border-2 transition-all",
                          answers.date_cloture === "31_decembre"
                            ? "border-[#2563EB] bg-[#EFF6FF]"
                            : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                        )}
                      >
                        <span className="text-sm font-medium text-[#2563EB]">Clôture au 31 décembre chaque année (recommandé)</span>
                      </button>
                      <button
                        onClick={() => setAnswer("date_cloture", "speciale_1ere")}
                        className={cn(
                          "text-left px-5 py-4 rounded-xl border-2 transition-all",
                          answers.date_cloture === "speciale_1ere"
                            ? "border-[#2563EB] bg-[#EFF6FF]"
                            : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                        )}
                      >
                        <span className="text-sm font-medium text-[#2563EB]">Je souhaite une clôture différente la 1re année</span>
                      </button>
                      <button
                        onClick={() => setAnswer("date_cloture", "autre_permanente")}
                        className={cn(
                          "text-left px-5 py-4 rounded-xl border-2 transition-all",
                          answers.date_cloture === "autre_permanente"
                            ? "border-[#2563EB] bg-[#EFF6FF]"
                            : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                        )}
                      >
                        <span className="text-sm font-medium text-[#2563EB]">Je souhaite une autre date permanente</span>
                      </button>
                    </div>

                    {/* Date personnalisée si spéciale 1ère année */}
                    {answers.date_cloture === "speciale_1ere" && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <label className="block text-sm font-bold text-[#1E3A8A]">Date de fin du premier exercice</label>
                        <p className="text-xs text-gray-500">Maximum 24 mois après la date d&apos;immatriculation.</p>
                        <input
                          type="date"
                          value={answers.date_cloture_speciale || ""}
                          onChange={(e) => setAnswer("date_cloture_speciale", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                        />
                      </motion.div>
                    )}

                    {/* Date personnalisée si autre permanente */}
                    {answers.date_cloture === "autre_permanente" && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <label className="block text-sm font-bold text-[#1E3A8A]">Jour et mois de clôture</label>
                        <p className="text-xs text-gray-500">Ex : 30 septembre, 30 juin, etc.</p>
                        <input
                          type="text"
                          value={answers.date_cloture_permanente || ""}
                          onChange={(e) => setAnswer("date_cloture_permanente", e.target.value)}
                          placeholder="Ex : 30 septembre"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                        />
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ── Page: Services comptables ── */}
                {POST_PAGES[postPage]?.id === "services_comptables" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>

                    <AccordionItem title="Plus d'informations">
                      <div className="text-sm text-gray-600">
                        <p>Dans la formule par défaut, vous avez indiqué ne pas vouloir nommer de commissaire aux comptes.</p>
                      </div>
                    </AccordionItem>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-sm text-gray-700">Dans la formule par défaut, vous avez indiqué ne pas vouloir nommer de commissaire aux comptes.</p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-base font-bold text-[#1E3A8A]">Souhaitez-vous néanmoins bénéficier de services comptables ?</p>
                      <p className="text-sm text-gray-500">Dans la formule par défaut, vous avez indiqué ne pas vouloir nommer de commissaire aux comptes.</p>

                      <button
                        onClick={() => { setAnswer("services_comptables", "logiciel"); setTimeout(() => { setPostPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }, 300); }}
                        className={cn(
                          "w-full text-left px-5 py-4 rounded-xl border-2 transition-all",
                          answers.services_comptables === "logiciel"
                            ? "border-[#2563EB] bg-[#EFF6FF]"
                            : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                        )}
                      >
                        <span className="text-sm font-medium text-[#2563EB]">Oui, je suis intéressé(e) par un logiciel de comptabilité en ligne.</span>
                      </button>
                      <button
                        onClick={() => { setAnswer("services_comptables", "expert_comptable"); setTimeout(() => { setPostPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }, 300); }}
                        className={cn(
                          "w-full text-left px-5 py-4 rounded-xl border-2 transition-all",
                          answers.services_comptables === "expert_comptable"
                            ? "border-[#2563EB] bg-[#EFF6FF]"
                            : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                        )}
                      >
                        <span className="text-sm font-medium text-[#2563EB]">Oui, je souhaite être mis(e) en relation avec un expert-comptable dans mon secteur.</span>
                      </button>
                      <button
                        onClick={() => { setAnswer("services_comptables", "non"); setTimeout(() => { setPostPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }, 300); }}
                        className={cn(
                          "w-full text-left px-5 py-4 rounded-xl border-2 transition-all",
                          answers.services_comptables === "non"
                            ? "border-[#2563EB] bg-[#EFF6FF]"
                            : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                        )}
                      >
                        <span className="text-sm font-medium text-gray-700">Non merci</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Page: Dénomination sociale ── */}
                {POST_PAGES[postPage]?.id === "denomination" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>

                    <AccordionItem title="Plus d'informations">
                      <div className="text-sm text-gray-600 space-y-2">
                        <p>La <strong className="text-[#1E3A8A]">dénomination sociale</strong> est le <strong>nom juridique officiel</strong> de la société. Vous pouvez aussi ajouter <strong>un sigle, un nom commercial</strong> ou <strong>une enseigne</strong>.</p>
                        <p>Ces informations seront reprises dans les statuts, les documents légaux et commerciaux.</p>
                      </div>
                    </AccordionItem>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Dénomination sociale (obligatoire)</label>
                        <p className="text-xs text-gray-500 mb-2">Nom juridique de la société, tel qu&apos;il figure dans les statuts et sur l&apos;extrait Kbis.</p>
                        <input
                          type="text"
                          value={answers.denomination_sociale || answers.nom_societe || ""}
                          onChange={(e) => setAnswer("denomination_sociale", e.target.value)}
                          placeholder="Ex : Altura Conseil"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Sigle (facultatif)</label>
                        <p className="text-xs text-gray-500 mb-2">Abréviation du nom de la société. Utilisé à titre interne ou pour simplifier la communication.</p>
                        <input
                          type="text"
                          value={answers.sigle || ""}
                          onChange={(e) => setAnswer("sigle", e.target.value)}
                          placeholder="AC (sigle d'Altura Conseil)"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nom commercial (facultatif)</label>
                        <p className="text-xs text-gray-500 mb-2">Nom utilisé dans le cadre de l&apos;activité commerciale. Il peut être différent de la dénomination sociale.</p>
                        <input
                          type="text"
                          value={answers.nom_commercial || ""}
                          onChange={(e) => setAnswer("nom_commercial", e.target.value)}
                          placeholder="Altura & Co (pour Altura Conseil)"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Enseigne (facultatif)</label>
                        <p className="text-xs text-gray-500 mb-2">Nom apposé en façade du local d&apos;exploitation, s&apos;il y a lieu. Elle identifie visuellement l&apos;établissement.</p>
                        <input
                          type="text"
                          value={answers.enseigne || ""}
                          onChange={(e) => setAnswer("enseigne", e.target.value)}
                          placeholder="Altura (enseigne visible en boutique)"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                        />
                      </div>
                    </div>
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
                      <p className="text-sm text-gray-600">
                        Vous rédigez vous-même votre objet social. Les champs peuvent être préremplis selon les activités choisies à l&apos;étape précédente (modifiable), ou vous pouvez les compléter maintenant. Vous écrivez ensuite votre objet social directement dans l&apos;encadré prévu à cet effet.
                      </p>
                    </div>

                    {/* Option 2: Assistance IA */}
                    <div className="border-2 border-[#2563EB] rounded-xl p-5 space-y-4 bg-[#EFF6FF]">
                      <h3 className="text-lg font-bold text-[#1E3A8A]">Option 2 – Assistance à la rédaction par notre intelligence artificielle</h3>
                      <p className="text-sm text-gray-600">
                        Nous avons prévu l&apos;aide de notre intelligence artificielle afin de vous aider à la rédaction, vous pouvez modifier le texte par vous même si besoin. Il vous faudra ajouter vos activités principales si cela n&apos;a pas été choisi dans la page précédente.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Activité principale</label>
                          <input
                            type="text"
                            value={answers.activite_principale_desc || answers.sous_categorie || ""}
                            onChange={(e) => setAnswer("activite_principale_desc", e.target.value)}
                            placeholder="Ex : Soutien scolaire"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 bg-white transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Activités secondaires <span className="font-normal text-gray-400">facultatif</span></label>
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
                          onClick={() => {
                            // Popup placeholder — generates a draft objet social from activities
                            const principale = answers.activite_principale_desc || answers.sous_categorie || "";
                            const secondaires = answers.activites_secondaires || "";
                            if (principale) {
                              const draft = `La société a pour objet : ${principale}${secondaires ? `, ${secondaires}` : ""}. Et plus généralement, toutes opérations industrielles, commerciales, financières, civiles, mobilières ou immobilières, pouvant se rattacher directement ou indirectement à l'objet social ou à tout objet similaire, connexe ou complémentaire.`;
                              setAnswer("objet_social", draft);
                            }
                          }}
                          disabled={!answers.activite_principale_desc && !answers.sous_categorie}
                          className="px-6 py-3 rounded-xl bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1D4ED8] active:bg-[#1E40AF] disabled:bg-[#9CA3AF] transition-colors flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Rédiger mon objet social
                        </button>
                        <button
                          onClick={() => setAnswer("show_objet_popup", answers.show_objet_popup === "true" ? "" : "true")}
                          className="px-6 py-3 rounded-xl bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1D4ED8] transition-colors"
                        >
                          Popup
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
                      placeholder="Ex : Conseil en stratégie digitale, développement de sites web et applications mobiles, et toutes opérations se rattachant directement ou indirectement à cet objet..."
                      rows={6}
                      className="w-full px-5 py-4 rounded-xl border-2 border-[#2563EB] bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-base resize-none"
                    />
                  </div>
                )}

                {/* ── Page 3: Activité principale + secondaires ── */}
                {POST_PAGES[postPage]?.id === "activite_description" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>

                    <AccordionItem title="Plus d'informations">
                      <div className="text-sm text-gray-600 space-y-2">
                        <p>L&apos;activité principale est celle qui génère le plus de chiffre d&apos;affaires. Les activités secondaires sont complémentaires.</p>
                        <p>Ces informations permettent de déterminer votre <strong>code NAF</strong> et de vérifier les obligations réglementaires.</p>
                      </div>
                    </AccordionItem>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-bold text-[#1E3A8A] mb-1">
                          Parmi les activités mentionnées dans votre objet social, quelle est l&apos;activité principale de votre société ?
                        </label>
                        <p className="text-xs text-gray-500 mb-2">(exemple : salon de coiffure, travaux de plomberie, vente en ligne de vêtements, conseil en gestion, etc.) Décrivez en quelques mots ce que fait votre entreprise au quotidien.</p>
                        <input
                          type="text"
                          value={answers.activite_principale_desc || ""}
                          onChange={(e) => {
                            setAnswer("activite_principale_desc", e.target.value);
                            // Reset NAF detection on change
                            setAnswer("naf_code", "");
                            setAnswer("naf_label", "");
                            setAnswer("naf_reglemente", "");
                            setAnswer("naf_justifs", "");
                          }}
                          placeholder="Ex : Soutien scolaire"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#1E3A8A] mb-1">
                          Votre société exercera-t-elle d&apos;autres activités secondaires (mentionnées dans l&apos;objet social) ?
                        </label>
                        <p className="text-xs text-gray-500 mb-2">Si oui merci de le préciser de manière simple (Exemples : vente de produits liés à l&apos;activité, formation, maintenance, prestation complémentaire, etc.)</p>
                        <input
                          type="text"
                          value={answers.activites_secondaires || ""}
                          onChange={(e) => setAnswer("activites_secondaires", e.target.value)}
                          placeholder="Ex : Formation en ligne, vente de supports pédagogiques"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                        />
                      </div>
                    </div>

                    {/* Bouton détection NAF */}
                    {answers.activite_principale_desc && !answers.naf_code && (
                      <button
                        onClick={() => {
                          const desc = (answers.activite_principale_desc || "").toLowerCase();
                          // Dictionnaire de correspondances NAF + réglementation
                          const NAF_DB: { keywords: string[]; code: string; label: string; reglemente: boolean; justifs: string[] }[] = [
                            { keywords: ["coiffure", "coiffeur"], code: "96.02A", label: "Coiffure", reglemente: true, justifs: ["Brevet professionnel (BP) de coiffure ou diplôme équivalent", "Justificatif d'inscription au répertoire des métiers"] },
                            { keywords: ["boulangerie", "boulanger", "pain"], code: "10.71A", label: "Fabrication industrielle de pain et de pâtisserie fraîche", reglemente: true, justifs: ["CAP Boulanger ou diplôme équivalent", "Carte d'artisan"] },
                            { keywords: ["patisserie", "patissier", "pâtisserie"], code: "10.71B", label: "Cuisson de produits de boulangerie", reglemente: true, justifs: ["CAP Pâtissier ou diplôme équivalent"] },
                            { keywords: ["plomberie", "plombier", "chauffagiste", "sanitaire"], code: "43.22A", label: "Travaux d'installation d'eau et de gaz en tous locaux", reglemente: true, justifs: ["Qualification professionnelle (CAP/BEP/diplôme)", "Attestation de capacité professionnelle", "Assurance décennale obligatoire"] },
                            { keywords: ["electrici", "électrici"], code: "43.21A", label: "Travaux d'installation électrique dans tous locaux", reglemente: true, justifs: ["Qualification professionnelle en électricité", "Habilitation électrique", "Assurance décennale obligatoire"] },
                            { keywords: ["batiment", "bâtiment", "construction", "maçon", "maconnerie"], code: "41.20A", label: "Construction de bâtiments résidentiels et non résidentiels", reglemente: true, justifs: ["Qualification professionnelle dans le bâtiment", "Assurance décennale obligatoire", "Carte BTP si salariés"] },
                            { keywords: ["restaurant", "restauration", "traiteur"], code: "56.10A", label: "Restauration traditionnelle", reglemente: true, justifs: ["Permis d'exploitation (formation hygiène HACCP)", "Licence de débit de boissons (si alcool)", "Déclaration auprès de la DDPP"] },
                            { keywords: ["bar", "café", "débit de boissons"], code: "56.30Z", label: "Débits de boissons", reglemente: true, justifs: ["Permis d'exploitation", "Licence IV ou licence de débit de boissons", "Déclaration en mairie"] },
                            { keywords: ["pharmacie", "pharmacien"], code: "47.73Z", label: "Commerce de détail de produits pharmaceutiques en magasin spécialisé", reglemente: true, justifs: ["Diplôme d'État de docteur en pharmacie", "Inscription à l'Ordre des pharmaciens"] },
                            { keywords: ["immobilier", "agent immobilier", "transaction immobili"], code: "68.31Z", label: "Agences immobilières", reglemente: true, justifs: ["Carte professionnelle T (Transaction) ou G (Gestion)", "Garantie financière", "Assurance responsabilité civile professionnelle"] },
                            { keywords: ["transport", "vtc", "chauffeur", "taxi"], code: "49.32Z", label: "Transports de voyageurs par taxis", reglemente: true, justifs: ["Carte professionnelle VTC ou licence de taxi", "Attestation de capacité de transport", "Assurance RC professionnelle"] },
                            { keywords: ["sécurité", "gardiennage", "surveillance", "agent de sécurité"], code: "80.10Z", label: "Activités de sécurité privée", reglemente: true, justifs: ["Autorisation préalable du CNAPS", "Carte professionnelle CNAPS", "Assurance responsabilité civile professionnelle"] },
                            { keywords: ["comptab", "expert-comptable", "expertise comptable"], code: "69.20Z", label: "Activités comptables", reglemente: true, justifs: ["Diplôme d'expertise comptable (DEC)", "Inscription à l'Ordre des experts-comptables"] },
                            { keywords: ["avocat", "cabinet d'avocat"], code: "69.10Z", label: "Activités juridiques", reglemente: true, justifs: ["CAPA (Certificat d'Aptitude à la Profession d'Avocat)", "Inscription au barreau"] },
                            { keywords: ["médecin", "médical", "cabinet médical", "médecine"], code: "86.21Z", label: "Activité des médecins généralistes", reglemente: true, justifs: ["Diplôme d'État de docteur en médecine", "Inscription à l'Ordre des médecins"] },
                            { keywords: ["infirmier", "infirmière", "soins infirmiers"], code: "86.90C", label: "Autres activités pour la santé humaine n.c.a.", reglemente: true, justifs: ["Diplôme d'État d'infirmier", "Inscription à l'Ordre des infirmiers", "Enregistrement ADELI/RPPS"] },
                            { keywords: ["opticien", "optique"], code: "47.78A", label: "Commerces de détail d'optique", reglemente: true, justifs: ["BTS Opticien-lunetier", "Inscription au registre des opticiens"] },
                            { keywords: ["auto-école", "auto ecole", "conduite"], code: "85.53Z", label: "Enseignement de la conduite", reglemente: true, justifs: ["Agrément préfectoral", "BEPECASER ou Titre professionnel ECSR", "Autorisation d'enseigner"] },
                            { keywords: ["formation", "organisme de formation", "centre de formation"], code: "85.59A", label: "Formation continue d'adultes", reglemente: false, justifs: ["Numéro de déclaration d'activité (DREETS)", "Certification Qualiopi (si financement public)"] },
                            { keywords: ["crèche", "garde d'enfant", "petite enfance", "assistante maternelle"], code: "88.91A", label: "Accueil de jeunes enfants", reglemente: true, justifs: ["Agrément PMI (Protection Maternelle et Infantile)", "Diplôme petite enfance (CAP AEPE)"] },
                            { keywords: ["consulting", "conseil", "consultant", "stratégi"], code: "70.22Z", label: "Conseil pour les affaires et autres conseils de gestion", reglemente: false, justifs: [] },
                            { keywords: ["informatique", "développement", "logiciel", "programmation", "web", "application"], code: "62.01Z", label: "Programmation informatique", reglemente: false, justifs: [] },
                            { keywords: ["e-commerce", "ecommerce", "vente en ligne", "boutique en ligne"], code: "47.91A", label: "Vente à distance sur catalogue général", reglemente: false, justifs: [] },
                            { keywords: ["marketing", "communication", "publicité", "pub"], code: "73.11Z", label: "Activités des agences de publicité", reglemente: false, justifs: [] },
                            { keywords: ["design", "graphi", "créati"], code: "74.10Z", label: "Activités spécialisées de design", reglemente: false, justifs: [] },
                            { keywords: ["photo", "vidéo", "audiovisuel", "production"], code: "59.11A", label: "Production de films et de programmes pour la télévision", reglemente: false, justifs: [] },
                            { keywords: ["import", "export", "négoce", "commerce de gros"], code: "46.90Z", label: "Commerce de gros non spécialisé", reglemente: false, justifs: [] },
                            { keywords: ["déménagement"], code: "49.42Z", label: "Services de déménagement", reglemente: true, justifs: ["Inscription au registre des transporteurs", "Attestation de capacité professionnelle en transport"] },
                            { keywords: ["nettoyage", "propreté", "entretien"], code: "81.21Z", label: "Nettoyage courant des bâtiments", reglemente: false, justifs: [] },
                            { keywords: ["coach", "coaching", "développement personnel", "bien-être"], code: "96.09Z", label: "Autres services personnels n.c.a.", reglemente: false, justifs: [] },
                            { keywords: ["soutien scolaire", "cours particulier", "tutorat", "aide aux devoirs"], code: "85.59B", label: "Autres enseignements", reglemente: false, justifs: [] },
                            { keywords: ["fitness", "sport", "salle de sport", "musculation"], code: "93.13Z", label: "Activités des centres de culture physique", reglemente: true, justifs: ["Carte professionnelle d'éducateur sportif", "Diplôme BPJEPS ou équivalent", "Déclaration DDCS"] },
                            { keywords: ["architecte", "architecture"], code: "71.11Z", label: "Activités d'architecture", reglemente: true, justifs: ["Diplôme d'architecte DPLG/HMONP", "Inscription à l'Ordre des architectes"] },
                            { keywords: ["assurance", "courtage", "courtier"], code: "66.22Z", label: "Activités des agents et courtiers d'assurances", reglemente: true, justifs: ["Inscription à l'ORIAS", "Capacité professionnelle (150h de formation)", "Assurance RC professionnelle", "Garantie financière"] },
                          ];

                          let match = NAF_DB.find((n) => n.keywords.some((k) => desc.includes(k)));
                          if (!match) {
                            // Fallback: activité non réglementée générique
                            match = { keywords: [], code: "82.99Z", label: "Autres activités de soutien aux entreprises n.c.a.", reglemente: false, justifs: [] };
                          }

                          setAnswer("naf_code", match.code);
                          setAnswer("naf_label", match.label);
                          setAnswer("naf_reglemente", match.reglemente ? "oui" : "non");
                          setAnswer("naf_justifs", JSON.stringify(match.justifs));
                        }}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1D4ED8] transition-colors"
                      >
                        <Sparkles className="w-4 h-4" />
                        Détecter le code NAF et vérifier la réglementation
                      </button>
                    )}

                    {/* Résultat détection NAF */}
                    {answers.naf_code && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
                          <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-[#2563EB]" />
                            <p className="text-sm font-bold text-[#1E3A8A]">Résultat de l&apos;analyse</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Code NAF suggéré</p>
                              <p className="text-lg font-bold text-[#2563EB]">{answers.naf_code}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Libellé</p>
                              <p className="text-sm font-semibold text-[#1E3A8A]">{answers.naf_label}</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 italic">Le code NAF définitif sera attribué par l&apos;INSEE lors de l&apos;immatriculation.</p>
                        </div>

                        {/* Activité réglementée */}
                        {answers.naf_reglemente === "oui" ? (
                          <div className="bg-orange-50 border border-orange-300 rounded-xl p-5 space-y-3">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-orange-500" />
                              <p className="text-sm font-bold text-orange-800">Activité réglementée détectée</p>
                            </div>
                            <p className="text-sm text-orange-700">
                              L&apos;activité <strong>&quot;{answers.activite_principale_desc}&quot;</strong> est une activité réglementée. Les justificatifs suivants seront nécessaires pour votre immatriculation :
                            </p>
                            <ul className="space-y-2">
                              {(() => {
                                try {
                                  const justifs: string[] = JSON.parse(answers.naf_justifs || "[]");
                                  return justifs.map((j, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <FileText className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                      <span className="text-sm text-orange-800">{j}</span>
                                    </li>
                                  ));
                                } catch { return null; }
                              })()}
                            </ul>
                            <p className="text-xs text-orange-600 italic mt-2">Ces documents vous seront demandés à l&apos;étape &quot;Pièces justificatives&quot;.</p>
                          </div>
                        ) : (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <div className="flex items-center gap-2">
                              <Check className="w-5 h-5 text-green-600" />
                              <p className="text-sm font-semibold text-green-800">Activité non réglementée</p>
                            </div>
                            <p className="text-sm text-green-700 mt-1">Aucun justificatif spécifique n&apos;est requis pour cette activité. Vous pouvez continuer.</p>
                          </div>
                        )}

                        {/* Bouton réinitialiser */}
                        <button
                          onClick={() => {
                            setAnswer("naf_code", "");
                            setAnswer("naf_label", "");
                            setAnswer("naf_reglemente", "");
                            setAnswer("naf_justifs", "");
                          }}
                          className="text-sm text-[#2563EB] hover:underline"
                        >
                          Relancer l&apos;analyse
                        </button>
                      </motion.div>
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
                            "w-full flex items-center gap-4 p-5 rounded-xl border-2 bg-white text-left transition-all group",
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
                      <p className="text-sm text-gray-700">Une SASU ne comporte qu&apos;un seul associé, appelé <strong className="text-[#1E3A8A]">associé unique</strong>.</p>
                      <p className="text-sm text-gray-700">Veuillez renseigner :</p>
                      <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                        <li><em className="text-[#2563EB] font-medium">ses informations personnelles</em></li>
                        <li><em className="text-[#2563EB] font-medium">sa résidence fiscale</em></li>
                      </ul>
                      <p className="text-sm text-gray-700">Une fois les informations saisies, cliquez sur <strong>&quot;Valider&quot;</strong> pour enregistrer l&apos;associé unique.</p>
                    </div>

                    {/* Type d'associé */}
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-[#1E3A8A]">Type d&apos;associé :</p>
                      <div className="grid grid-cols-2 gap-3">
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
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nom</label>
                            <input
                              type="text"
                              value={answers.associe_nom || ""}
                              onChange={(e) => setAnswer("associe_nom", e.target.value)}
                              placeholder="Nom de famille"
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Prénom</label>
                            <input
                              type="text"
                              value={answers.associe_prenom || ""}
                              onChange={(e) => setAnswer("associe_prenom", e.target.value)}
                              placeholder="Prénom"
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Date de naissance</label>
                          <input
                            type="date"
                            value={answers.associe_date_naissance || ""}
                            onChange={(e) => setAnswer("associe_date_naissance", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Lieu de naissance</label>
                          <input
                            type="text"
                            value={answers.associe_lieu_naissance || ""}
                            onChange={(e) => setAnswer("associe_lieu_naissance", e.target.value)}
                            placeholder="Ville de naissance"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nationalité</label>
                          <input
                            type="text"
                            value={answers.associe_nationalite || ""}
                            onChange={(e) => setAnswer("associe_nationalite", e.target.value)}
                            placeholder="Ex : Française"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Adresse de résidence fiscale</label>
                          <input
                            type="text"
                            value={answers.associe_adresse || ""}
                            onChange={(e) => setAnswer("associe_adresse", e.target.value)}
                            placeholder="Adresse complète"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                          />
                        </div>
                      </div>
                    )}

                    {/* Formulaire associé morale */}
                    {answers.type_associe === "morale" && (
                      <div className="space-y-4 border-t border-gray-200 pt-5">
                        <div>
                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Dénomination de la société associée</label>
                          <input
                            type="text"
                            value={answers.associe_societe_nom || ""}
                            onChange={(e) => setAnswer("associe_societe_nom", e.target.value)}
                            placeholder="Nom de la société"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Forme juridique</label>
                          <input
                            type="text"
                            value={answers.associe_societe_forme || ""}
                            onChange={(e) => setAnswer("associe_societe_forme", e.target.value)}
                            placeholder="Ex : SAS, SARL, SA..."
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Numéro SIREN</label>
                          <input
                            type="text"
                            value={answers.associe_societe_siren || ""}
                            onChange={(e) => setAnswer("associe_societe_siren", e.target.value)}
                            placeholder="Ex : 123 456 789"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Adresse du siège de la société associée</label>
                          <input
                            type="text"
                            value={answers.associe_societe_adresse || ""}
                            onChange={(e) => setAnswer("associe_societe_adresse", e.target.value)}
                            placeholder="Adresse complète"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nom du représentant légal</label>
                          <input
                            type="text"
                            value={answers.associe_societe_representant || ""}
                            onChange={(e) => setAnswer("associe_societe_representant", e.target.value)}
                            placeholder="Nom et prénom du représentant"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                          />
                        </div>
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
                      <div className="grid grid-cols-2 gap-4">
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
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Montant minimum</label>
                          <input
                            type="number"
                            min="1"
                            value={answers.capital_minimum || ""}
                            onChange={(e) => setAnswer("capital_minimum", e.target.value)}
                            placeholder="Ex : 1 000"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Montant maximum</label>
                          <input
                            type="number"
                            min="1"
                            value={answers.capital_maximum || ""}
                            onChange={(e) => setAnswer("capital_maximum", e.target.value)}
                            placeholder="Ex : 100 000"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
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

                    {/* Montant du capital social section (actions_capital inline) */}
                    <div className="space-y-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">ACTIONS ET CAPITAL SOCIAL</p>

                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                        <p className="text-sm text-gray-700"><strong className="text-[#1E3A8A]">Montant du capital</strong> : somme totale apportée par les associés.</p>
                        <p className="text-sm text-gray-700"><strong className="text-[#1E3A8A]">Valeur unitaire d&apos;une action</strong> : prix de base d&apos;une action (souvent 1 € pour simplifier).</p>
                        <p className="text-sm text-gray-700"><strong className="text-[#1E3A8A]">Nombre d&apos;actions</strong> : calcul automatique = Montant du capital ÷ Valeur d&apos;une action.</p>
                        <p className="text-sm text-gray-700"><strong>Exemple</strong> : Capital 5 000 € / Valeur 1 € = 5 000 actions.</p>
                        <p className="text-sm text-[#2563EB] font-semibold">Veuillez remplir le montant de votre capital social et la valeur d&apos;une action souhaitée, le nombre d&apos;actions s&apos;ajustera automatiquement</p>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Montant total du capital social (€)</label>
                        <input
                          type="number"
                          min="1"
                          value={answers.capital_social || ""}
                          onChange={(e) => setAnswer("capital_social", e.target.value)}
                          placeholder="Ex : 12000"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Valeur unitaire d&apos;une action (€)</label>
                        <input
                          type="number"
                          min="1"
                          value={answers.valeur_action || "1"}
                          onChange={(e) => setAnswer("valeur_action", e.target.value)}
                          placeholder="1"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nombre total d&apos;actions</label>
                        <div className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800">
                          {((Number(answers.capital_social) || 0) / (Number(answers.valeur_action) || 1)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Formule simplifiée / personnalisée */}
                    <div>
                      <p className="text-sm font-bold text-[#1E3A8A] mb-3">Choix entre formule simplifiée ou personnalisée</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setAnswer("formule_capital", "simplifiee")}
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
                  </div>
                )}

                {/* ── Actions et capital social (personnalisée only) ── */}
                {POST_PAGES[postPage]?.id === "actions_capital" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-sm text-gray-700">Dans le parcours simplifié, la valeur d&apos;une action est fixée à 1 euro.</p>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Montant total du capital social (€)</label>
                        <input
                          type="number"
                          min="1"
                          value={answers.capital_social || "1"}
                          onChange={(e) => setAnswer("capital_social", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Valeur unitaire d&apos;une action (€)</label>
                        <input
                          type="number"
                          min="1"
                          value={answers.valeur_action || "1"}
                          onChange={(e) => setAnswer("valeur_action", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nombre total d&apos;actions</label>
                        <div className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800">
                          {((Number(answers.capital_social) || 1) / (Number(answers.valeur_action) || 1)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Apport de l'associé unique ── */}
                {POST_PAGES[postPage]?.id === "apport_associe" && (() => {
                  const capitalTotal = Number(answers.capital_social) || 0;
                  const apportNum = Number(answers.apport_numeraire) || 0;
                  const apportNature = Number(answers.apport_nature) || 0;
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
                      <div className="text-sm text-gray-600 space-y-2">
                        <p>Comment remplir la fiche apport de l&apos;associé unique ? Cliquez sur l&apos;associé, remplissez sa fiche d&apos;apport, puis validez le profil.</p>
                      </div>
                    </AccordionItem>

                    {answers.formule_capital === "simplifiee" && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                        <p className="text-sm text-gray-700">
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
                            {apportNature > 0 && (
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
                            )}
                            {answers.apport_industrie === "oui" && (
                              <motion.tr
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.35 }}
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
                            <motion.tr
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4 }}
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
                              transition={{ delay: 0.5 }}
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
                              transition={{ delay: 0.6 }}
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
                        <p className="text-sm text-yellow-800">
                          <strong>Attention</strong> — la répartition du capital social semble incohérente. Les apports intégrés au capital totalisent {totalApports.toLocaleString("fr-FR")} €, alors que le capital déclaré est {capitalTotal.toLocaleString("fr-FR")} € ({capitalTotal > 0 ? Math.round((totalApports / capitalTotal) * 100) : 0}%).
                        </p>
                        <p className="text-sm text-yellow-800">L&apos;apport doit être égale à 100% du capital social déclaré avant validation</p>
                        <p className="text-sm text-yellow-800 font-semibold">Deux options s&apos;offrent à vous :</p>
                        <p className="text-sm text-yellow-800"><strong>1 – Modifier la répartition du capital social</strong></p>
                        <p className="text-xs text-yellow-700">Si le montant de l&apos;apport est incorrect ou incomplet, dans ce cas il faut modifier l&apos;apport de l&apos;associé unique</p>
                        <p className="text-sm text-yellow-800"><strong>2 – Modifier le capital social</strong></p>
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
                        <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Apport en numéraire (€)</label>
                        <p className="text-xs text-gray-500 mb-2">Somme d&apos;argent effectivement déposée sur le compte bancaire dédié à la société.</p>
                        <input
                          type="number"
                          min="0"
                          value={answers.apport_numeraire || ""}
                          onChange={(e) => setAnswer("apport_numeraire", e.target.value)}
                          placeholder={String(capitalTotal) || "0"}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                        />
                      </div>

                      {answers.formule_capital === "personnalisee" && (
                        <>
                          {/* Apport en nature — PP et PM */}
                          <div>
                            <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Apport en nature (€)</label>
                            <p className="text-xs text-gray-500 mb-2">Biens matériels ou immatériels apportés à la société (véhicule, matériel, fonds de commerce, brevet, etc.).</p>
                            <input
                              type="number"
                              min="0"
                              value={answers.apport_nature || ""}
                              onChange={(e) => setAnswer("apport_nature", e.target.value)}
                              placeholder="0"
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                            />
                            {(Number(answers.apport_nature) || 0) > 0 && (
                              <div className="mt-2">
                                <label className="block text-xs font-semibold text-[#1E3A8A] mb-1">Description de l&apos;apport en nature</label>
                                <textarea
                                  value={answers.apport_nature_description || ""}
                                  onChange={(e) => setAnswer("apport_nature_description", e.target.value)}
                                  placeholder="Décrivez le(s) bien(s) apporté(s) : type, marque, estimation..."
                                  rows={3}
                                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 resize-none transition-all"
                                />
                              </div>
                            )}
                          </div>

                          {/* Apport en industrie — PP uniquement */}
                          {answers.type_associe !== "morale" && (
                            <div>
                              <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Apport en industrie</label>
                              <p className="text-xs text-gray-500 mb-2">
                                Mise à disposition de connaissances techniques, de travail ou de services. <strong>Attention :</strong> l&apos;apport en industrie ne concourt pas à la formation du capital social, mais donne droit à des actions.
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => setAnswer("apport_industrie", "oui")}
                                  className={cn(
                                    "flex items-center justify-center gap-2 p-4 rounded-xl border-2 text-sm font-medium transition-all",
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
                                    "flex items-center justify-center gap-2 p-4 rounded-xl border-2 text-sm font-medium transition-all",
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
                                  <label className="block text-xs font-semibold text-[#1E3A8A] mb-1">Description de l&apos;apport en industrie</label>
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

                          {/* Info PM: pas d'apport en industrie */}
                          {answers.type_associe === "morale" && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                              <p className="text-sm text-gray-700">
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
                      <div className="text-sm text-gray-600 space-y-2">
                        <p>Sélectionnez une personne</p>
                      </div>
                    </AccordionItem>

                    {/* Info block */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                      <p className="text-sm text-gray-700 text-justify">
                        Afin de compléter les informations légales relatives au Président, merci d&apos;indiquer les éléments de filiation ci-dessous et attester sur l&apos;honneur l&apos;absence de condamnation ou d&apos;interdiction de gérer de président. <em>(Ces informations sont requises pour les formalités d&apos;immatriculation au registre du commerce.)</em>
                      </p>
                    </div>

                    {/* Option 1 */}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-[#1E3A8A]">Option 1 : L&apos;associé unique est également Président</h3>
                      <p className="text-sm text-gray-600">C&apos;est la solution la plus courante : vous cumulez les fonctions d&apos;associé unique et de Président.</p>
                    </div>

                    {/* Option 2 */}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-[#2563EB]">Option 2 : Nommer un Président distinct</h3>
                      <p className="text-sm text-gray-600">Vous pouvez désigner une autre personne physique ou morale (par exemple un proche ou un partenaire professionnel) comme Président non associé.</p>
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
                          <p className="text-sm font-bold text-[#1E3A8A]">Type de profil :</p>
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

                        <div className="grid grid-cols-2 gap-3">
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
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Civilité</label>
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
                                <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nom</label>
                                <input type="text" value={answers.president_nom || ""} onChange={(e) => setAnswer("president_nom", e.target.value)} placeholder="Nom de famille" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Prénom</label>
                                <input type="text" value={answers.president_prenom || ""} onChange={(e) => setAnswer("president_prenom", e.target.value)} placeholder="Prénom" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Date de naissance</label>
                                <input type="date" value={answers.president_date_naissance || ""} onChange={(e) => setAnswer("president_date_naissance", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Lieu de naissance (ville)</label>
                                <input type="text" value={answers.president_lieu_naissance || ""} onChange={(e) => setAnswer("president_lieu_naissance", e.target.value)} placeholder="Ville de naissance" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nationalité</label>
                                <input type="text" value={answers.president_nationalite || ""} onChange={(e) => setAnswer("president_nationalite", e.target.value)} placeholder="Ex : Française" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Adresse personnelle</label>
                              <input type="text" value={answers.president_adresse || ""} onChange={(e) => setAnswer("president_adresse", e.target.value)} placeholder="Adresse complète" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                            </div>

                            {/* Filiation */}
                            <p className="text-sm font-bold text-[#1E3A8A] pt-2">Filiation</p>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nom du père</label>
                                <input type="text" value={answers.president_pere_nom || ""} onChange={(e) => setAnswer("president_pere_nom", e.target.value)} placeholder="Nom et prénom du père" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nom de la mère</label>
                                <input type="text" value={answers.president_mere_nom || ""} onChange={(e) => setAnswer("president_mere_nom", e.target.value)} placeholder="Nom et prénom de la mère" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                              </div>
                            </div>

                            {/* Non-condamnation */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" checked={answers.president_non_condamnation === "true"} onChange={(e) => setAnswer("president_non_condamnation", e.target.checked ? "true" : "")} className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" />
                                <span className="text-sm text-gray-700">J&apos;atteste sur l&apos;honneur ne pas avoir fait l&apos;objet d&apos;une condamnation pénale ou d&apos;une sanction civile ou administrative de nature à m&apos;interdire de gérer, d&apos;administrer ou de diriger une personne morale.</span>
                              </label>
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" checked={answers.president_non_interdiction === "true"} onChange={(e) => setAnswer("president_non_interdiction", e.target.checked ? "true" : "")} className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" />
                                <span className="text-sm text-gray-700">J&apos;atteste sur l&apos;honneur ne pas être frappé(e) d&apos;une mesure d&apos;interdiction de gérer prévue à l&apos;article L. 653-8 du Code de commerce.</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {/* ── Président PM : SIREN + infos + RP filiation + non-condamnation ── */}
                        {answers.president_type === "morale" && (
                          <div className="space-y-4 border-t border-gray-200 pt-5">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                              <p className="text-sm text-gray-700">Pour nommer un dirigeant personne morale non associé, indiquez directement le numéro RCS de la société. Nous pourrons ainsi la retrouver automatiquement dans le registre officiel et pré remplir ses informations (dénomination, adresse, dirigeants, etc.)</p>
                              <p className="text-sm text-gray-700">Vous trouverez ce numéro sur votre extrait Kbis.</p>
                              <p className="text-sm text-gray-700">Si vous ne le trouvez pas, vous pouvez tout de même remplir les informations manuellement.</p>
                              <div className="flex justify-end">
                                <button onClick={() => setAnswer("president_pm_mode", "manuel")} className="px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-sm font-semibold hover:opacity-90 transition-opacity">Remplir manuellement</button>
                              </div>
                            </div>

                            {/* SIREN search */}
                            <div>
                              <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Numéro SIREN</label>
                              <div className="flex gap-3">
                                <input type="text" value={answers.president_pm_siren || ""} onChange={(e) => setAnswer("president_pm_siren", e.target.value)} placeholder="Ex : 824330799" className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
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
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nom de la société</label>
                                    <input type="text" value={answers.president_pm_nom || ""} onChange={(e) => setAnswer("president_pm_nom", e.target.value)} placeholder="Ex : LAW AND CO" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Type de société</label>
                                    <input type="text" value={answers.president_pm_forme || ""} onChange={(e) => setAnswer("president_pm_forme", e.target.value)} placeholder="Ex : SASU" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Capital social</label>
                                    <input type="text" value={answers.president_pm_capital || ""} onChange={(e) => setAnswer("president_pm_capital", e.target.value)} placeholder="Ex : 100" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nom et prénom du représentant</label>
                                    <input type="text" value={answers.president_pm_representant || ""} onChange={(e) => setAnswer("president_pm_representant", e.target.value)} placeholder="Ex : Nora Gabsi" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Adresse</label>
                                    <input type="text" value={answers.president_pm_adresse || ""} onChange={(e) => setAnswer("president_pm_adresse", e.target.value)} placeholder="Ex : 7 RUE MEYERBEER" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Complément d&apos;adresse</label>
                                    <input type="text" value={answers.president_pm_adresse_complement || ""} onChange={(e) => setAnswer("president_pm_adresse_complement", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Ville RCS</label>
                                    <input type="text" value={answers.president_pm_ville_rcs || ""} onChange={(e) => setAnswer("president_pm_ville_rcs", e.target.value)} placeholder="Ex : PARIS" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Code postal</label>
                                    <input type="text" value={answers.president_pm_code_postal || ""} onChange={(e) => setAnswer("president_pm_code_postal", e.target.value)} placeholder="Ex : 75009" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
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
                                    <p className="text-sm font-bold text-[#1E3A8A]">Représentant permanent</p>
                                    <p className="text-sm text-gray-700">
                                      Lorsqu&apos;une société est nommée dirigeante, elle doit désigner une <strong>personne physique</strong> chargée de la représenter. Ce <em className="font-semibold text-[#2563EB]">représentant permanent</em> exerce les droits de la société dirigeante (signature, vote en assemblée). Ces informations seront inscrites dans les statuts et déclarées au greffe.
                                    </p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Civilité</label>
                                      <select value={answers.president_rp_civilite || ""} onChange={(e) => setAnswer("president_rp_civilite", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 bg-white transition-all">
                                        <option value="">Choisir</option>
                                        <option value="M.">M.</option>
                                        <option value="Mme">Mme</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nom</label>
                                      <input type="text" value={answers.president_rp_nom || ""} onChange={(e) => setAnswer("president_rp_nom", e.target.value)} placeholder="Nom de famille" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Prénom</label>
                                      <input type="text" value={answers.president_rp_prenom || ""} onChange={(e) => setAnswer("president_rp_prenom", e.target.value)} placeholder="Prénom" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Fonction dans la société</label>
                                      <select value={answers.president_rp_fonction || ""} onChange={(e) => setAnswer("president_rp_fonction", e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 bg-white transition-all">
                                        <option value="">Choisir</option>
                                        <option value="president">Président</option>
                                        <option value="dg">Directeur Général</option>
                                        <option value="gerant">Gérant</option>
                                        <option value="autre">Autre</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Adresse personnelle</label>
                                      <input type="text" value={answers.president_rp_adresse || ""} onChange={(e) => setAnswer("president_rp_adresse", e.target.value)} placeholder="Adresse complète" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nationalité</label>
                                      <input type="text" value={answers.president_rp_nationalite || ""} onChange={(e) => setAnswer("president_rp_nationalite", e.target.value)} placeholder="Ex : Française" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                    </div>
                                  </div>

                                  {/* Filiation du RP */}
                                  <p className="text-sm font-bold text-[#1E3A8A] pt-2">Filiation du représentant permanent</p>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nom du père</label>
                                      <input type="text" value={answers.president_rp_pere_nom || ""} onChange={(e) => setAnswer("president_rp_pere_nom", e.target.value)} placeholder="Nom et prénom du père" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nom de la mère</label>
                                      <input type="text" value={answers.president_rp_mere_nom || ""} onChange={(e) => setAnswer("president_rp_mere_nom", e.target.value)} placeholder="Nom et prénom de la mère" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                    </div>
                                  </div>

                                  {/* Non-condamnation du RP */}
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                      <input type="checkbox" checked={answers.president_rp_non_condamnation === "true"} onChange={(e) => setAnswer("president_rp_non_condamnation", e.target.checked ? "true" : "")} className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" />
                                      <span className="text-sm text-gray-700">J&apos;atteste sur l&apos;honneur ne pas avoir fait l&apos;objet d&apos;une condamnation pénale ou d&apos;une sanction civile ou administrative de nature à m&apos;interdire de gérer, d&apos;administrer ou de diriger une personne morale.</span>
                                    </label>
                                    <label className="flex items-start gap-3 cursor-pointer">
                                      <input type="checkbox" checked={answers.president_rp_non_interdiction === "true"} onChange={(e) => setAnswer("president_rp_non_interdiction", e.target.checked ? "true" : "")} className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" />
                                      <span className="text-sm text-gray-700">J&apos;atteste sur l&apos;honneur ne pas être frappé(e) d&apos;une mesure d&apos;interdiction de gérer prévue à l&apos;article L. 653-8 du Code de commerce.</span>
                                    </label>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ── Mandat du Président ── */}
                {POST_PAGES[postPage]?.id === "mandat_president" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>

                    <AccordionItem title="Plus d'informations">
                      <div className="text-sm text-gray-600 space-y-2">
                        <p>Même si la SASU n&apos;a qu&apos;un associé, il est utile de prévoir ces règles pour une éventuelle transformation en SAS.</p>
                      </div>
                    </AccordionItem>

                    {/* ── Majorité nomination/révocation ── */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-bold text-[#1E3A8A]">Pour les prochaines désignations de Président (en cas de changement), quelle majorité souhaitez-vous prévoir dans les statuts pour sa nomination et sa révocation ?</p>
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
                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Pourcentage de majorité renforcée (%)</label>
                          <input type="number" min="51" max="99" value={answers.majorite_president_pct || "66"} onChange={(e) => setAnswer("majorite_president_pct", e.target.value)} placeholder="66" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                        </div>
                      )}
                    </div>

                    <hr className="border-gray-200" />

                    {/* ── Révocation ── */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-bold text-[#1E3A8A]">Révocation du mandat du Président</p>
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
                        <p className="text-sm font-bold text-[#1E3A8A]">Durée du mandat du Président</p>
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
                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Durée du mandat (en années)</label>
                          <input type="number" min="1" max="99" value={answers.duree_mandat_annees || ""} onChange={(e) => setAnswer("duree_mandat_annees", e.target.value)} placeholder="Ex : 3" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                        </div>
                      )}
                    </div>

                    <hr className="border-gray-200" />

                    {/* ── Renouvellement ── */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-bold text-[#1E3A8A]">Renouvellement du mandat du Président</p>
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
                        <p className="text-sm font-bold text-[#1E3A8A]">Souhaitez-vous que le Président soit rémunéré pour ses fonctions ?</p>
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
                        <div className="text-sm text-gray-600 space-y-2">
                          <p><strong className="text-[#2563EB]">Le saviez-vous ?</strong> Le Président engage toujours la SASU vis-à-vis des tiers. Les limites éventuellement prévues dans les statuts n&apos;ont qu&apos;un effet interne : elles servent uniquement à encadrer ses pouvoirs vis-à-vis de l&apos;associé unique. <em className="text-[#2563EB] font-semibold">En cas de dépassement, la société reste engagée, mais le Président peut être sanctionné en interne.</em></p>
                        </div>
                      </AccordionItem>

                      <div>
                        <p className="text-sm font-bold text-[#1E3A8A]">Souhaitez-vous limiter certains pouvoirs du Président dans les statuts ?</p>
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
                            <p className="text-sm font-bold text-[#1E3A8A]">Limitation des pouvoirs du Président</p>
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
                            <p className="text-sm font-bold text-[#1E3A8A] mb-1">Montant de limitation :</p>
                            <p className="text-xs text-gray-500 mb-2">100 000 euros maximum</p>
                            <input type="number" min="1" max="100000" value={answers.montant_limitation || ""} onChange={(e) => setAnswer("montant_limitation", e.target.value)} placeholder="Ex : 12000" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                          </div>
                        </div>
                      )}
                    </div>

                    <hr className="border-gray-200" />

                    {/* ── Majorité décisions futures (entrée associés) ── */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-bold text-[#1E3A8A]">En cas d&apos;évolution de la société (entrée de nouveaux associés), ces décisions seront soumises à l&apos;approbation des associés, quelle majorité souhaitez-vous prévoir ?</p>
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
                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Pourcentage de majorité renforcée (%)</label>
                          <input type="number" min="51" max="99" value={answers.majorite_decisions_pct || "66"} onChange={(e) => setAnswer("majorite_decisions_pct", e.target.value)} placeholder="66" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Nomination DG / DGD ── */}
                {POST_PAGES[postPage]?.id === "nomination_dg" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>

                    <AccordionItem title="Plus d'informations">
                      <div className="text-sm text-gray-600 space-y-2">
                        <p>Sélectionnez une personne</p>
                      </div>
                    </AccordionItem>

                    {/* Info DG / DGD */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-2">
                      <p className="text-sm text-gray-700">
                        <strong>Pour information</strong> : le premier dirigeant nommé occupera la fonction de <strong>Directeur Général (DG)</strong>.
                      </p>
                      <p className="text-sm text-gray-700">
                        Si un second dirigeant est désigné, il sera <strong>Directeur Général Délégué (DGD)</strong>.
                      </p>
                    </div>

                    {/* Option 1 */}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-[#1E3A8A]">Option 1 : Choisissez une personne associée</h3>
                    </div>

                    {/* Option 2 */}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-[#2563EB]">Option 2 : Ajoutez une personne non associé</h3>
                    </div>

                    {/* Bouton ajouter dirigeant non associé */}
                    <button
                      onClick={() => {
                        const current = answers.dg_list ? JSON.parse(answers.dg_list) : [];
                        if (current.length >= 2) return; // max 2 (DG + DGD)
                        const newDg = { id: Date.now().toString(), type: "", option: "distinct" };
                        setAnswer("dg_list", JSON.stringify([...current, newDg]));
                        setAnswer("dg_editing", newDg.id);
                        setAnswer("dg_current_type", "");
                      }}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1D4ED8] transition-colors"
                    >
                      Ajoutez un dirigeant non associé <span className="text-lg">+</span>
                    </button>

                    {/* Liste des dirigeants ajoutés */}
                    {(() => {
                      const dgList: { id: string; type: string; option: string; nom?: string; prenom?: string; pm_nom?: string }[] = answers.dg_list ? JSON.parse(answers.dg_list) : [];
                      return dgList.map((dg, idx) => (
                        <div key={dg.id} className="space-y-4">
                          {/* Carte résumé */}
                          <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#2563EB] bg-[#EFF6FF]">
                            {dg.type === "morale" ? (
                              <Building2 className="w-6 h-6 text-[#2563EB]" />
                            ) : (
                              <User className="w-6 h-6 text-[#2563EB]" />
                            )}
                            <div className="flex-1">
                              <p className="font-bold text-[#1E3A8A]">
                                {dg.type === "morale"
                                  ? (dg.pm_nom || "Société")
                                  : [dg.prenom, dg.nom].filter(Boolean).join(" ") || "Nouveau dirigeant"}
                                {" "}
                                <span className="text-xs font-normal text-gray-500">
                                  ({idx === 0 ? "Le Directeur Général" : "Le Directeur Général Délégué"})
                                </span>
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                const updated = dgList.filter((d) => d.id !== dg.id);
                                setAnswer("dg_list", JSON.stringify(updated));
                                if (answers.dg_editing === dg.id) setAnswer("dg_editing", "");
                              }}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="w-5 h-5 text-red-400" />
                            </button>
                          </div>

                          {/* Formulaire si en édition */}
                          {answers.dg_editing === dg.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="border-2 border-gray-200 rounded-xl p-5 space-y-5"
                            >
                              <p className="text-sm font-bold text-[#1E3A8A]">Type de profil :</p>

                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => {
                                    const updated = dgList.map((d) => d.id === dg.id ? { ...d, type: "physique" } : d);
                                    setAnswer("dg_list", JSON.stringify(updated));
                                    setAnswer("dg_current_type", "physique");
                                  }}
                                  className={cn(
                                    "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                                    dg.type === "physique" ? "border-[#2563EB] bg-blue-50" : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                                  )}
                                >
                                  <User className="w-10 h-10 text-[#2563EB]" />
                                  <span className="text-sm font-medium text-[#2563EB]">Particulier (personne physique)</span>
                                </button>
                                <button
                                  onClick={() => {
                                    const updated = dgList.map((d) => d.id === dg.id ? { ...d, type: "morale" } : d);
                                    setAnswer("dg_list", JSON.stringify(updated));
                                    setAnswer("dg_current_type", "morale");
                                  }}
                                  className={cn(
                                    "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                                    dg.type === "morale" ? "border-[#2563EB] bg-blue-50" : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                                  )}
                                >
                                  <Building2 className="w-10 h-10 text-[#2563EB]" />
                                  <span className="text-sm font-medium text-[#2563EB]">Société (personne morale)</span>
                                </button>
                              </div>

                              {/* ── DG PP ── */}
                              {dg.type === "physique" && (
                                <div className="space-y-4 border-t border-gray-200 pt-5">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Civilité</label>
                                      <select value={answers[`dg_${dg.id}_civilite`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_civilite`, e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 bg-white transition-all">
                                        <option value="">Choisir</option>
                                        <option value="M.">M.</option>
                                        <option value="Mme">Mme</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nom</label>
                                      <input type="text" value={answers[`dg_${dg.id}_nom`] || ""} onChange={(e) => { setAnswer(`dg_${dg.id}_nom`, e.target.value); const updated = dgList.map((d) => d.id === dg.id ? { ...d, nom: e.target.value } : d); setAnswer("dg_list", JSON.stringify(updated)); }} placeholder="Nom de famille" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Prénom</label>
                                      <input type="text" value={answers[`dg_${dg.id}_prenom`] || ""} onChange={(e) => { setAnswer(`dg_${dg.id}_prenom`, e.target.value); const updated = dgList.map((d) => d.id === dg.id ? { ...d, prenom: e.target.value } : d); setAnswer("dg_list", JSON.stringify(updated)); }} placeholder="Prénom" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Date de naissance</label>
                                      <input type="date" value={answers[`dg_${dg.id}_date_naissance`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_date_naissance`, e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Lieu de naissance (ville)</label>
                                      <input type="text" value={answers[`dg_${dg.id}_lieu_naissance`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_lieu_naissance`, e.target.value)} placeholder="Ville de naissance" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nationalité</label>
                                      <input type="text" value={answers[`dg_${dg.id}_nationalite`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_nationalite`, e.target.value)} placeholder="Ex : Française" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Adresse personnelle</label>
                                    <input type="text" value={answers[`dg_${dg.id}_adresse`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_adresse`, e.target.value)} placeholder="Adresse complète" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                  </div>

                                  {/* Filiation */}
                                  <p className="text-sm font-bold text-[#1E3A8A] pt-2">Filiation</p>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nom du père</label>
                                      <input type="text" value={answers[`dg_${dg.id}_pere_nom`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_pere_nom`, e.target.value)} placeholder="Nom et prénom du père" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nom de la mère</label>
                                      <input type="text" value={answers[`dg_${dg.id}_mere_nom`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_mere_nom`, e.target.value)} placeholder="Nom et prénom de la mère" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                    </div>
                                  </div>

                                  {/* Non-condamnation */}
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                      <input type="checkbox" checked={answers[`dg_${dg.id}_non_condamnation`] === "true"} onChange={(e) => setAnswer(`dg_${dg.id}_non_condamnation`, e.target.checked ? "true" : "")} className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" />
                                      <span className="text-sm text-gray-700">J&apos;atteste sur l&apos;honneur ne pas avoir fait l&apos;objet d&apos;une condamnation pénale ou d&apos;une sanction civile ou administrative de nature à m&apos;interdire de gérer, d&apos;administrer ou de diriger une personne morale.</span>
                                    </label>
                                    <label className="flex items-start gap-3 cursor-pointer">
                                      <input type="checkbox" checked={answers[`dg_${dg.id}_non_interdiction`] === "true"} onChange={(e) => setAnswer(`dg_${dg.id}_non_interdiction`, e.target.checked ? "true" : "")} className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" />
                                      <span className="text-sm text-gray-700">J&apos;atteste sur l&apos;honneur ne pas être frappé(e) d&apos;une mesure d&apos;interdiction de gérer prévue à l&apos;article L. 653-8 du Code de commerce.</span>
                                    </label>
                                  </div>

                                  {/* Valider */}
                                  <button
                                    onClick={() => setAnswer("dg_editing", "")}
                                    className="w-full py-3 rounded-xl bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1D4ED8] transition-colors"
                                  >
                                    Valider ce dirigeant
                                  </button>
                                </div>
                              )}

                              {/* ── DG PM ── */}
                              {dg.type === "morale" && (
                                <div className="space-y-4 border-t border-gray-200 pt-5">
                                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                                    <p className="text-sm text-gray-700">Pour nommer un dirigeant personne morale, indiquez directement le numéro RCS de la société.</p>
                                    <p className="text-sm text-gray-700">Vous trouverez ce numéro sur votre extrait Kbis.</p>
                                    <p className="text-sm text-gray-700">Si vous ne le trouvez pas, vous pouvez remplir les informations manuellement.</p>
                                    <div className="flex justify-end">
                                      <button onClick={() => setAnswer(`dg_${dg.id}_pm_mode`, "manuel")} className="px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-sm font-semibold hover:opacity-90 transition-opacity">Remplir manuellement</button>
                                    </div>
                                  </div>

                                  {/* SIREN */}
                                  <div>
                                    <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Numéro SIREN</label>
                                    <div className="flex gap-3">
                                      <input type="text" value={answers[`dg_${dg.id}_pm_siren`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_pm_siren`, e.target.value)} placeholder="Ex : 824330799" className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                      <button
                                        onClick={async () => {
                                          const siren = (answers[`dg_${dg.id}_pm_siren`] || "").replace(/\s/g, "");
                                          if (siren.length !== 9) return;
                                          try {
                                            const res = await fetch(`/api/siren?siren=${siren}`);
                                            if (res.ok) {
                                              const data = await res.json();
                                              setAnswer(`dg_${dg.id}_pm_nom`, data.denominationSociale || "");
                                              setAnswer(`dg_${dg.id}_pm_forme`, data.formeJuridique || "");
                                              setAnswer(`dg_${dg.id}_pm_capital`, data.capitalSocial || "");
                                              setAnswer(`dg_${dg.id}_pm_representant`, data.representant || "");
                                              setAnswer(`dg_${dg.id}_pm_adresse`, [data.siegeSocial, data.codePostal, data.ville].filter(Boolean).join(", "));
                                              setAnswer(`dg_${dg.id}_pm_ville_rcs`, data.ville || "");
                                              setAnswer(`dg_${dg.id}_pm_code_postal`, data.codePostal || "");
                                              setAnswer(`dg_${dg.id}_pm_mode`, "siren");
                                              const updated = dgList.map((d) => d.id === dg.id ? { ...d, pm_nom: data.denominationSociale || "" } : d);
                                              setAnswer("dg_list", JSON.stringify(updated));
                                            }
                                          } catch { /* ignore */ }
                                        }}
                                        disabled={!answers[`dg_${dg.id}_pm_siren`] || (answers[`dg_${dg.id}_pm_siren`] || "").replace(/\s/g, "").length !== 9}
                                        className="px-6 py-3 rounded-xl bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1D4ED8] disabled:bg-[#9CA3AF] transition-colors"
                                      >Confirmer mon Numéro</button>
                                    </div>
                                  </div>

                                  {/* Infos entreprise */}
                                  {(answers[`dg_${dg.id}_pm_mode`] === "siren" || answers[`dg_${dg.id}_pm_mode`] === "manuel") && (
                                    <div className="space-y-4 border-t border-gray-200 pt-4">
                                      <p className="text-sm font-bold text-[#2563EB]">Informations entreprise</p>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nom de la société</label>
                                          <input type="text" value={answers[`dg_${dg.id}_pm_nom`] || ""} onChange={(e) => { setAnswer(`dg_${dg.id}_pm_nom`, e.target.value); const updated = dgList.map((d) => d.id === dg.id ? { ...d, pm_nom: e.target.value } : d); setAnswer("dg_list", JSON.stringify(updated)); }} placeholder="Ex : LAW AND CO" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Type de société</label>
                                          <input type="text" value={answers[`dg_${dg.id}_pm_forme`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_pm_forme`, e.target.value)} placeholder="Ex : SASU" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Capital social</label>
                                          <input type="text" value={answers[`dg_${dg.id}_pm_capital`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_pm_capital`, e.target.value)} placeholder="Ex : 100" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nom et prénom du représentant</label>
                                          <input type="text" value={answers[`dg_${dg.id}_pm_representant`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_pm_representant`, e.target.value)} placeholder="Ex : Nora Gabsi" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Adresse</label>
                                          <input type="text" value={answers[`dg_${dg.id}_pm_adresse`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_pm_adresse`, e.target.value)} placeholder="Ex : 7 RUE MEYERBEER" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Complément d&apos;adresse</label>
                                          <input type="text" value={answers[`dg_${dg.id}_pm_adresse_complement`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_pm_adresse_complement`, e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Ville RCS</label>
                                          <input type="text" value={answers[`dg_${dg.id}_pm_ville_rcs`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_pm_ville_rcs`, e.target.value)} placeholder="Ex : PARIS" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Code postal</label>
                                          <input type="text" value={answers[`dg_${dg.id}_pm_code_postal`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_pm_code_postal`, e.target.value)} placeholder="Ex : 75009" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                        </div>
                                      </div>

                                      {/* Représentant permanent + filiation + non-condamnation */}
                                      <div className="border border-gray-200 rounded-xl p-5 space-y-4">
                                        <h4 className="text-base font-bold text-[#1E3A8A]">Représentant permanent de la société dirigeante</h4>
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                          <p className="text-sm text-gray-700">Lorsqu&apos;une société est nommée dirigeante, elle doit désigner une <strong>personne physique</strong> chargée de la représenter. Ce <em className="font-semibold text-[#2563EB]">représentant permanent</em> exerce les droits de la société dirigeante.</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Civilité</label>
                                            <select value={answers[`dg_${dg.id}_rp_civilite`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_rp_civilite`, e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 bg-white transition-all">
                                              <option value="">Choisir</option>
                                              <option value="M.">M.</option>
                                              <option value="Mme">Mme</option>
                                            </select>
                                          </div>
                                          <div>
                                            <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nom</label>
                                            <input type="text" value={answers[`dg_${dg.id}_rp_nom`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_rp_nom`, e.target.value)} placeholder="Nom de famille" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Prénom</label>
                                            <input type="text" value={answers[`dg_${dg.id}_rp_prenom`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_rp_prenom`, e.target.value)} placeholder="Prénom" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                          </div>
                                          <div>
                                            <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Fonction dans la société</label>
                                            <select value={answers[`dg_${dg.id}_rp_fonction`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_rp_fonction`, e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 bg-white transition-all">
                                              <option value="">Choisir</option>
                                              <option value="president">Président</option>
                                              <option value="dg">Directeur Général</option>
                                              <option value="gerant">Gérant</option>
                                              <option value="autre">Autre</option>
                                            </select>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Adresse personnelle</label>
                                            <input type="text" value={answers[`dg_${dg.id}_rp_adresse`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_rp_adresse`, e.target.value)} placeholder="Adresse complète" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                          </div>
                                          <div>
                                            <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nationalité</label>
                                            <input type="text" value={answers[`dg_${dg.id}_rp_nationalite`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_rp_nationalite`, e.target.value)} placeholder="Ex : Française" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                          </div>
                                        </div>

                                        {/* Filiation RP */}
                                        <p className="text-sm font-bold text-[#1E3A8A] pt-2">Filiation du représentant permanent</p>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nom du père</label>
                                            <input type="text" value={answers[`dg_${dg.id}_rp_pere_nom`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_rp_pere_nom`, e.target.value)} placeholder="Nom et prénom du père" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                          </div>
                                          <div>
                                            <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nom de la mère</label>
                                            <input type="text" value={answers[`dg_${dg.id}_rp_mere_nom`] || ""} onChange={(e) => setAnswer(`dg_${dg.id}_rp_mere_nom`, e.target.value)} placeholder="Nom et prénom de la mère" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                          </div>
                                        </div>

                                        {/* Non-condamnation RP */}
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
                                          <label className="flex items-start gap-3 cursor-pointer">
                                            <input type="checkbox" checked={answers[`dg_${dg.id}_rp_non_condamnation`] === "true"} onChange={(e) => setAnswer(`dg_${dg.id}_rp_non_condamnation`, e.target.checked ? "true" : "")} className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" />
                                            <span className="text-sm text-gray-700">J&apos;atteste sur l&apos;honneur ne pas avoir fait l&apos;objet d&apos;une condamnation pénale ou d&apos;une sanction civile ou administrative de nature à m&apos;interdire de gérer, d&apos;administrer ou de diriger une personne morale.</span>
                                          </label>
                                          <label className="flex items-start gap-3 cursor-pointer">
                                            <input type="checkbox" checked={answers[`dg_${dg.id}_rp_non_interdiction`] === "true"} onChange={(e) => setAnswer(`dg_${dg.id}_rp_non_interdiction`, e.target.checked ? "true" : "")} className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" />
                                            <span className="text-sm text-gray-700">J&apos;atteste sur l&apos;honneur ne pas être frappé(e) d&apos;une mesure d&apos;interdiction de gérer prévue à l&apos;article L. 653-8 du Code de commerce.</span>
                                          </label>
                                        </div>
                                      </div>

                                      {/* Valider */}
                                      <button
                                        onClick={() => setAnswer("dg_editing", "")}
                                        className="w-full py-3 rounded-xl bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1D4ED8] transition-colors"
                                      >
                                        Valider ce dirigeant
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>
                      ));
                    })()}

                    {/* Message si pas encore de DG */}
                    {(!answers.dg_list || JSON.parse(answers.dg_list).length === 0) && (
                      <p className="text-sm text-gray-400 italic text-center">Vous pouvez passer cette étape si vous ne souhaitez pas nommer de DG/DGD.</p>
                    )}
                  </div>
                )}

                {/* ── Dépôt du capital ── */}
                {POST_PAGES[postPage]?.id === "depot_capital" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-bold text-[#1E3A8A] mb-1">
                          Dans quel établissement bancaire avez-vous déposé le capital ?
                        </label>
                        <input
                          type="text"
                          value={answers.banque_depot || ""}
                          onChange={(e) => setAnswer("banque_depot", e.target.value)}
                          placeholder="Nom de la banque / néobanque"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#1E3A8A] mb-1">
                          À quelle date le dépôt a-t-il été effectué ?
                        </label>
                        <input
                          type="date"
                          value={answers.date_depot || ""}
                          onChange={(e) => setAnswer("date_depot", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                        />
                      </div>

                      {/* État du versement — formule personnalisée */}
                      {answers.formule_capital === "personnalisee" && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-bold text-[#1E3A8A] mb-1">
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
                              <label className="block text-sm font-bold text-[#1E3A8A] mb-1">
                                Pourcentage versé (%)
                              </label>
                              <p className="text-xs text-gray-500 mb-2">Minimum légal : 50 % du montant des apports en numéraire</p>
                              <input
                                type="number"
                                min="50"
                                max="99"
                                value={answers.pourcentage_verse || "50"}
                                onChange={(e) => setAnswer("pourcentage_verse", e.target.value)}
                                placeholder="50"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
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

                {/* ── Régime fiscal ── */}
                {POST_PAGES[postPage]?.id === "regime_fiscal" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>
                    {QUESTIONS[10].info && (
                      <AccordionItem title={QUESTIONS[10].info.title}>
                        <div className="text-sm text-gray-600">{QUESTIONS[10].info.content}</div>
                      </AccordionItem>
                    )}
                    <div className="space-y-3">
                      {QUESTIONS[10].choices?.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setAnswer("regime_fiscal", c.value)}
                          className={cn(
                            "w-full flex items-center gap-4 p-5 rounded-xl border-2 bg-white text-left transition-all group",
                            answers.regime_fiscal === c.value
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

                {/* ── Page: Adresse siège social ── */}
                {POST_PAGES[postPage]?.id === "adresse_siege" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>

                    <AccordionItem title="Plus d'informations">
                      <div className="text-sm text-gray-600 space-y-2">
                        <p className="font-bold text-[#1E3A8A]">Le saviez-vous ?</p>
                        <p>Tout siège social doit être déclaré avec une adresse précise et un justificatif de jouissance légale des locaux. Cette adresse détermine la nationalité de la société, sa juridiction compétente (greffe, impôts, URSSAF...) et doit figurer dans les statuts.</p>
                      </div>
                    </AccordionItem>

                    {/* Type d'hébergement */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => setAnswer("siege_type", "domicile")}
                        className={cn(
                          "text-left rounded-xl border-2 p-5 transition-all space-y-1",
                          answers.siege_type === "domicile"
                            ? "border-[#2563EB] bg-[#EFF6FF]"
                            : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                        )}
                      >
                        <p className="text-sm font-semibold text-[#2563EB]">Au domicile de l&apos;associé unique ou d&apos;un dirigeant</p>
                        <p className="text-xs text-gray-500 italic">Possible si aucun texte (bail, règlement de copropriété) ne s&apos;y oppose.</p>
                      </button>
                      <button
                        onClick={() => setAnswer("siege_type", "local_commercial")}
                        className={cn(
                          "text-left rounded-xl border-2 p-5 transition-all space-y-1",
                          answers.siege_type === "local_commercial"
                            ? "border-[#2563EB] bg-[#EFF6FF]"
                            : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                        )}
                      >
                        <p className="text-sm font-semibold text-[#2563EB]">Dans un local professionnel ou commercial loué par la société</p>
                        <p className="text-xs text-gray-500 italic">Bureaux, boutique, entrepôt, coworking, etc.</p>
                      </button>
                      <button
                        onClick={() => setAnswer("siege_type", "local_gratuit")}
                        className={cn(
                          "text-left rounded-xl border-2 p-5 transition-all space-y-1",
                          answers.siege_type === "local_gratuit"
                            ? "border-[#2563EB] bg-[#EFF6FF]"
                            : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                        )}
                      >
                        <p className="text-sm font-semibold text-[#2563EB]">Dans un local mis à disposition gratuitement (par un tiers)</p>
                        <p className="text-xs text-gray-500 italic">Ex : pièce prêtée par un proche ou une entreprise sans contrepartie.</p>
                      </button>
                      <button
                        onClick={() => setAnswer("siege_type", "domiciliation")}
                        className={cn(
                          "text-left rounded-xl border-2 p-5 transition-all space-y-1",
                          answers.siege_type === "domiciliation"
                            ? "border-[#2563EB] bg-[#EFF6FF]"
                            : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                        )}
                      >
                        <p className="text-sm font-semibold text-[#2563EB]">Via une société de domiciliation commerciale agréée</p>
                        <p className="text-xs text-gray-500 italic">Exemples : Regus, Sofradom, Kandbaz, etc.</p>
                      </button>
                      <button
                        onClick={() => setAnswer("siege_type", "partenaire")}
                        className={cn(
                          "text-left rounded-xl border-2 p-5 transition-all space-y-1 md:col-span-2",
                          answers.siege_type === "partenaire"
                            ? "border-[#2563EB] bg-[#EFF6FF]"
                            : "border-gray-200 bg-white hover:border-[#2563EB]/50"
                        )}
                      >
                        <p className="text-sm font-semibold text-[#2563EB]">Je souhaite être mis en contact avec une société de domiciliation partenaire</p>
                        <p className="text-xs text-gray-500 italic">Notre équipe vous proposera une solution adaptée.</p>
                      </button>
                    </div>

                    {/* Adresse du siège */}
                    {answers.siege_type && answers.siege_type !== "partenaire" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 border-t border-gray-200 pt-5"
                      >
                        <p className="text-base font-bold text-[#1E3A8A]">Adresse du siège social</p>
                        <div>
                          <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Adresse (numéro et rue)</label>
                          <input
                            type="text"
                            value={answers.adresse_siege || ""}
                            onChange={(e) => setAnswer("adresse_siege", e.target.value)}
                            placeholder="Ex : 12 rue de la Paix"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Code postal</label>
                            <input
                              type="text"
                              value={answers.siege_code_postal || ""}
                              onChange={(e) => setAnswer("siege_code_postal", e.target.value)}
                              placeholder="Ex : 75001"
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Ville</label>
                            <input
                              type="text"
                              value={answers.siege_ville || ""}
                              onChange={(e) => setAnswer("siege_ville", e.target.value)}
                              placeholder="Ex : Paris"
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                            />
                          </div>
                        </div>

                        {/* Info contextuelle selon le type */}
                        {answers.siege_type === "domicile" && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                            <p className="text-sm text-gray-700"><strong className="text-yellow-700">Rappel :</strong> la domiciliation au domicile personnel est possible pour une durée maximale de <strong>5 ans</strong> si le bail ou le règlement de copropriété l&apos;interdit. Pensez à vérifier votre bail.</p>
                          </div>
                        )}
                        {answers.siege_type === "domiciliation" && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-sm text-gray-700"><strong className="text-[#2563EB]">Important :</strong> un justificatif du contrat de domiciliation sera à fournir dans la partie &quot;Pièces justificatives&quot;.</p>
                          </div>
                        )}
                        {answers.siege_type === "local_gratuit" && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-sm text-gray-700"><strong className="text-[#2563EB]">Important :</strong> une attestation de mise à disposition gratuite signée par le propriétaire sera à fournir.</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {answers.siege_type === "partenaire" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50 border border-blue-200 rounded-xl p-5"
                      >
                        <p className="text-sm text-gray-700">Notre équipe vous contactera après validation de votre dossier pour vous proposer une solution de domiciliation adaptée à vos besoins et à votre budget.</p>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ── Page: RBE — Bénéficiaires effectifs ── */}
                {POST_PAGES[postPage]?.id === "rbe" && (() => {
                  // Auto-detect: en SASU, l'associé unique détient 100% donc toujours >25%
                  const isAssociePP = answers.type_associe === "physique";
                  const isAssociePM = answers.type_associe === "morale";
                  const associeName = isAssociePP
                    ? [answers.associe_prenom, answers.associe_nom].filter(Boolean).join(" ") || "L'associé unique"
                    : answers.associe_societe_nom || "La société associée";

                  // Pour une PM: aucun associé PP >25% détecté → le bénéficiaire effectif est le Président (contrôle effectif)
                  const presidentName = [answers.president_prenom, answers.president_nom].filter(Boolean).join(" ") || "Le Président";

                  // Parse rbe_list
                  const rbeList: { id: string; nom: string; prenom: string; date_naissance: string; lieu_naissance: string; nationalite: string; adresse: string; date_debut: string; modalite: string }[] = answers.rbe_list ? JSON.parse(answers.rbe_list) : [];

                  return (
                    <div className="space-y-6">
                      <div className="text-center space-y-1">
                        <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                      </div>

                      <AccordionItem title="Plus d'informations">
                        <div className="text-sm text-gray-600 space-y-3">
                          <p className="font-bold text-[#1E3A8A]">Qu&apos;est-ce que la déclaration des bénéficiaires effectifs (RBE) ?</p>
                          <p>En application de la loi anti-blanchiment, toute société doit déclarer les <strong>personnes physiques</strong> qui détiennent, directement ou indirectement, <strong>plus de 25 % du capital ou des droits de vote</strong>.</p>
                          <p>Si aucune personne physique ne dépasse ce seuil, le <strong>représentant légal</strong> (le Président) est déclaré comme bénéficiaire effectif par défaut.</p>
                          <p>Lorsque l&apos;associé unique est une <strong>personne morale</strong>, il faut identifier la personne physique qui contrôle cette société (dirigeant ou actionnaire majoritaire).</p>
                        </div>
                      </AccordionItem>

                      {/* Détection automatique */}
                      <div className="space-y-4">
                        <h3 className="text-base font-bold text-[#1E3A8A]">Option 1 : Choisissez une personne associée</h3>

                        {isAssociePP && (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                            <p className="text-sm text-gray-700">
                              <strong className="text-green-700">Détection automatique :</strong> {associeName} détient <strong>100 %</strong> du capital et des droits de vote (supérieur à 25 %).
                            </p>
                            <p className="text-sm text-gray-500 italic">
                              En tant qu&apos;associé unique (personne physique), il/elle est automatiquement déclaré(e) bénéficiaire effectif.
                            </p>
                          </div>
                        )}

                        {isAssociePM && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                            <p className="text-sm text-gray-700">
                              <strong className="text-amber-700">Associé unique = Personne Morale :</strong> {associeName} détient 100 % du capital.
                            </p>
                            <p className="text-sm text-gray-700">
                              Aucun associé détenant plus de 25 % du capital ou des droits de vote n&apos;a été détecté.
                            </p>
                            <p className="text-sm text-gray-700">
                              Dans ce cas, le bénéficiaire effectif est <strong className="text-[#1E3A8A]">la personne exercant le contrôle effectif</strong>, c&apos;est-à-dire le Président. En effet, le <strong className="text-[#2563EB]">Président</strong> est considéré comme bénéficiaire effectif par défaut lorsque personne ne détient plus de 25 % du capital.
                            </p>
                          </div>
                        )}

                        {/* Carte du bénéficiaire détecté */}
                        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#2563EB] bg-[#EFF6FF]">
                          {isAssociePM ? (
                            <Building2 className="w-6 h-6 text-[#2563EB]" />
                          ) : (
                            <User className="w-6 h-6 text-[#2563EB]" />
                          )}
                          <div className="flex-1">
                            <p className="font-bold text-[#1E3A8A]">
                              {isAssociePM ? `${associeName} (Le Président)` : associeName}
                              <span className="text-xs font-normal text-gray-500 ml-2">
                                {isAssociePP ? "100 % — associé unique" : "Contrôle effectif — Président"}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Date de début */}
                      <div className="border-t border-gray-200 pt-5 space-y-5">
                        <div className="bg-white border-2 border-gray-200 rounded-xl p-5 space-y-4">
                          <div className="flex items-start gap-3">
                            <Edit3 className="w-5 h-5 text-[#2563EB] mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-bold text-[#1E3A8A]">{isAssociePM ? associeName : associeName}</p>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-[#1E3A8A] mb-1">
                              Quelle est la date de début de votre statut de bénéficiaire effectif ?
                            </label>
                            <p className="text-xs text-gray-500 mb-2">Cette date est identique à la date de signature des statuts lors de la création de la société.</p>
                            <input
                              type="date"
                              value={answers.rbe_date_debut || ""}
                              onChange={(e) => setAnswer("rbe_date_debut", e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-[#1E3A8A] mb-1">
                              Modalités du contrôle exercé
                            </label>
                            <div className="space-y-2">
                              <button
                                onClick={() => setAnswer("rbe_modalite", "capital")}
                                className={cn(
                                  "w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all",
                                  answers.rbe_modalite === "capital"
                                    ? "border-[#2563EB] bg-[#EFF6FF] font-medium text-[#2563EB]"
                                    : "border-gray-200 bg-white hover:border-[#2563EB]/50 text-gray-700"
                                )}
                              >
                                Détention de plus de 25 % du capital
                              </button>
                              <button
                                onClick={() => setAnswer("rbe_modalite", "droits_vote")}
                                className={cn(
                                  "w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all",
                                  answers.rbe_modalite === "droits_vote"
                                    ? "border-[#2563EB] bg-[#EFF6FF] font-medium text-[#2563EB]"
                                    : "border-gray-200 bg-white hover:border-[#2563EB]/50 text-gray-700"
                                )}
                              >
                                Détention de plus de 25 % des droits de vote
                              </button>
                              <button
                                onClick={() => setAnswer("rbe_modalite", "controle_effectif")}
                                className={cn(
                                  "w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all",
                                  answers.rbe_modalite === "controle_effectif"
                                    ? "border-[#2563EB] bg-[#EFF6FF] font-medium text-[#2563EB]"
                                    : "border-gray-200 bg-white hover:border-[#2563EB]/50 text-gray-700"
                                )}
                              >
                                Contrôle effectif (représentant légal par défaut)
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Étape 2 : Ajouter bénéficiaire supplémentaire */}
                      <div className="space-y-3">
                        <h3 className="text-base font-bold text-[#1E3A8A]">Étape 2 : Remplissez et validez la fiche RBE de chaque associé</h3>

                        <button
                          onClick={() => {
                            const newBe = { id: Date.now().toString(), nom: "", prenom: "", date_naissance: "", lieu_naissance: "", nationalite: "", adresse: "", date_debut: "", modalite: "" };
                            setAnswer("rbe_list", JSON.stringify([...rbeList, newBe]));
                            setAnswer("rbe_editing", newBe.id);
                          }}
                          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1D4ED8] transition-colors"
                        >
                          Ajouter un bénéficiaire effectif supplémentaire <span className="text-lg">+</span>
                        </button>

                        {/* Liste des bénéficiaires supplémentaires */}
                        {rbeList.map((be) => (
                          <div key={be.id} className="space-y-3">
                            <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#2563EB] bg-[#EFF6FF]">
                              <User className="w-6 h-6 text-[#2563EB]" />
                              <div className="flex-1">
                                <p className="font-bold text-[#1E3A8A]">
                                  {[be.prenom, be.nom].filter(Boolean).join(" ") || "Nouveau bénéficiaire"}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  const updated = rbeList.filter((b) => b.id !== be.id);
                                  setAnswer("rbe_list", JSON.stringify(updated));
                                  if (answers.rbe_editing === be.id) setAnswer("rbe_editing", "");
                                }}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-5 h-5 text-red-400" />
                              </button>
                            </div>

                            {answers.rbe_editing === be.id && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="border-2 border-gray-200 rounded-xl p-5 space-y-4"
                              >
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nom</label>
                                    <input type="text" value={be.nom} onChange={(e) => { const updated = rbeList.map((b) => b.id === be.id ? { ...b, nom: e.target.value } : b); setAnswer("rbe_list", JSON.stringify(updated)); }} placeholder="Nom" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Prénom</label>
                                    <input type="text" value={be.prenom} onChange={(e) => { const updated = rbeList.map((b) => b.id === be.id ? { ...b, prenom: e.target.value } : b); setAnswer("rbe_list", JSON.stringify(updated)); }} placeholder="Prénom" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Date de naissance</label>
                                    <input type="date" value={be.date_naissance} onChange={(e) => { const updated = rbeList.map((b) => b.id === be.id ? { ...b, date_naissance: e.target.value } : b); setAnswer("rbe_list", JSON.stringify(updated)); }} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Lieu de naissance</label>
                                    <input type="text" value={be.lieu_naissance} onChange={(e) => { const updated = rbeList.map((b) => b.id === be.id ? { ...b, lieu_naissance: e.target.value } : b); setAnswer("rbe_list", JSON.stringify(updated)); }} placeholder="Ville" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Nationalité</label>
                                    <input type="text" value={be.nationalite} onChange={(e) => { const updated = rbeList.map((b) => b.id === be.id ? { ...b, nationalite: e.target.value } : b); setAnswer("rbe_list", JSON.stringify(updated)); }} placeholder="Ex : Française" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-bold text-[#1E3A8A] mb-1">Adresse</label>
                                    <input type="text" value={be.adresse} onChange={(e) => { const updated = rbeList.map((b) => b.id === be.id ? { ...b, adresse: e.target.value } : b); setAnswer("rbe_list", JSON.stringify(updated)); }} placeholder="Adresse complète" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm text-gray-800 transition-all" />
                                  </div>
                                </div>
                                <button
                                  onClick={() => setAnswer("rbe_editing", "")}
                                  className="w-full py-3 rounded-xl bg-[#2563EB] text-white font-semibold text-sm hover:bg-[#1D4ED8] transition-colors"
                                >
                                  Valider ce bénéficiaire
                                </button>
                              </motion.div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* ── Page 9: Président rémunéré ── */}
                {POST_PAGES[postPage]?.id === "president_remunere" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Création d&apos;une SASU</h2>
                    </div>
                    {QUESTIONS[12].info && (
                      <AccordionItem title={QUESTIONS[12].info.title}>
                        <div className="text-sm text-gray-600">{QUESTIONS[12].info.content}</div>
                      </AccordionItem>
                    )}
                    <div className="space-y-3">
                      {QUESTIONS[12].choices?.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setAnswer("president_remunere", c.value)}
                          className={cn(
                            "w-full flex items-center gap-4 p-5 rounded-xl border-2 bg-white text-left transition-all group",
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
                        setPostPage((p) => p - 1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      } else {
                        setPhase("pricing");
                      }
                    }}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={() => {
                      if (postPage < POST_PAGES.length - 1) {
                        const currentId = POST_PAGES[postPage]?.id;
                        const nextId = POST_PAGES[postPage + 1]?.id;

                        // If on regles_statutaires and chose "defaut", skip to date_cloture (jump past services_comptables stays)
                        // If on services_comptables and regles = defaut, skip all detailed pages → go to denomination
                        // (no skip needed, pages flow naturally: regles → date_cloture → services_comptables → denomination...)

                        setPostPage((p) => p + 1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className="flex-1 py-3 rounded-xl bg-[#1E3A8A] text-white font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
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
