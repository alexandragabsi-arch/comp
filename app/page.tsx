"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Scale, FileText, Users, Building2, ArrowRight, CheckCircle2,
  RefreshCw, Moon, Briefcase, X, LayoutDashboard
} from "lucide-react";

const SERVICES = [
  {
    href: "/cession-parts",
    icon: <Users className="w-6 h-6 text-[#4A6FE3]" />,
    title: "Cession de parts sociales",
    desc: "SARL, EURL, SCI — acte de cession, PV d'AG, déclaration de non-condamnation.",
    tag: "SARL · EURL · SCI",
    color: "bg-blue-50",
  },
  {
    href: "/cession-action",
    icon: <Building2 className="w-6 h-6 text-[#4A6FE3]" />,
    title: "Cession d'actions",
    desc: "SAS, SASU, SA — acte de cession, PV AGE, garantie actif-passif.",
    tag: "SAS · SASU · SA",
    color: "bg-blue-50",
  },
  {
    href: "/dissolution",
    icon: <FileText className="w-6 h-6 text-red-500" />,
    title: "Dissolution / Liquidation",
    desc: "Fermez votre société en douceur. Signature électronique avancée + dépôt INPI automatique.",
    tag: "Toutes formes",
    color: "bg-red-50",
  },
  {
    href: "/modification-societe",
    icon: <RefreshCw className="w-6 h-6 text-purple-500" />,
    title: "Modification de société",
    desc: "Changement de dirigeant, siège social, dénomination, capital, objet social.",
    tag: "M2 · M3 · INPI",
    color: "bg-purple-50",
  },
  {
    href: "/mise-en-sommeil",
    icon: <Moon className="w-6 h-6 text-amber-500" />,
    title: "Mise en sommeil",
    desc: "Suspendez votre activité sans fermer définitivement. Dossier complet généré.",
    tag: "Toutes formes",
    color: "bg-amber-50",
  },
  {
    href: "/creation-auto-entrepreneur",
    icon: <Briefcase className="w-6 h-6 text-green-600" />,
    title: "Création auto-entrepreneur / EI",
    desc: "Déclarez votre micro-entreprise gratuitement via le Guichet Unique INPI.",
    tag: "Micro-BIC · Micro-BNC",
    color: "bg-green-50",
  },
  {
    href: "/fermeture-micro",
    icon: <X className="w-6 h-6 text-rose-500" />,
    title: "Fermeture micro-entreprise",
    desc: "Cessez votre activité d'auto-entrepreneur en toute conformité — déclaration INPI / URSSAF.",
    tag: "Gratuit",
    color: "bg-rose-50",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── NAV ── */}
      <header className="border-b border-gray-100 px-4 md:px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="block h-9 w-auto">
          <Image src="/images/logo-legal-corners.svg" alt="LegalCorners" width={140} height={36} className="h-full w-auto object-contain" priority />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <span className="cursor-pointer hover:text-[#1E3A8A] transition-colors">Nos services ▾</span>
        </nav>
        <div className="flex items-center gap-2 md:gap-3">
          <Link
            href="/dashboard"
            className="hidden md:flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#1E3A8A] transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Mes dossiers
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#1E3A8A] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="hidden sm:inline">Mon espace</span>
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-10 md:pb-16 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-[#1E3A8A] leading-tight max-w-3xl mx-auto">
          Toutes vos formalités juridiques en ligne
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto">
          Création, modification, cession, dissolution, mise en sommeil — documents conformes, signature électronique avancée, dépôt INPI automatique.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/dissolution"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#7AAAF5] to-[#4A6FE3] text-white font-semibold hover:opacity-90 transition-opacity shadow-md text-sm"
          >
            Dissoudre ma société
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/modification-societe"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-[#4A6FE3] text-[#4A6FE3] font-semibold hover:bg-[#EFF4FF] transition-colors text-sm"
          >
            Modifier ma société
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="bg-gray-50 py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1E3A8A] text-center mb-3">
            Nos services juridiques
          </h2>
          <p className="text-center text-gray-500 text-sm mb-10">Tous vos dossiers, une seule plateforme.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div className={`w-11 h-11 rounded-xl ${s.color} flex items-center justify-center mb-4`}>
                  {s.icon}
                </div>
                <h3 className="font-semibold text-[#1E3A8A] mb-2 group-hover:text-[#4A6FE3] transition-colors">
                  {s.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-3">{s.desc}</p>
                <span className="inline-block text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                  {s.tag}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="bg-white py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1E3A8A] text-center mb-8 md:mb-12">
            Pourquoi LegalCorners ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <FileText className="w-6 h-6 text-[#5B8DEF]" />,
                title: "Documents 100 % conformes",
                desc: "Rédigés par des juristes, adaptés à chaque forme juridique.",
              },
              {
                icon: <CheckCircle2 className="w-6 h-6 text-[#5B8DEF]" />,
                title: "Signature électronique avancée",
                desc: "Signature YouSign avec OTP SMS — niveau eIDAS avancé, conforme INPI.",
              },
              {
                icon: <Building2 className="w-6 h-6 text-[#5B8DEF]" />,
                title: "Dépôt INPI automatique",
                desc: "Vos formalités déposées au Guichet Unique sans quitter la plateforme.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-[#EFF4FF] flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-[#1E3A8A] mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA DASHBOARD ── */}
      <section className="py-12 md:py-20 px-4 md:px-6 text-center bg-gradient-to-b from-white to-[#EFF4FF]">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1E3A8A] mb-4">
            Suivez tous vos dossiers en un clin d'œil
          </h2>
          <p className="text-gray-500 mb-8">
            Création sur Bubble, formalités sur LegalCorners — tout centralisé dans votre espace client.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#7AAAF5] to-[#4A6FE3] text-white font-semibold hover:opacity-90 transition-opacity shadow-md"
          >
            <LayoutDashboard className="w-5 h-5" />
            Accéder à mon espace
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1.5">
            <Image src="/images/logo-legal-corners.svg" alt="LegalCorners" width={120} height={32} className="h-8 w-auto object-contain opacity-70" />
          </div>
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5"><Scale className="w-3.5 h-3.5" /> Sécurisé</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Rapide</span>
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
