"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp,
  User, Building2, CreditCard, FolderOpen, CheckCircle2,
  FileUp, PenTool, HelpCircle, Lightbulb
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

interface Choice { value: string; label: string }

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
    info: {
      title: "Le saviez-vous ?",
      content: (
        <p>
          La <strong>dénomination sociale</strong> est le nom officiel de votre société, distinct du nom commercial.
          Vérifiez sa disponibilité sur <strong>infogreffe.fr</strong> ou auprès de l&apos;INPI avant de vous décider.
        </p>
      ),
    },
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
  {
    id: "activite_artisanale",
    title: "Votre activité est-elle artisanale ? (Coiffeur, boulanger, plombier, etc...)",
    description:
      "Une activité artisanale est une activité manuelle (ex. : coiffure, pâtisserie, couture sur mesure, mécanique, plomberie, etc.).",
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
          <p><strong>Toute activité artisanale doit être immatriculée au Répertoire des Métiers (RM)</strong>, tenu par la <strong>CMA</strong>.</p>
          <p className="mt-2 italic text-[#2563EB]">
            Supplément de 79 € HT si nous réalisons cette démarche pour vous.
          </p>
        </>
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
  /* ── Step 5: Récapitulatif ── */
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
];

/* ───────── Step → question indices mapping ───────── */

const STEP_QUESTIONS: Record<number, number[]> = {
  1: [0],           // qui_realise
  2: [1, 2, 3, 4, 5], // nom_societe → activite_artisanale
  3: [6],           // regime_fiscal
  4: [7, 8],        // adresse_siege, president_remunere
  5: [9],           // demarrage
};

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

/* Steps that have questions */
const ACTIVE_STEPS = [1, 2, 3, 4, 5];

/* ───────── Components ───────── */

function ChoiceCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-6 py-4 rounded-lg border transition-all text-[15px] font-medium",
        selected
          ? "border-[#2563EB] border-2 bg-[#EFF6FF] text-[#2563EB]"
          : "border-[#D1D5DB] bg-transparent text-[#2563EB] hover:border-[#2563EB] hover:bg-[#EFF6FF]"
      )}
    >
      {label}
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
                {[1, 2, 3, 4, 5].map((n) => (
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
  showBrandProtection,
}: {
  question: Question;
  answer: string;
  onAnswer: (val: string) => void;
  showBrandProtection?: boolean;
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

      {/* Conditional brand protection section */}
      {showBrandProtection && answer === "oui" && <BrandProtectionSection />}
    </div>
  );
}

/* ───────── Sidebar Step ───────── */

function SidebarStep({
  step,
  isActive,
  isDone,
  isLast,
}: {
  step: (typeof STEPS)[number];
  isActive: boolean;
  isDone: boolean;
  isLast: boolean;
}) {
  const Icon = step.icon;
  const highlighted = isDone || isActive;

  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
            highlighted
              ? "bg-[#2563EB] text-white"
              : "bg-[#E5E7EB] text-[#9CA3AF]"
          )}
        >
          {isDone ? <Check className="w-4 h-4" /> : step.id}
        </div>
        <Icon
          className={cn(
            "w-5 h-5 shrink-0 ml-3",
            highlighted ? "text-[#2563EB]" : "text-[#9CA3AF]"
          )}
        />
        <span
          className={cn(
            "text-[13px] font-semibold leading-[1.3] ml-2",
            highlighted ? "text-[#1E293B]" : "text-[#9CA3AF]"
          )}
        >
          {step.label}
        </span>
      </div>
      {!isLast && (
        <div className="ml-[15px] my-0">
          <div
            className={cn(
              "border-l-[2px] border-dotted",
              isDone ? "border-[#2563EB]" : "border-[#D1D5DB]"
            )}
            style={{ height: 48 }}
          />
        </div>
      )}
    </div>
  );
}

/* ───────── Main page ───────── */

export default function CreationSASUPage() {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const activeStep = ACTIVE_STEPS[currentStepIdx];
  const stepQuestionIndices = STEP_QUESTIONS[activeStep] || [];
  const stepQuestions = stepQuestionIndices.map((i) => QUESTIONS[i]);

  const setAnswer = (id: string, val: string) =>
    setAnswers((prev) => ({ ...prev, [id]: val }));

  const goNext = () => {
    if (currentStepIdx < ACTIVE_STEPS.length - 1) {
      setCurrentStepIdx((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const goPrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── Header ── */}
      <header className="border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between max-w-[1400px] mx-auto">
        <Link href="/" className="block h-9 w-auto">
          <Image src="/images/logo-legal-corners.svg" alt="LegalCorners" width={140} height={36} className="h-full w-auto object-contain" priority />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B7280]">
          <span className="cursor-pointer hover:text-[#1E293B] transition-colors flex items-center gap-1">
            Nos services <ChevronDown className="w-4 h-4" />
          </span>
        </nav>
        <Link href="/login" className="flex items-center gap-1.5 text-sm font-medium text-[#6B7280] hover:text-[#1E293B] transition-colors">
          <User className="w-4 h-4" /> Connexion
        </Link>
      </header>

      {/* ── Mobile stepper ── */}
      <div className="md:hidden flex items-center justify-center gap-1.5 py-3 px-4 border-b border-gray-100">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
              activeStep > s.id ? "bg-[#2563EB] text-white"
                : activeStep === s.id ? "bg-[#2563EB] text-white"
                : "bg-[#E5E7EB] text-[#9CA3AF]"
            )}>
              {activeStep > s.id ? <Check className="w-3 h-3" /> : s.id}
            </div>
            {i < STEPS.length - 1 && <div className={cn("w-3 h-[2px] mx-0.5", activeStep > s.id ? "bg-[#2563EB]" : "bg-[#E5E7EB]")} />}
          </div>
        ))}
      </div>

      <div className="flex max-w-[1400px] mx-auto min-h-[calc(100vh-65px)]">
        {/* ═══════ Sidebar (desktop) — fixed 240px ═══════ */}
        <aside className="hidden md:block w-[240px] min-w-[240px] border-r border-[#E5E7EB] pt-10 pb-8 pl-5 pr-3 overflow-y-auto">
          {STEPS.map((s, i) => (
            <SidebarStep
              key={s.id}
              step={s}
              isActive={activeStep === s.id}
              isDone={activeStep > s.id}
              isLast={i === STEPS.length - 1}
            />
          ))}
        </aside>

        {/* ═══════ Main content ═══════ */}
        <main className="flex-1 px-5 sm:px-8 md:px-14 py-6 md:py-10 max-w-[900px]">
          {/* Title */}
          <h1 className="text-[28px] font-bold text-[#2563EB] mb-8 leading-tight">
            Création d&apos;une SASU
          </h1>

          {/* All questions for this step */}
          {stepQuestions.map((q) => (
            <QuestionBlock
              key={q.id}
              question={q}
              answer={answers[q.id] || ""}
              onAnswer={(val) => setAnswer(q.id, val)}
              showBrandProtection={q.id === "proteger_nom"}
            />
          ))}

          {/* ── Navigation ── */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-[#E5E7EB]">
            <button
              onClick={goPrev}
              className={cn(
                "flex items-center gap-2 text-sm font-medium text-[#9CA3AF] hover:text-[#6B7280] transition-colors",
                currentStepIdx === 0 && "invisible"
              )}
            >
              <ArrowLeft className="w-4 h-4" /> Précédent
            </button>

            <button
              onClick={goNext}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-[15px] font-semibold transition-all bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:bg-[#1E40AF]"
            >
              Suivant <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
