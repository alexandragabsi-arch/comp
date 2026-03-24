"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, ChevronRight,
  User, Building2, CreditCard, FolderOpen, CheckCircle2,
  FileUp, PenTool, HelpCircle, Lightbulb, Clock, Zap, Shield, Users, Sparkles, X,
  Coins, Percent, Edit3
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

function AccordionItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left gap-3"
      >
        <span className="text-sm font-semibold text-[#1E3A8A]">{title}</span>
        <ChevronRight className={cn("w-4 h-4 text-[#2563EB] flex-shrink-0 transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
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
        <h2 className="text-2xl font-bold text-[#1E3A8A]">
          Quel est l&apos;objet principal de votre SASU ?
        </h2>
        <p className="text-gray-500 text-sm">L&apos;objet principal est l&apos;activité de base de votre société</p>
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
  const POST_PAGES = [
    { id: "denomination" },        // dénomination + sigle + nom commercial + enseigne
    { id: "objet_principal" },      // catégories visuelles + sous-catégories
    { id: "objet_social" },         // texte libre
    { id: "activite_description" }, // activité principale + secondaires + code NAF
    { id: "activite_saisonniere" }, // saisonnière / ambulante
    { id: "associe_unique" },       // type d'associé + infos
    { id: "capital_social" },       // capital fixe/variable + montant + actions + formule
    { id: "apport_associe" },      // apport de l'associé unique
    { id: "depot_capital" },        // établissement bancaire + date dépôt
    { id: "regime_fiscal" },        // IS / IR
    { id: "adresse_siege" },        // adresse
    { id: "president_remunere" },   // rémunération
  ];

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

                {/* ── Page 0: Dénomination sociale ── */}
                {POST_PAGES[postPage]?.id === "denomination" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">
                        Identité de votre société
                      </h2>
                      <p className="text-gray-500 text-sm">Dénomination, sigle, nom commercial et enseigne</p>
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
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Objet social</h2>
                      <p className="text-gray-500 text-sm">Définissez l&apos;objet social de votre société</p>
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
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Description de vos activités</h2>
                      <p className="text-gray-500 text-sm">Précisez votre activité principale et vos éventuelles activités secondaires</p>
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
                          onChange={(e) => setAnswer("activite_principale_desc", e.target.value)}
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

                    {/* Code NAF suggestion */}
                    {answers.activite_principale_desc && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-[#1E3A8A]">
                          <strong>Suggestion du code NAF :</strong> Le code NAF attribué officiellement sera celui correspondant à l&apos;activité principale, telle que déterminée par l&apos;INSEE.
                        </p>
                      </div>
                    )}

                    {/* Analyse réglementaire */}
                    <div className="space-y-3">
                      <h3 className="text-base font-bold text-[#1E3A8A]">Analyse réglementaire de votre activité</h3>
                      <p className="text-sm text-gray-600">
                        À partir des activités que vous avez décrites, nous vérifions si certaines obligations réglementaires ou justificatifs sont requis afin d&apos;éviter tout refus lors de l&apos;immatriculation auprès de l&apos;INPI.
                      </p>
                      {answers.activite_principale_desc && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                          <p className="text-sm text-green-800">
                            <strong>Analyse :</strong> Nous vérifierons la conformité réglementaire de votre activité lors de la constitution du dossier.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Page 4: Activité saisonnière / ambulante ── */}
                {POST_PAGES[postPage]?.id === "activite_saisonniere" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Type d&apos;activité</h2>
                      <p className="text-gray-500 text-sm">Est-ce qu&apos;une des activités est saisonnière ou ambulante ?</p>
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
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">ASSOCIÉ UNIQUE</h2>
                      <p className="text-gray-500 text-sm">Veuillez remplir les informations de l&apos;associé unique</p>
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
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">ACTIONS ET CAPITAL SOCIAL</h2>
                      <p className="text-gray-500 text-sm">Dans le parcours simplifié, la valeur d&apos;une action est fixée à 1 euro.</p>
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
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Apport de l&apos;associé unique</h2>
                      <p className="text-gray-500 text-sm">Cliquez sur l&apos;associé, remplissez sa fiche d&apos;apport, puis validez</p>
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

                {/* ── Dépôt du capital ── */}
                {POST_PAGES[postPage]?.id === "depot_capital" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">Dépôt du capital</h2>
                      <p className="text-gray-500 text-sm">Informations sur le dépôt de votre capital social</p>
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
                    </div>
                  </div>
                )}

                {/* ── Régime fiscal ── */}
                {POST_PAGES[postPage]?.id === "regime_fiscal" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">{QUESTIONS[10].title}</h2>
                      {QUESTIONS[10].description && <p className="text-gray-500 text-sm">{QUESTIONS[10].description}</p>}
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

                {/* ── Page 8: Adresse siège social ── */}
                {POST_PAGES[postPage]?.id === "adresse_siege" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">{QUESTIONS[11].title}</h2>
                    </div>
                    {QUESTIONS[11].info && (
                      <AccordionItem title={QUESTIONS[11].info.title}>
                        <div className="text-sm text-gray-600">{QUESTIONS[11].info.content}</div>
                      </AccordionItem>
                    )}
                    <input
                      type="text"
                      value={answers.adresse_siege || ""}
                      onChange={(e) => setAnswer("adresse_siege", e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && answers.adresse_siege) { setPostPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); } }}
                      placeholder={QUESTIONS[11].placeholder}
                      className="w-full px-5 py-4 rounded-xl border-2 border-[#2563EB] bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-base"
                    />
                  </div>
                )}

                {/* ── Page 9: Président rémunéré ── */}
                {POST_PAGES[postPage]?.id === "president_remunere" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#1E3A8A]">{QUESTIONS[12].title}</h2>
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
