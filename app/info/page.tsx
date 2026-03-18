"use client";

import Link from "next/link";
import {
  FileText,
  Users,
  Shield,
  CheckCircle,
  ArrowRight,
  Building2,
  Scale,
  AlertTriangle,
  Briefcase,
  Info,
} from "lucide-react";

export default function InfoPage() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-xl font-semibold text-zinc-900">LegalCorners</span>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            Accueil
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16 space-y-20">
        {/* Hero */}
        <section className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm text-blue-700">
            <Info className="h-4 w-4" />
            Guide complet
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
            Cession de titres — comment ça fonctionne ?
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-500">
            Que vous cédiez des parts sociales (SARL, SCI) ou des actions (SAS, SA), LegalCorners
            génère automatiquement vos documents juridiques conformes.
          </p>
        </section>

        {/* Types de cession */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900">Cession de parts sociales</h2>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Pour les sociétés SARL, EURL ou SCI. La cession de parts sociales est soumise à un
              agrément des associés et nécessite un acte écrit obligatoire.
            </p>
            <ul className="space-y-2 text-sm text-zinc-600">
              {["Acte de cession", "Procès-verbal d'AG", "Déclaration de cession"].map((doc) => (
                <li key={doc} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  {doc}
                </li>
              ))}
            </ul>
            <Link
              href="/cession-parts"
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Commencer <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-8 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50">
              <Building2 className="h-6 w-6 text-violet-600" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900">Cession d&apos;actions</h2>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Pour les sociétés SAS, SASU ou SA. Les actions sont en principe librement cessibles,
              sauf clause d&apos;agrément ou de préemption prévue dans les statuts.
            </p>
            <ul className="space-y-2 text-sm text-zinc-600">
              {["Acte de cession", "Procès-verbal d'AG", "Déclaration de cession"].map((doc) => (
                <li key={doc} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  {doc}
                </li>
              ))}
            </ul>
            <Link
              href="/cession-action"
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
            >
              Commencer <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Étapes */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-zinc-900 text-center">
            Comment ça marche ?
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              {
                step: "1",
                icon: <Users className="h-5 w-5 text-blue-600" />,
                title: "Renseignez les parties",
                desc: "Cédant, cessionnaire, informations de la société",
              },
              {
                step: "2",
                icon: <FileText className="h-5 w-5 text-blue-600" />,
                title: "Précisez la cession",
                desc: "Nombre de titres, prix, modalités de paiement",
              },
              {
                step: "3",
                icon: <Scale className="h-5 w-5 text-blue-600" />,
                title: "Vérifiez & validez",
                desc: "Relisez les informations et simulez les droits d'enregistrement",
              },
              {
                step: "4",
                icon: <FileText className="h-5 w-5 text-blue-600" />,
                title: "Téléchargez vos documents",
                desc: "Acte, PV et déclaration générés au format Word",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-xl border border-zinc-200 bg-white p-6 space-y-3"
              >
                <span className="absolute -top-3 left-5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {item.step}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  {item.icon}
                </div>
                <p className="font-semibold text-zinc-900 text-sm">{item.title}</p>
                <p className="text-zinc-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Points importants */}
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8 space-y-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
            <h2 className="text-xl font-semibold text-amber-900">Points importants à retenir</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Droits d'enregistrement",
                desc: "La cession doit être enregistrée auprès des impôts dans le mois suivant la signature. Des droits sont calculés sur le prix de cession.",
              },
              {
                title: "Agrément des associés",
                desc: "Pour les SARL, une cession à un tiers nécessite l'accord des associés représentant au moins la moitié des parts sociales.",
              },
              {
                title: "Garantie d'actif et de passif",
                desc: "Le cédant garantit généralement à l'acquéreur la situation comptable et juridique de la société au moment de la cession.",
              },
              {
                title: "Fiscalité de la plus-value",
                desc: "Le cédant peut être soumis à l'impôt sur les plus-values de cession. Des abattements sont possibles selon la durée de détention.",
              },
            ].map((item) => (
              <div key={item.title} className="space-y-1.5">
                <p className="font-semibold text-amber-900 text-sm">{item.title}</p>
                <p className="text-amber-800 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Documents générés */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-zinc-900 text-center">
            Documents générés automatiquement
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: <FileText className="h-6 w-6 text-blue-600" />,
                title: "Acte de cession",
                desc: "Document principal formalisant le transfert de propriété des titres entre le cédant et le cessionnaire.",
                color: "blue",
              },
              {
                icon: <Users className="h-6 w-6 text-green-600" />,
                title: "Procès-verbal d'AG",
                desc: "Compte-rendu de l'assemblée générale des associés approuvant la cession et la modification du registre des associés.",
                color: "green",
              },
              {
                icon: <Shield className="h-6 w-6 text-violet-600" />,
                title: "Déclaration de cession",
                desc: "Formulaire à déposer auprès du Service des Impôts des Entreprises pour l'enregistrement et le paiement des droits.",
                color: "violet",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-3"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${item.color}-50`}>
                  {item.icon}
                </div>
                <p className="font-semibold text-zinc-900">{item.title}</p>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl bg-zinc-900 p-10 text-center space-y-5">
          <Briefcase className="mx-auto h-10 w-10 text-zinc-400" />
          <h2 className="text-2xl font-semibold text-white">Prêt à générer vos documents ?</h2>
          <p className="text-zinc-400 text-sm">
            Choisissez le type de cession qui correspond à votre situation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/cession-parts"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              Cession de parts sociales <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/cession-action"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
            >
              Cession d&apos;actions <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} LegalCorners — Les documents générés sont fournis à titre indicatif et ne remplacent pas les conseils d&apos;un professionnel du droit.
      </footer>
    </div>
  );
}
