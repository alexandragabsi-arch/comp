"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, ChevronRight,
  User, Building2, CreditCard, FolderOpen, CheckCircle2,
  FileUp, PenTool, HelpCircle, Lightbulb, Clock, Zap, Shield, Users, Sparkles, X
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

  // Post-payment pages (step 4: dossier juridique)
  const POST_PAGES: PageDef[] = [
    { questions: [10], sidebarStep: 4 }, // regime_fiscal
    { questions: [9],  sidebarStep: 4 }, // objet_social
    { questions: [11], sidebarStep: 4 }, // adresse_siege
    { questions: [12], sidebarStep: 4 }, // president_remunere
  ];

  // Determine sidebar step from phase
  const sidebarStep =
    phase === "intro" ? 1 :
    phase === "questions" ? (question && ["qui_realise"].includes(question.id) ? 1 : 2) :
    phase === "brand_protection" || phase === "micro_search" ? 2 :
    phase === "pricing" || phase === "avocat_confirmation" ? 3 :
    4;

  function goNextQuestion() {
    const q = QUESTIONS[activeQuestions[currentQ]];

    // After certain questions, redirect to special pages
    if (q.id === "proteger_nom" && answers.proteger_nom === "oui") {
      setPhase("brand_protection");
      return;
    }
    if (q.id === "statut_micro" && answers.statut_micro === "oui") {
      // Show action_micro next (it's in the list)
    }
    if (q.id === "fermeture_micro" && answers.statut_micro === "oui") {
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
    setAnswer(q.id, val);
    // Auto-advance on choice
    setTimeout(() => goNextQuestion(), 300);
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
          : phase === "pricing"
            ? "md:ml-72 p-6 md:p-10 items-start pt-10"
            : "md:ml-72 p-6 items-start"
      )}>
        <div className={cn(
          "w-full",
          phase === "pricing" || phase === "brand_protection" ? "max-w-4xl" :
          phase === "post_payment" ? "max-w-[900px]" :
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

            {/* ══════ POST-PAYMENT (old style with QuestionBlock) ══════ */}
            {phase === "post_payment" && (
              <motion.div
                key={`post-${postPage}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h1 className="text-[28px] font-bold text-[#2563EB] mb-8 leading-tight">
                  Dossier juridique
                </h1>

                {POST_PAGES[postPage]?.questions.map((qi) => (
                  <QuestionBlock
                    key={QUESTIONS[qi].id}
                    question={QUESTIONS[qi]}
                    answer={answers[QUESTIONS[qi].id] || ""}
                    onAnswer={(val) => setAnswer(QUESTIONS[qi].id, val)}
                  />
                ))}

                <div className="flex justify-between items-center mt-6 pt-6 border-t border-[#E5E7EB]">
                  <button
                    onClick={() => {
                      if (postPage > 0) {
                        setPostPage((p) => p - 1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      } else {
                        setPhase("pricing");
                      }
                    }}
                    className="flex items-center gap-2 text-sm font-medium text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Précédent
                  </button>
                  <button
                    onClick={() => {
                      if (postPage < POST_PAGES.length - 1) {
                        setPostPage((p) => p + 1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-[15px] font-semibold transition-all bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:bg-[#1E40AF]"
                  >
                    Suivant <ArrowRight className="w-4 h-4" />
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
