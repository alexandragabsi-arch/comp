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
 *   Primary:      #4A73E8 (true blue, no purple)
 *   Inactive bg:  #D6DEEF
 *   Labels:       #2D3E6B / #8B9DC3
 *   Borders:      #B8C9ED / #D6E0F5
 *   Card bg:      #F0F4FF
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
          En déposant votre marque auprès de l&apos;<strong>INPI</strong>, vous en devenez
          le propriétaire. <em>La protection est valable 10 ans et peut être renouvelée indéfiniment.</em>
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
          <p className="mt-3 font-semibold text-[#4A73E8]">Conseil pratique : fixez un capital cohérent avec votre activité.</p>
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
          <p className="mt-2 italic text-[#4A73E8]">
            Supplément de 79 € HT si nous réalisons cette démarche pour vous.
          </p>
        </>
      ),
    },
  },
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

function ChoiceCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-6 py-4 rounded-lg border transition-all text-[15px] font-medium",
        selected
          ? "border-[#4A73E8] bg-[#E8EEFF] text-[#4A73E8]"
          : "border-[#D6E0F5] bg-[#F5F7FF] text-[#4A73E8] hover:border-[#4A73E8] hover:bg-[#E8EEFF]"
      )}
    >
      {label}
    </button>
  );
}

function InfoAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-8 border border-[#B8C9ED] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-[#EDF2FF] text-sm font-semibold text-[#3B4A7A]"
      >
        <span className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          Plus d&apos;informations
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="px-5 py-4 bg-white border-t border-[#B8C9ED]">
          <p className="text-sm font-bold text-[#4A73E8] mb-2">{title}</p>
          <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
        </div>
      )}
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
      {/* Row: circle + icon + label */}
      <div className="flex items-center">
        {/* Number circle */}
        <div
          className={cn(
            "w-[46px] h-[46px] rounded-full flex items-center justify-center text-[15px] font-bold shrink-0",
            highlighted
              ? "bg-[#4A73E8] text-white"
              : "bg-[#DCE3F2] text-[#98A7C8]"
          )}
        >
          {isDone ? <Check className="w-5 h-5" /> : step.id}
        </div>
        {/* Icon */}
        <Icon
          className={cn(
            "w-[26px] h-[26px] shrink-0 ml-3",
            highlighted ? "text-[#4A73E8]" : "text-[#B5C1D8]"
          )}
        />
        {/* Label */}
        <span
          className={cn(
            "text-[13px] font-semibold leading-[1.3] ml-2",
            highlighted ? "text-[#2D3E6B]" : "text-[#98A7C8]"
          )}
        >
          {step.label}
        </span>
      </div>
      {/* Dotted connector */}
      {!isLast && (
        <div className="ml-[22px] my-0">
          <div
            className={cn(
              "border-l-[2px] border-dotted",
              isDone ? "border-[#4A73E8]" : "border-[#B8C9ED]"
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
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const question = QUESTIONS[currentQ];
  const totalQ = QUESTIONS.length;

  // Map question index → sidebar step
  const sidebarStep = currentQ < 1 ? 1 : currentQ < 6 ? 2 : currentQ < 8 ? 4 : currentQ < 9 ? 3 : 5;

  const answer = answers[question.id] || "";
  const setAnswer = (val: string) => setAnswers((prev) => ({ ...prev, [question.id]: val }));
  const canGoNext = question.optional || answer.trim().length > 0;
  const goNext = () => { if (currentQ < totalQ - 1) setCurrentQ((q) => q + 1); };
  const goPrev = () => { if (currentQ > 0) setCurrentQ((q) => q - 1); };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── Header ── */}
      <header className="border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between max-w-[1400px] mx-auto">
        <Link href="/" className="block h-9 w-auto">
          <Image src="/images/logo-legal-corners.svg" alt="LegalCorners" width={140} height={36} className="h-full w-auto object-contain" priority />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <span className="cursor-pointer hover:text-[#3B4A7A] transition-colors flex items-center gap-1">
            Nos services <ChevronDown className="w-4 h-4" />
          </span>
        </nav>
        <Link href="/login" className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#3B4A7A] transition-colors">
          <User className="w-4 h-4" /> Connexion
        </Link>
      </header>

      {/* ── Mobile stepper ── */}
      <div className="md:hidden flex items-center justify-center gap-1.5 py-3 px-4 border-b border-gray-100">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
              sidebarStep > s.id ? "bg-[#4A73E8] text-white"
                : sidebarStep === s.id ? "bg-[#4A73E8] text-white"
                : "bg-[#DCE3F2] text-[#98A7C8]"
            )}>
              {sidebarStep > s.id ? <Check className="w-3 h-3" /> : s.id}
            </div>
            {i < STEPS.length - 1 && <div className={cn("w-3 h-[2px] mx-0.5", sidebarStep > s.id ? "bg-[#4A73E8]" : "bg-[#DCE3F2]")} />}
          </div>
        ))}
      </div>

      <div className="flex max-w-[1400px] mx-auto min-h-[calc(100vh-65px)]">
        {/* ═══════ Sidebar (desktop) ═══════ */}
        <aside className="hidden md:block w-[270px] min-w-[270px] border-r border-gray-200 pt-10 pb-8 pl-5 pr-3 overflow-y-auto">
          {STEPS.map((s, i) => (
            <SidebarStep
              key={s.id}
              step={s}
              isActive={sidebarStep === s.id}
              isDone={sidebarStep > s.id}
              isLast={i === STEPS.length - 1}
            />
          ))}
        </aside>

        {/* ═══════ Main content ═══════ */}
        <main className="flex-1 px-5 sm:px-8 md:px-14 py-6 md:py-10 max-w-[900px]">
          {/* Mobile progress */}
          <div className="md:hidden mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Question {currentQ + 1} / {totalQ}</span>
              <span>{Math.round(((currentQ + 1) / totalQ) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#4A73E8] rounded-full transition-all duration-500" style={{ width: `${((currentQ + 1) / totalQ) * 100}%` }} />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-[28px] sm:text-[34px] md:text-[40px] font-bold text-[#4A73E8] mb-6 md:mb-8 leading-tight">
            Création d&apos;une SASU
          </h1>

          {/* Question */}
          <h2 className="text-[16px] md:text-[18px] font-bold text-gray-900 mb-2 leading-snug">{question.title}</h2>

          {question.description && (
            <p className="text-sm text-gray-500 leading-relaxed mb-4 md:mb-5">{question.description}</p>
          )}

          {question.optional && (
            <span className="inline-block mb-4 px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded-full">
              optionnel
            </span>
          )}

          {/* Choice cards */}
          {question.type === "choice" && question.choices && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {question.choices.map((c) => (
                <ChoiceCard key={c.value} label={c.label} selected={answer === c.value} onClick={() => setAnswer(c.value)} />
              ))}
            </div>
          )}

          {/* Text input */}
          {question.type === "input" && (
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={question.placeholder}
              className="w-full mt-4 px-5 py-4 rounded-lg border border-[#D6E0F5] focus:border-[#4A73E8] focus:outline-none text-sm bg-white transition-colors"
            />
          )}

          {/* Textarea */}
          {question.type === "textarea" && (
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={question.placeholder}
              rows={4}
              className="w-full mt-4 px-5 py-4 rounded-lg border border-[#D6E0F5] focus:border-[#4A73E8] focus:outline-none text-sm resize-none bg-white transition-colors"
            />
          )}

          {question.hint && <p className="text-sm text-[#4A73E8] italic mt-3">{question.hint}</p>}

          {question.optional && (
            <div className="flex justify-end mt-3">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-[#4A73E8] text-[#4A73E8] text-sm font-semibold hover:bg-[#EDF2FF] transition-colors">
                <HelpCircle className="w-4 h-4" /> Aide IA
              </button>
            </div>
          )}

          {question.info && <InfoAccordion title={question.info.title}>{question.info.content}</InfoAccordion>}

          {/* ── Navigation ── */}
          <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100">
            <button
              onClick={goPrev}
              className={cn(
                "flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors",
                currentQ === 0 && "invisible"
              )}
            >
              <ArrowLeft className="w-4 h-4" /> Précédent
            </button>

            <button
              onClick={goNext}
              className={cn(
                "flex items-center gap-2 px-8 py-3.5 rounded-xl text-[15px] font-semibold transition-all",
                "bg-[#4A73E8] text-white hover:bg-[#3D63D4] active:bg-[#3356C2]"
              )}
            >
              Suivant <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
