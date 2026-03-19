"use client";

import Link from "next/link";
import Image from "next/image";
import { Scale, FileText, Users, Building2, ArrowRight, CheckCircle2 } from "lucide-react";

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
            href="#"
            className="hidden md:inline-flex px-5 py-2 rounded-full bg-gradient-to-r from-[#7AAAF5] to-[#4A6FE3] text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-sm"
          >
            Prendre rendez-vous
          </Link>
          <Link
            href="/cession-parts"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#1E3A8A] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="hidden sm:inline">Connexion</span>
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-10 md:pb-16 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-[#1E3A8A] leading-tight max-w-3xl mx-auto">
          Cédez vos parts ou actions en toute simplicité
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto">
          Générez en quelques minutes tous les documents nécessaires à votre cession : acte de cession, PV d&apos;AG, déclaration de non-condamnation du nouveau dirigeant — et envoyez-les directement au Greffe.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/cession-parts"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#7AAAF5] to-[#4A6FE3] text-white font-semibold hover:opacity-90 transition-opacity shadow-md text-sm"
          >
            Céder des parts sociales
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/cession-action"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#7AAAF5] to-[#4A6FE3] text-white font-semibold hover:opacity-90 transition-opacity shadow-md text-sm"
          >
            Céder des actions
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Service tags */}
        <div className="mt-12 flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
          {[
            "Cession de parts sociales",
            "Cession d'actions",
            "PV d'assemblée générale",
            "Acte de cession",
            "Déclaration de non-condamnation",
            "Garantie actif-passif",
          ].map((tag) => (
            <span
              key={tag}
              className="px-4 py-2 rounded-lg border border-[#5B8DEF] text-[#1E3A8A] text-sm font-medium bg-white hover:bg-[#EFF4FF] transition-colors cursor-default"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="bg-white py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1E3A8A] text-center mb-8 md:mb-12">
            Tout ce dont vous avez besoin pour votre cession
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <FileText className="w-6 h-6 text-[#5B8DEF]" />,
                title: "Documents complets",
                desc: "Acte de cession, PV d'AG, déclaration de non-condamnation — tout en un.",
              },
              {
                icon: <CheckCircle2 className="w-6 h-6 text-[#5B8DEF]" />,
                title: "100 % conforme",
                desc: "Modèles rédigés par des juristes, conformes au Code de commerce.",
              },
              {
                icon: <Building2 className="w-6 h-6 text-[#5B8DEF]" />,
                title: "SARL · SAS · SA · EURL · SCI · SASU",
                desc: "Adapté à toutes les formes juridiques : SARL, SAS, SA, EURL, SASU, SCI, SNC — cession de parts ou d'actions.",
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

      {/* ── CTA ── */}
      <section className="py-12 md:py-20 px-4 md:px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1E3A8A] mb-4">
            Prêt à finaliser votre cession ?
          </h2>
          <p className="text-gray-500 mb-8">
            Formulaire guidé · Documents conformes · Téléchargement immédiat en DOCX ou PDF.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/cession-parts"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#7AAAF5] to-[#4A6FE3] text-white font-semibold hover:opacity-90 transition-opacity shadow-md"
            >
              Cession de parts
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/cession-action"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#7AAAF5] to-[#4A6FE3] text-white font-semibold hover:opacity-90 transition-opacity shadow-md"
            >
              Cession d&apos;actions
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
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
