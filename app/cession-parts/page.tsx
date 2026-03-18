"use client";

import { useState } from "react";
import { FormData, StepId } from "../types/form";

// ─── Initial state ───────────────────────────────────────────────────────────
const initialData: FormData = {
  societe: {},
  cedant: { typePersonne: "physique", physique: { civilite: "M.", nom: "", prenom: "", dateNaissance: "", villeNaissance: "", nationalite: "française", adresse: "", regime: "celibataire" }, nombreTitresCedes: "" },
  cessionnaire: { typePersonne: "physique", physique: { civilite: "M.", nom: "", prenom: "", dateNaissance: "", villeNaissance: "", nationalite: "française", adresse: "", regime: "celibataire" } },
  prix: { typePaiement: "comptant", echeances: [{ montant: "", date: "" }] },
  natureCession: { type: "pleine_propriete" },
  gap: { active: false, escrow: false },
  comptesCourants: { option: "absent" },
  nonConcurrence: { active: false },
  pv: { typeAssemblee: "associe_unique", ville: "", date: "", changementDirigeant: false, questionsEcrites: false, dureeMandat: "illimitée" },
  ville: "",
  date: "",
  fraisALaCharge: "Cessionnaire",
};

const STEPS: { id: StepId; label: string }[] = [
  { id: "societe", label: "Société cible" },
  { id: "cedant", label: "Informations cédant" },
  { id: "cessionnaire", label: "Informations cessionnaire" },
  { id: "prix", label: "Conditions de cession" },
  { id: "options", label: "Clauses & Options" },
  { id: "pv", label: "PV Assemblée" },
  { id: "recap", label: "Récapitulatif" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: { value?: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent"
    />
  );
}

function Select({ value, onChange, options }: { value?: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744] bg-white"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-[#1a2744]" : "bg-gray-300"}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-semibold text-[#1a2744] text-base mb-4 mt-6 border-b border-gray-200 pb-2">{children}</h3>;
}

// ─── Step components ──────────────────────────────────────────────────────────
function StepSociete({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  const s = data.societe;
  const upd = (k: string, v: string | boolean) => set({ societe: { ...s, [k]: v } });
  return (
    <div>
      <SectionTitle>Informations sur la société cible</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <Field label="Dénomination sociale" required><Input value={s.denomination} onChange={v => upd("denomination", v)} placeholder="Ex: DUPONT SAS" /></Field>
        <Field label="Forme juridique" required>
          <Select value={s.formeJuridique} onChange={v => upd("formeJuridique", v)} options={[
            { value: "", label: "Choisir..." },
            { value: "SARL", label: "SARL" }, { value: "EURL", label: "EURL" },
            { value: "SAS", label: "SAS" }, { value: "SASU", label: "SASU" },
            { value: "SA", label: "SA" }, { value: "SCI", label: "SCI" },
            { value: "SNC", label: "SNC" }, { value: "Autre", label: "Autre" },
          ]} />
        </Field>
        <Field label="Capital social (ex: 10 000 €)" required><Input value={s.capital} onChange={v => upd("capital", v)} placeholder="10 000 €" /></Field>
        <Field label="Ville RCS" required><Input value={s.rcsVille} onChange={v => upd("rcsVille", v)} placeholder="Paris" /></Field>
        <Field label="Numéro RCS" required><Input value={s.rcsNumero} onChange={v => upd("rcsNumero", v)} placeholder="XXX XXX XXX" /></Field>
        <Field label="Nombre total de titres" required><Input value={s.nombreTitresTotal} onChange={v => upd("nombreTitresTotal", v)} placeholder="100" type="number" /></Field>
        <Field label="Valeur nominale par titre" required><Input value={s.valeurNominale} onChange={v => upd("valeurNominale", v)} placeholder="100 €" /></Field>
        <Field label="Adresse du siège social" required><Input value={s.adresse} onChange={v => upd("adresse", v)} placeholder="1 rue de la Paix, 75001 Paris" /></Field>
      </div>
      <div className="mt-2">
        <Toggle checked={!!s.estSPI} onChange={v => upd("estSPI", v)} label="Société à prépondérance immobilière (SPI)" />
      </div>
    </div>
  );
}

function PersonneForm({ data, onChange, label }: {
  data: FormData["cedant"] | FormData["cessionnaire"];
  onChange: (d: typeof data) => void;
  label: string;
}) {
  const isPhysique = data.typePersonne === "physique";
  const p = data.physique || { civilite: "M.", nom: "", prenom: "", dateNaissance: "", villeNaissance: "", nationalite: "française", adresse: "", regime: "celibataire" as const };
  const m = data.morale || { denomination: "", formeJuridique: "", capital: "", adresse: "", rcsVille: "", rcsNumero: "", representantCivilite: "M." as const, representantNom: "", representantPrenom: "", representantQualite: "" };

  const updP = (k: string, v: string) => onChange({ ...data, physique: { ...p, [k]: v } });
  const updM = (k: string, v: string) => onChange({ ...data, morale: { ...m, [k]: v } });

  return (
    <div>
      <SectionTitle>{label}</SectionTitle>
      <Field label="Type de personne">
        <div className="flex gap-4">
          {(["physique", "morale"] as const).map(t => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={data.typePersonne === t} onChange={() => onChange({ ...data, typePersonne: t })} className="accent-[#1a2744]" />
              <span className="text-sm capitalize">{t === "physique" ? "Personne physique" : "Personne morale"}</span>
            </label>
          ))}
        </div>
      </Field>

      {isPhysique ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Field label="Civilité">
            <Select value={p.civilite} onChange={v => updP("civilite", v)} options={[{ value: "M.", label: "M." }, { value: "Mme", label: "Mme" }]} />
          </Field>
          <Field label="Nom" required><Input value={p.nom} onChange={v => updP("nom", v)} placeholder="DUPONT" /></Field>
          <Field label="Prénom" required><Input value={p.prenom} onChange={v => updP("prenom", v)} placeholder="Jean" /></Field>
          <Field label="Date de naissance" required><Input type="date" value={p.dateNaissance} onChange={v => updP("dateNaissance", v)} /></Field>
          <Field label="Ville de naissance" required><Input value={p.villeNaissance} onChange={v => updP("villeNaissance", v)} placeholder="Paris" /></Field>
          <Field label="Nationalité"><Input value={p.nationalite} onChange={v => updP("nationalite", v)} placeholder="française" /></Field>
          <Field label="Adresse complète" required><Input value={p.adresse} onChange={v => updP("adresse", v)} placeholder="1 rue de la Paix, 75001 Paris" /></Field>
          <Field label="Situation maritale">
            <Select value={p.regime} onChange={v => updP("regime", v)} options={[
              { value: "celibataire", label: "Célibataire / Divorcé(e) / Veuf(ve)" },
              { value: "communaute", label: "Marié(e) — Communauté de biens" },
              { value: "separation", label: "Marié(e)/Pacsé(e) — Séparation de biens" },
            ]} />
          </Field>
          {(p.regime === "communaute" || p.regime === "separation") && (
            <>
              <Field label="Civilité du conjoint">
                <Select value={p.conjointCivilite} onChange={v => updP("conjointCivilite", v)} options={[{ value: "M.", label: "M." }, { value: "Mme", label: "Mme" }]} />
              </Field>
              <Field label="Nom du conjoint"><Input value={p.conjointNom} onChange={v => updP("conjointNom", v)} /></Field>
              <Field label="Prénom du conjoint"><Input value={p.conjointPrenom} onChange={v => updP("conjointPrenom", v)} /></Field>
              {p.regime === "communaute" && (
                <Field label="Type de régime">
                  <Select value={p.typeRegime} onChange={v => updP("typeRegime", v)} options={[
                    { value: "communauté de biens", label: "Communauté légale (réduite aux acquêts)" },
                    { value: "communauté universelle", label: "Communauté universelle" },
                  ]} />
                </Field>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Field label="Dénomination" required><Input value={m.denomination} onChange={v => updM("denomination", v)} /></Field>
          <Field label="Forme juridique"><Input value={m.formeJuridique} onChange={v => updM("formeJuridique", v)} placeholder="SAS" /></Field>
          <Field label="Capital"><Input value={m.capital} onChange={v => updM("capital", v)} placeholder="10 000 €" /></Field>
          <Field label="Adresse"><Input value={m.adresse} onChange={v => updM("adresse", v)} /></Field>
          <Field label="Ville RCS"><Input value={m.rcsVille} onChange={v => updM("rcsVille", v)} /></Field>
          <Field label="Numéro RCS"><Input value={m.rcsNumero} onChange={v => updM("rcsNumero", v)} /></Field>
          <Field label="Civilité du représentant">
            <Select value={m.representantCivilite} onChange={v => updM("representantCivilite", v)} options={[{ value: "M.", label: "M." }, { value: "Mme", label: "Mme" }]} />
          </Field>
          <Field label="Nom du représentant"><Input value={m.representantNom} onChange={v => updM("representantNom", v)} /></Field>
          <Field label="Prénom du représentant"><Input value={m.representantPrenom} onChange={v => updM("representantPrenom", v)} /></Field>
          <Field label="Qualité du représentant"><Input value={m.representantQualite} onChange={v => updM("representantQualite", v)} placeholder="Président, Gérant..." /></Field>
        </div>
      )}
    </div>
  );
}

function StepCedant({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  return (
    <div>
      <PersonneForm
        data={data.cedant}
        onChange={d => set({ cedant: { ...d } })}
        label="Le Cédant (vendeur)"
      />
      <SectionTitle>Titres cédés</SectionTitle>
      <Field label="Nombre de titres cédés" required>
        <Input
          type="number"
          value={data.cedant.nombreTitresCedes}
          onChange={v => set({ cedant: { ...data.cedant, nombreTitresCedes: v } })}
          placeholder="Ex: 50"
        />
      </Field>
      {data.societe.nombreTitresTotal && data.cedant.nombreTitresCedes && (
        <p className="text-sm text-gray-500 mt-1">
          → {((parseInt(data.cedant.nombreTitresCedes) / parseInt(data.societe.nombreTitresTotal)) * 100).toFixed(2)} % du capital social
        </p>
      )}
    </div>
  );
}

function StepCessionnaire({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  return (
    <div>
      <PersonneForm
        data={data.cessionnaire}
        onChange={d => set({ cessionnaire: { ...d } })}
        label="Le Cessionnaire (acheteur)"
      />
      {data.cessionnaire.typePersonne === "physique" &&
        data.cessionnaire.physique?.regime === "communaute" && (
          <div className="mt-4">
            <SectionTitle>Acquisition sur biens...</SectionTitle>
            <Field label="Les titres sont acquis sur">
              <Select
                value={data.cessionnaire.acquisitionBiens || "propres"}
                onChange={v => set({ cessionnaire: { ...data.cessionnaire, acquisitionBiens: v as "propres" | "communs" } })}
                options={[
                  { value: "propres", label: "Biens propres du cessionnaire" },
                  { value: "communs", label: "Biens communs du ménage" },
                ]}
              />
            </Field>
          </div>
        )}
    </div>
  );
}

function StepPrix({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  const p = data.prix;
  const upd = (k: string, v: unknown) => set({ prix: { ...p, [k]: v } });

  return (
    <div>
      <SectionTitle>Prix et paiement</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <Field label="Prix total de cession (ex: 50 000 €)" required>
          <Input value={p.prixTotal} onChange={v => upd("prixTotal", v)} placeholder="50 000 €" />
        </Field>
        <Field label="Modalité de paiement">
          <Select value={p.typePaiement} onChange={v => upd("typePaiement", v)} options={[
            { value: "comptant", label: "Paiement comptant (quittance immédiate)" },
            { value: "echelonne", label: "Paiement échelonné" },
          ]} />
        </Field>
      </div>

      {p.typePaiement === "echelonne" && (
        <div className="mt-4">
          <SectionTitle>Échéancier</SectionTitle>
          {(p.echeances || []).map((e, i) => (
            <div key={i} className="grid grid-cols-2 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
              <Field label={`Montant échéance ${i + 1}`}>
                <Input value={e.montant} onChange={v => {
                  const arr = [...(p.echeances || [])];
                  arr[i] = { ...arr[i], montant: v };
                  upd("echeances", arr);
                }} placeholder="10 000 €" />
              </Field>
              <Field label="Date d'exigibilité">
                <Input type="date" value={e.date} onChange={v => {
                  const arr = [...(p.echeances || [])];
                  arr[i] = { ...arr[i], date: v };
                  upd("echeances", arr);
                }} />
              </Field>
            </div>
          ))}
          <button
            onClick={() => upd("echeances", [...(p.echeances || []), { montant: "", date: "" }])}
            className="text-sm text-[#1a2744] underline mt-1"
          >
            + Ajouter une échéance
          </button>
        </div>
      )}

      <SectionTitle>Nature de la cession</SectionTitle>
      <Field label="Type de transfert">
        <Select value={data.natureCession.type} onChange={v => set({ natureCession: { ...data.natureCession, type: v as "pleine_propriete" | "usufruit" | "nue_propriete" } })} options={[
          { value: "pleine_propriete", label: "Pleine propriété (standard)" },
          { value: "usufruit", label: "Usufruit seulement" },
          { value: "nue_propriete", label: "Nue-propriété seulement" },
        ]} />
      </Field>

      <SectionTitle>Informations de signature</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <Field label="Ville de signature" required>
          <Input value={data.ville} onChange={v => set({ ville: v, pv: { ...data.pv, ville: v } })} placeholder="Paris" />
        </Field>
        <Field label="Date de signature" required>
          <Input type="date" value={data.date} onChange={v => set({ date: v, pv: { ...data.pv, date: v } })} />
        </Field>
        <Field label="Frais à la charge de">
          <Select value={data.fraisALaCharge} onChange={v => set({ fraisALaCharge: v as "Cessionnaire" | "Cédant" })} options={[
            { value: "Cessionnaire", label: "Cessionnaire" },
            { value: "Cédant", label: "Cédant" },
          ]} />
        </Field>
      </div>
    </div>
  );
}

function StepOptions({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  const gap = data.gap;
  const nc = data.nonConcurrence;
  const cc = data.comptesCourants;

  return (
    <div>
      {/* GAP */}
      <SectionTitle>Garantie d&apos;Actif et de Passif (GAP)</SectionTitle>
      <Toggle checked={!!gap.active} onChange={v => set({ gap: { ...gap, active: v } })} label="Activer la GAP" />

      {gap.active && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Field label="Seuil par sinistre (franchise)">
            <Input value={gap.seuilParSinistre} onChange={v => set({ gap: { ...gap, seuilParSinistre: v } })} placeholder="1 000 €" />
          </Field>
          <Field label="Seuil annuel cumulé">
            <Input value={gap.seuilAnnuel} onChange={v => set({ gap: { ...gap, seuilAnnuel: v } })} placeholder="5 000 €" />
          </Field>
          <Field label="Plafond global d'indemnisation">
            <Input value={gap.plafond} onChange={v => set({ gap: { ...gap, plafond: v } })} placeholder="50 000 €" />
          </Field>
          <Field label="Durée (années)">
            <Input type="number" value={gap.dureeAnnees} onChange={v => set({ gap: { ...gap, dureeAnnees: v } })} placeholder="3" />
          </Field>
          <Field label="Délai de notification (mois)">
            <Input type="number" value={gap.notificationDelaiMois} onChange={v => set({ gap: { ...gap, notificationDelaiMois: v } })} placeholder="3" />
          </Field>
          <div className="col-span-2 mt-2">
            <Toggle checked={!!gap.escrow} onChange={v => set({ gap: { ...gap, escrow: v } })} label="Mettre en place un séquestre (Escrow)" />
          </div>
          {gap.escrow && (
            <>
              <Field label="Montant du séquestre">
                <Input value={gap.escrowMontant} onChange={v => set({ gap: { ...gap, escrowMontant: v } })} placeholder="10 000 €" />
              </Field>
              <Field label="Bénéficiaire / établissement séquestre">
                <Input value={gap.escrowBeneficiaire} onChange={v => set({ gap: { ...gap, escrowBeneficiaire: v } })} placeholder="Maître X, Notaire" />
              </Field>
            </>
          )}
        </div>
      )}

      {/* Compte courant */}
      <SectionTitle>Compte courant d&apos;associé</SectionTitle>
      <Field label="Situation du compte courant du cédant">
        <Select value={cc.option} onChange={v => set({ comptesCourants: { ...cc, option: v as "absent" | "cede" | "conserve" } })} options={[
          { value: "absent", label: "Aucun compte courant (ou renonciation)" },
          { value: "cede", label: "Cession du compte courant au cessionnaire" },
          { value: "conserve", label: "Conservation du compte courant par le cédant" },
        ]} />
      </Field>
      {(cc.option === "cede" || cc.option === "conserve") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mt-2">
          <Field label="Solde du compte courant">
            <Input value={cc.solde} onChange={v => set({ comptesCourants: { ...cc, solde: v } })} placeholder="5 000 €" />
          </Field>
          {cc.option === "conserve" && (
            <Field label="Délai de remboursement (mois)">
              <Input type="number" value={cc.delaiRemboursementMois} onChange={v => set({ comptesCourants: { ...cc, delaiRemboursementMois: v } })} placeholder="6" />
            </Field>
          )}
        </div>
      )}

      {/* Non-concurrence */}
      <SectionTitle>Clause de non-concurrence</SectionTitle>
      <Toggle checked={!!nc.active} onChange={v => set({ nonConcurrence: { ...nc, active: v } })} label="Inclure une clause de non-concurrence" />

      {nc.active && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Field label="Durée (années)">
            <Input type="number" value={nc.dureeAns} onChange={v => set({ nonConcurrence: { ...nc, dureeAns: v } })} placeholder="2" />
          </Field>
          <Field label="Zone géographique">
            <Input value={nc.zoneGeographique} onChange={v => set({ nonConcurrence: { ...nc, zoneGeographique: v } })} placeholder="France entière" />
          </Field>
          <div className="col-span-2 mt-2">
            <Toggle checked={!!nc.appliqueAuCessionnaire} onChange={v => set({ nonConcurrence: { ...nc, appliqueAuCessionnaire: v } })} label="Appliquer aussi au cessionnaire" />
          </div>
          {nc.appliqueAuCessionnaire && (
            <>
              <Field label="Durée pour le cessionnaire (années)">
                <Input type="number" value={nc.dureeAnsCessionnaire} onChange={v => set({ nonConcurrence: { ...nc, dureeAnsCessionnaire: v } })} placeholder="2" />
              </Field>
              <Field label="Zone géo cessionnaire">
                <Input value={nc.zoneGeoCessionnaire} onChange={v => set({ nonConcurrence: { ...nc, zoneGeoCessionnaire: v } })} placeholder="France entière" />
              </Field>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StepPV({ data, set }: { data: FormData; set: (d: Partial<FormData>) => void }) {
  const pv = data.pv;
  const upd = (k: string, v: unknown) => set({ pv: { ...pv, [k]: v } });

  return (
    <div>
      <SectionTitle>Procès-Verbal d&apos;Assemblée</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <Field label="Type d'assemblée">
          <Select value={pv.typeAssemblee} onChange={v => upd("typeAssemblee", v)} options={[
            { value: "associe_unique", label: "Décision de l'associé unique" },
            { value: "unanime", label: "Décisions unanimes des associés" },
            { value: "AGE", label: "Assemblée Générale Extraordinaire (AGE)" },
          ]} />
        </Field>
        <Field label="Ville" required>
          <Input value={pv.ville} onChange={v => set({ pv: { ...pv, ville: v }, ville: data.ville || v })} placeholder="Paris" />
        </Field>
        <Field label="Date" required>
          <Input type="date" value={pv.date} onChange={v => set({ pv: { ...pv, date: v }, date: data.date || v })} />
        </Field>

        {pv.typeAssemblee === "AGE" && (
          <>
            <Field label="Heure de la réunion">
              <Input type="time" value={pv.heure} onChange={v => upd("heure", v)} />
            </Field>
            <Field label="Mode de convocation">
              <Select value={pv.convocationMode || ""} onChange={v => upd("convocationMode", v)} options={[
                { value: "lettre recommandée", label: "Lettre recommandée" },
                { value: "lettre simple", label: "Lettre simple" },
                { value: "mail", label: "Email" },
                { value: "remise en mains propres", label: "Remise en mains propres" },
              ]} />
            </Field>
            <Field label="Date de convocation">
              <Input type="date" value={pv.convocationDate} onChange={v => upd("convocationDate", v)} />
            </Field>
            <Field label="Civilité du président">
              <Select value={pv.presidentCivilite || "M."} onChange={v => upd("presidentCivilite", v)} options={[{ value: "M.", label: "M." }, { value: "Mme", label: "Mme" }]} />
            </Field>
            <Field label="Nom du président de séance">
              <Input value={pv.presidentNom} onChange={v => upd("presidentNom", v)} />
            </Field>
            <Field label="Prénom du président">
              <Input value={pv.presidentPrenom} onChange={v => upd("presidentPrenom", v)} />
            </Field>
            <Field label="Qualité du président">
              <Select value={pv.presidentQualite || ""} onChange={v => upd("presidentQualite", v)} options={[
                { value: "gérant", label: "Gérant" },
                { value: "président", label: "Président" },
                { value: "associé", label: "Associé" },
              ]} />
            </Field>
            <div className="col-span-2 mt-2">
              <Toggle checked={!!pv.questionsEcrites} onChange={v => upd("questionsEcrites", v)} label="Des questions écrites ont été adressées préalablement" />
            </div>
          </>
        )}
      </div>

      <SectionTitle>Changement de dirigeant</SectionTitle>
      <Toggle checked={!!pv.changementDirigeant} onChange={v => upd("changementDirigeant", v)} label="Changement de dirigeant lors de cette cession" />

      {pv.changementDirigeant && (
        <div className="mt-4 space-y-6">
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm font-semibold text-red-700 mb-3">Dirigeant sortant</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <Field label="Civilité">
                <Select value={pv.ancienDirigeantCivilite || "M."} onChange={v => upd("ancienDirigeantCivilite", v)} options={[{ value: "M.", label: "M." }, { value: "Mme", label: "Mme" }]} />
              </Field>
              <Field label="Nom"><Input value={pv.ancienDirigeantNom} onChange={v => upd("ancienDirigeantNom", v)} /></Field>
              <Field label="Prénom"><Input value={pv.ancienDirigeantPrenom} onChange={v => upd("ancienDirigeantPrenom", v)} /></Field>
              <Field label="Date de naissance"><Input type="date" value={pv.ancienDirigeantDateNaissance} onChange={v => upd("ancienDirigeantDateNaissance", v)} /></Field>
              <Field label="Fonction">
                <Select value={pv.ancienDirigeantFonction || ""} onChange={v => upd("ancienDirigeantFonction", v)} options={[
                  { value: "gérant", label: "Gérant" },
                  { value: "président", label: "Président" },
                  { value: "directeur général", label: "Directeur Général" },
                ]} />
              </Field>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-semibold text-green-700 mb-3">Nouveau dirigeant</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <Field label="Fonction attribuée">
                <Select value={pv.nouveauDirigeantFonction || ""} onChange={v => upd("nouveauDirigeantFonction", v)} options={[
                  { value: "gérant", label: "Gérant" },
                  { value: "président", label: "Président" },
                  { value: "directeur général", label: "Directeur Général" },
                  { value: "directeur général délégué", label: "Directeur Général Délégué" },
                ]} />
              </Field>
              <Field label="Durée du mandat">
                <Select value={pv.dureeMandat || "illimitée"} onChange={v => upd("dureeMandat", v)} options={[
                  { value: "illimitée", label: "Durée illimitée" },
                  { value: "1 an", label: "1 an" },
                  { value: "2 ans", label: "2 ans" },
                  { value: "3 ans", label: "3 ans" },
                  { value: "6 ans", label: "6 ans" },
                ]} />
              </Field>
            </div>
            <p className="text-xs text-green-600 mt-2">Les informations du cessionnaire (nom, prénom, adresse) seront reprises automatiquement.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StepRecap({ data, onGenerate }: { data: FormData; onGenerate: () => void }) {
  const cedantNom = data.cedant.typePersonne === "physique"
    ? `${data.cedant.physique?.civilite} ${data.cedant.physique?.nom} ${data.cedant.physique?.prenom}`
    : data.cedant.morale?.denomination;
  const cessNom = data.cessionnaire.typePersonne === "physique"
    ? `${data.cessionnaire.physique?.civilite} ${data.cessionnaire.physique?.nom} ${data.cessionnaire.physique?.prenom}`
    : data.cessionnaire.morale?.denomination;

  const rows = [
    ["Société", data.societe.denomination || "—", data.societe.formeJuridique || "—"],
    ["Cédant", cedantNom || "—", `${data.cedant.nombreTitresCedes || "?"} titres`],
    ["Cessionnaire", cessNom || "—", ""],
    ["Prix", data.prix.prixTotal || "—", data.prix.typePaiement === "comptant" ? "Comptant" : "Échelonné"],
    ["GAP", data.gap.active ? "Oui" : "Non", data.gap.active ? `Plafond : ${data.gap.plafond || "?"}` : ""],
    ["Non-concurrence", data.nonConcurrence.active ? `${data.nonConcurrence.dureeAns} ans` : "Non", ""],
    ["PV", data.pv.typeAssemblee === "AGE" ? "AGE" : data.pv.typeAssemblee === "associe_unique" ? "Associé unique" : "Unanime", data.pv.changementDirigeant ? "Changement de dirigeant" : ""],
    ["Signature", `${data.ville || "—"}, le ${data.date || "—"}`, ""],
  ];

  return (
    <div>
      <SectionTitle>Récapitulatif de la cession</SectionTitle>
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([label, val1, val2], i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                <td className="px-4 py-3 font-medium text-gray-600 w-36">{label}</td>
                <td className="px-4 py-3 text-gray-900">{val1}</td>
                <td className="px-4 py-3 text-gray-500">{val2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
        <p>Les documents générés sont fournis à titre informatif. Faites-les vérifier par un professionnel du droit avant signature.</p>
      </div>
      <button
        onClick={onGenerate}
        className="mt-6 w-full bg-[#1a2744] text-white py-3 rounded-xl font-semibold hover:bg-[#2a3754] transition-colors"
      >
        Générer les documents avec Claude AI
      </button>
    </div>
  );
}

// ─── Cover page builder ───────────────────────────────────────────────────────
function buildCoverHtml(data: FormData, docType: "acte" | "pv"): string {
  function esc(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  const typeTitre = ["SARL", "EURL", "SNC", "SCI"].includes(data.societe.formeJuridique || "")
    ? "parts sociales" : "actions";
  const nomCedant = data.cedant.typePersonne === "physique" && data.cedant.physique
    ? `${data.cedant.physique.civilite} ${data.cedant.physique.nom} ${data.cedant.physique.prenom}`.trim()
    : data.cedant.morale?.denomination || "—";
  const nomCessionnaire = data.cessionnaire.typePersonne === "physique" && data.cessionnaire.physique
    ? `${data.cessionnaire.physique.civilite} ${data.cessionnaire.physique.nom} ${data.cessionnaire.physique.prenom}`.trim()
    : data.cessionnaire.morale?.denomination || "—";
  const dateFormatted = data.date
    ? new Date(data.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : "—";
  const title = docType === "acte"
    ? `ACTE DE CESSION<br>DE ${typeTitre.toUpperCase()}`
    : `PROC&Egrave;S-VERBAL<br>${data.pv.typeAssemblee === "AGE" ? "D&apos;ASSEMBL&Eacute;E G&Eacute;N&Eacute;RALE EXTRAORDINAIRE" : data.pv.typeAssemblee === "associe_unique" ? "DE L&apos;ASSOCI&Eacute; UNIQUE" : "DE D&Eacute;CISIONS UNANIMES"}`;

  const partiesBlock = docType === "acte" ? `
    <div style="margin-bottom:22px">
      <div style="font-size:8px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:5px">C&Eacute;DANT (VENDEUR)</div>
      <div style="font-size:15px;font-weight:bold;color:#1a2744">${esc(nomCedant)}</div>
    </div>
    <div style="height:1px;background:#f0f0f0;margin-bottom:22px"></div>
    <div style="margin-bottom:22px">
      <div style="font-size:8px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:5px">CESSIONNAIRE (ACH&Egrave;TEUR)</div>
      <div style="font-size:15px;font-weight:bold;color:#1a2744">${esc(nomCessionnaire)}</div>
    </div>
    <div style="height:1px;background:#f0f0f0;margin-bottom:22px"></div>
    <div style="margin-bottom:22px">
      <div style="font-size:8px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:5px">SOCI&Eacute;T&Eacute; CIBLE</div>
      <div style="font-size:15px;font-weight:bold;color:#1a2744">${esc(data.societe.denomination || "—")}</div>
      <div style="font-size:11px;color:#666;margin-top:3px">${esc(data.societe.formeJuridique || "")} &mdash; Capital&nbsp;: ${esc(data.societe.capital || "—")} &mdash; ${esc(data.cedant.nombreTitresCedes || "—")} ${typeTitre} c&eacute;d&eacute;es</div>
    </div>
    <div style="height:1px;background:#f0f0f0;margin-bottom:22px"></div>
    <div>
      <div style="font-size:8px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:5px">PRIX DE CESSION</div>
      <div style="font-size:15px;font-weight:bold;color:#1a2744">${esc(data.prix.prixTotal || "—")}</div>
      <div style="font-size:11px;color:#666;margin-top:3px">${data.prix.typePaiement === "comptant" ? "Paiement comptant" : "Paiement &eacute;chelonn&eacute;"}</div>
    </div>` : `
    <div style="margin-bottom:22px">
      <div style="font-size:8px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:5px">SOCI&Eacute;T&Eacute;</div>
      <div style="font-size:15px;font-weight:bold;color:#1a2744">${esc(data.societe.denomination || "—")}</div>
      <div style="font-size:11px;color:#666;margin-top:3px">${esc(data.societe.formeJuridique || "")} &mdash; Capital&nbsp;: ${esc(data.societe.capital || "—")}</div>
    </div>
    <div style="height:1px;background:#f0f0f0;margin-bottom:22px"></div>
    <div style="margin-bottom:22px">
      <div style="font-size:8px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:5px">C&Eacute;DANT</div>
      <div style="font-size:15px;font-weight:bold;color:#1a2744">${esc(nomCedant)}</div>
    </div>
    <div style="height:1px;background:#f0f0f0;margin-bottom:22px"></div>
    <div>
      <div style="font-size:8px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:5px">CESSIONNAIRE</div>
      <div style="font-size:15px;font-weight:bold;color:#1a2744">${esc(nomCessionnaire)}</div>
    </div>`;

  return `<div style="width:794px;height:1123px;background:#fff;position:relative;overflow:hidden;box-sizing:border-box;font-family:Arial,Helvetica,sans-serif">
  <div style="position:absolute;left:0;top:0;width:6px;height:100%;background:#1a2744"></div>
  <div style="position:absolute;top:0;left:6px;right:0;height:3px;background:#22c55e"></div>
  <div style="padding:65px 65px 50px 78px;height:100%;box-sizing:border-box;display:flex;flex-direction:column">
    <div style="margin-bottom:60px">
      <span style="font-size:22px;color:#1a2744;font-weight:bold;letter-spacing:-0.5px">Legal<span style="color:#22c55e">Corners</span></span>
    </div>
    <div style="margin-bottom:42px">
      <span style="display:inline-block;border:1px solid #1a2744;padding:4px 14px;font-size:9px;letter-spacing:2px;color:#1a2744;text-transform:uppercase">Confidentiel</span>
    </div>
    <div style="font-size:9px;letter-spacing:2px;color:#22c55e;text-transform:uppercase;margin-bottom:10px;font-weight:bold">Document Juridique</div>
    <div style="font-size:24px;font-weight:bold;color:#1a2744;line-height:1.25;margin-bottom:10px;font-family:Georgia,serif">${title}</div>
    <div style="width:48px;height:3px;background:#22c55e;margin-bottom:44px"></div>
    <div style="flex:1">${partiesBlock}</div>
    <div style="border-top:1px solid #e5e7eb;padding-top:18px;margin-top:16px;display:flex;justify-content:space-between;align-items:flex-end">
      <div>
        <div style="font-size:10px;color:#444;font-weight:bold">Fait &agrave; ${esc(data.ville || "—")}, le ${esc(dateFormatted)}</div>
        <div style="font-size:8px;color:#aaa;margin-top:3px">Document confidentiel &mdash; LegalCorners &mdash; Usage r&eacute;serv&eacute; aux professionnels</div>
      </div>
      <div style="font-size:8px;color:#ccc">Page de garde</div>
    </div>
  </div>
</div>`;
}

// ─── Body HTML builder ────────────────────────────────────────────────────────
function buildBodyHtml(text: string): string {
  const lines = text.split("\n");
  const parts: string[] = [];
  let inList = false;
  let inTable = false;
  let tableRows: string[] = [];
  let isFirstTableRow = true;

  function flushList() {
    if (inList) { parts.push(`</ul>`); inList = false; }
  }
  function flushTable() {
    if (inTable) {
      parts.push(`<table style="width:100%;border-collapse:collapse;margin:10px 0;font-size:10px">${tableRows.join("")}</table>`);
      tableRows = []; inTable = false; isFirstTableRow = true;
    }
  }
  function esc(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    const isTableLine = t.startsWith("|") && t.endsWith("|") && t.length > 2;
    const isBullet = t.startsWith("•") || t.startsWith("*") || t.startsWith("-\u00a0") || /^[-*]\s/.test(t);

    if (!isTableLine) flushTable();
    if (!isBullet) flushList();

    // Separators
    if (/^═{5,}/.test(t)) { parts.push(`<div style="border-top:2px solid #1a2744;margin:10px 0"></div>`); continue; }
    if (/^─{5,}/.test(t)) { parts.push(`<div style="border-top:1px solid #ddd;margin:6px 0"></div>`); continue; }
    // Markdown table separator
    if (/^\|[-|: ]+\|$/.test(t)) continue;

    // Table rows
    if (isTableLine) {
      const cells = t.split("|").map(c => c.trim()).filter(c => c !== "");
      const nextLine = lines[i + 1]?.trim() || "";
      const isHeader = isFirstTableRow || /^\|[-|: ]+\|$/.test(nextLine);
      if (!inTable) inTable = true;
      if (isHeader) {
        tableRows.push(`<tr>${cells.map(c => `<th style="border:1px solid #1a2744;padding:7px 10px;background:#1a2744;color:#fff;font-weight:bold;text-align:left;font-size:10px">${esc(c)}</th>`).join("")}</tr>`);
      } else {
        const bg = tableRows.length % 2 === 1 ? "#f8f9fc" : "#fff";
        tableRows.push(`<tr style="background:${bg}">${cells.map((c, ci) => `<td style="border:1px solid #dde;padding:6px 10px;text-align:left;font-size:10px;${ci === 0 ? "font-weight:bold;color:#1a2744;width:35%" : "color:#333"}">${esc(c)}</td>`).join("")}</tr>`);
      }
      if (isFirstTableRow) isFirstTableRow = false;
      continue;
    }

    if (t === "") { parts.push(`<div style="height:6px"></div>`); continue; }

    // INDEX DES DÉFINITIONS section title
    if (/^INDEX DES D[EÉ]FINITIONS/.test(t)) {
      parts.push(`<div style="margin:18px 0 8px;padding:10px 14px;background:#1a2744;color:#fff;font-size:11px;font-weight:bold;font-family:Georgia,serif;letter-spacing:0.5px;text-transform:uppercase">${esc(t)}</div>`);
      continue;
    }
    // Main doc title (CESSION D'ACTIONS / PROCÈS-VERBAL)
    if (/^(CESSION D|ACTE DE CESSION|PROC[EÈ]S-VERBAL|D[EÉ]CISIONS UNANIMES)/i.test(t)) {
      parts.push(`<div style="font-size:13px;color:#1a2744;font-weight:bold;text-align:center;margin:12px 0 4px;font-family:Georgia,serif;text-transform:uppercase">${esc(t)}</div>`);
      continue;
    }
    // ARTICLE / RÉSOLUTION headers
    if (/^(ARTICLE \d+|R[EÉ]SOLUTION \d+|OUVERTURE|SIGNATURES|ORDRE DU JOUR)/i.test(t)) {
      parts.push(`<div style="margin:16px 0 4px;padding:6px 12px;border-left:4px solid #22c55e;background:#f8f9fc;font-size:10.5px;color:#1a2744;font-weight:bold;text-transform:uppercase;letter-spacing:0.4px">${esc(t)}</div>`);
      continue;
    }
    // Sub-section X.X
    if (/^\d+\.\d+\s/.test(t)) {
      parts.push(`<div style="font-size:10.5px;color:#1a2744;font-weight:bold;margin:10px 0 3px;padding-left:2px">${esc(t)}</div>`);
      continue;
    }
    // OPTION lines
    if (/^OPTION\s*[—\-–]/.test(t) || /^Option\s+\d/.test(t)) {
      parts.push(`<div style="font-size:9.5px;color:#666;font-style:italic;margin:8px 0 2px;padding:3px 8px;border-left:2px solid #22c55e;background:#f0fdf4">${esc(t)}</div>`);
      continue;
    }
    // D'UNE PART / D'AUTRE PART
    if (/^D[''']?(UNE|AUTRE) PART/.test(t)) {
      parts.push(`<div style="font-size:10px;font-weight:bold;color:#1a2744;margin:6px 0;text-align:right;font-style:italic">${esc(t)}</div>`);
      continue;
    }
    // Signature blocks
    if (/^(LE C[EÉ]DANT|LE CESSIONNAIRE|LE PR[EÉ]SIDENT|LE CONJOINT|L[''']ASSOCI[EÉ]|LE G[EÉ]RANT)/i.test(t)) {
      parts.push(`<div style="font-weight:bold;color:#1a2744;margin:14px 0 3px;font-size:10.5px">${esc(t)}</div>`);
      continue;
    }
    // Quote lines (Lu et approuvé / Bon pour)
    if (/^["""«]/.test(t) || /^(Lu et approuv|Bon pour)/.test(t)) {
      parts.push(`<div style="font-size:10px;color:#555;font-style:italic;margin:2px 0">${esc(t)}</div>`);
      continue;
    }
    // Bullet points
    if (isBullet) {
      if (!inList) { parts.push(`<ul style="margin:4px 0;padding-left:20px">`); inList = true; }
      const content = t.replace(/^[•*-]\s*/, "");
      parts.push(`<li style="margin:2px 0;font-size:10.5px;color:#333">${esc(content)}</li>`);
      continue;
    }
    // Signature fill-in lines
    if (/^\[.*(Date|Signature|Nom|Pr[eé]nom).*\]/.test(t)) {
      parts.push(`<div style="font-size:10px;color:#888;margin:2px 0;font-style:italic">${esc(t)}</div>`);
      continue;
    }
    // Document confidentiel footer line
    if (/^Document confidentiel/.test(t)) {
      parts.push(`<div style="font-size:9px;color:#aaa;margin:10px 0 2px;text-align:center;border-top:1px solid #eee;padding-top:6px">${esc(t)}</div>`);
      continue;
    }
    // Regular paragraph
    parts.push(`<p style="margin:3px 0;font-size:10.5px;color:#222;line-height:1.55">${esc(t)}</p>`);
  }

  flushList();
  flushTable();
  return `<div style="padding:55px 65px;font-family:Arial,Helvetica,sans-serif;line-height:1.55;color:#222">${parts.join("")}</div>`;
}

// ─── PDF helper ───────────────────────────────────────────────────────────────
async function downloadPdf(content: string, filename: string, data: FormData, docType: "acte" | "pv") {
  const { jsPDF } = await import("jspdf");
  const { default: html2canvas } = await import("html2canvas");

  const A4_W_PX = 794;

  async function renderHtmlToCanvas(html: string, fixedHeight?: number): Promise<HTMLCanvasElement> {
    const wrapper = document.createElement("div");
    Object.assign(wrapper.style, {
      position: "absolute",
      top: "-99999px",
      left: "-99999px",
      width: `${A4_W_PX}px`,
      background: "#fff",
      boxSizing: "border-box",
      ...(fixedHeight ? { height: `${fixedHeight}px`, overflow: "hidden" } : {}),
    });
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: A4_W_PX,
      ...(fixedHeight ? { height: fixedHeight } : {}),
    });
    document.body.removeChild(wrapper);
    return canvas;
  }

  // Render cover page (fixed A4 height)
  const coverCanvas = await renderHtmlToCanvas(buildCoverHtml(data, docType), 1123);
  // Render body
  const bodyCanvas = await renderHtmlToCanvas(buildBodyHtml(content));

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const A4_W = coverCanvas.width;
  const A4_H = Math.round(A4_W * (297 / 210));

  // ── Page 1: cover ──
  const coverPage = document.createElement("canvas");
  coverPage.width = A4_W;
  coverPage.height = A4_H;
  const cCtx = coverPage.getContext("2d")!;
  cCtx.fillStyle = "#fff";
  cCtx.fillRect(0, 0, A4_W, A4_H);
  cCtx.drawImage(coverCanvas, 0, 0, A4_W, Math.min(A4_H, coverCanvas.height), 0, 0, A4_W, A4_H);
  doc.addImage(coverPage.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 210, 297);

  // ── Body pages ──
  const bodyA4W = bodyCanvas.width;
  const bodyA4H = Math.round(bodyA4W * (297 / 210));
  let pageTop = 0;
  let pageNum = 2;
  const totalPages = Math.ceil(bodyCanvas.height / bodyA4H) + 1;

  while (pageTop < bodyCanvas.height) {
    doc.addPage();
    const sliceH = Math.min(bodyA4H, bodyCanvas.height - pageTop);
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = bodyA4W;
    pageCanvas.height = bodyA4H;
    const ctx = pageCanvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, bodyA4W, bodyA4H);
    ctx.drawImage(bodyCanvas, 0, pageTop, bodyA4W, sliceH, 0, 0, bodyA4W, sliceH);
    doc.addImage(pageCanvas.toDataURL("image/jpeg", 0.93), "JPEG", 0, 0, 210, 297);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`${pageNum} / ${totalPages}`, 105, 291, { align: "center" });
    doc.text("Document confidentiel — LegalCorners", 20, 291);
    pageTop += bodyA4H;
    pageNum++;
  }

  doc.save(filename);
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CessionParts() {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<FormData>(initialData);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState("");
  const [acteText, setActeText] = useState("");
  const [pvText, setPvText] = useState("");
  const [preview, setPreview] = useState<"acte" | "pv" | null>(null);

  const currentStep = STEPS[stepIndex];

  function set(partial: Partial<FormData>) {
    setData(prev => ({ ...prev, ...partial }));
  }

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setLoadingMsg("Claude rédige l'acte de cession...");

    try {
      const res = await fetch("/api/generate-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: data, type: "both" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur serveur");
      }

      setLoadingMsg("Claude rédige le PV AG...");
      const result = await res.json();
      setActeText(result.acte || "");
      setPvText(result.pv || "");
      setGenerated(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1a2744] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-white font-bold text-xl tracking-tight">
            Legal<span className="text-green-400">Corners</span>
          </div>
        </div>
        <span className="text-sm text-gray-300">Cession de parts sociales / actions</span>
        <a href="#" className="text-sm text-gray-300 hover:text-white">Connexion</a>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Step progress */}
        <div className="flex items-start gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => i < stepIndex && setStepIndex(i)}
                className="flex flex-col items-center gap-1"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  i < stepIndex ? "bg-green-500 text-white" :
                  i === stepIndex ? "bg-[#1a2744] text-white" :
                  "bg-gray-200 text-gray-500"
                }`}>
                  {i < stepIndex ? "✓" : i + 1}
                </div>
                <span className={`text-xs text-center max-w-[70px] leading-tight ${i === stepIndex ? "text-[#1a2744] font-semibold" : "text-gray-500"}`}>
                  {step.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mt-[-10px] ${i < stepIndex ? "bg-green-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
              <div className="w-12 h-12 border-4 border-[#1a2744] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-semibold text-[#1a2744]">{loadingMsg || "Génération en cours..."}</p>
              <p className="text-sm text-gray-500 mt-2">Claude rédige vos documents juridiques</p>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              ⚠ {error}
            </div>
          )}
          {!generated ? (
            <>
              {currentStep.id === "societe" && <StepSociete data={data} set={set} />}
              {currentStep.id === "cedant" && <StepCedant data={data} set={set} />}
              {currentStep.id === "cessionnaire" && <StepCessionnaire data={data} set={set} />}
              {currentStep.id === "prix" && <StepPrix data={data} set={set} />}
              {currentStep.id === "options" && <StepOptions data={data} set={set} />}
              {currentStep.id === "pv" && <StepPV data={data} set={set} />}
              {currentStep.id === "recap" && <StepRecap data={data} onGenerate={handleGenerate} />}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setStepIndex(i => Math.max(0, i - 1))}
                  disabled={stepIndex === 0}
                  className="px-5 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Précédent
                </button>
                {stepIndex < STEPS.length - 1 && (
                  <button
                    onClick={() => setStepIndex(i => Math.min(STEPS.length - 1, i + 1))}
                    className="px-5 py-2 rounded-lg bg-[#1a2744] text-white text-sm font-medium hover:bg-[#2a3754]"
                  >
                    Suivant →
                  </button>
                )}
              </div>
            </>
          ) : (
            /* ── Generated documents ── */
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xl">✓</div>
                <div>
                  <h2 className="font-bold text-[#1a2744] text-lg">Document généré avec succès !</h2>
                  <p className="text-sm text-gray-500">Votre acte de cession et PV AG sont prêts</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setPreview(preview === "acte" ? null : "acte")}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#1a2744] text-white rounded-xl font-medium hover:bg-[#2a3754]"
                >
                  <span>👁 Aperçu — Acte de cession</span>
                  <span>{preview === "acte" ? "▲" : "▼"}</span>
                </button>
                {preview === "acte" && (
                  <pre className="text-xs bg-gray-50 border rounded-xl p-4 max-h-96 overflow-y-auto whitespace-pre-wrap font-mono">{acteText}</pre>
                )}

                <button
                  onClick={() => setPreview(preview === "pv" ? null : "pv")}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#1a2744] text-white rounded-xl font-medium hover:bg-[#2a3754]"
                >
                  <span>👁 Aperçu — PV Assemblée Générale</span>
                  <span>{preview === "pv" ? "▲" : "▼"}</span>
                </button>
                {preview === "pv" && (
                  <pre className="text-xs bg-gray-50 border rounded-xl p-4 max-h-96 overflow-y-auto whitespace-pre-wrap font-mono">{pvText}</pre>
                )}

                <button
                  onClick={() => downloadPdf(acteText, `acte-cession-${data.societe.denomination || "societe"}.pdf`, data, "acte")}
                  className="w-full flex items-center gap-2 justify-center px-4 py-3 border-2 border-[#1a2744] text-[#1a2744] rounded-xl font-medium hover:bg-[#1a2744] hover:text-white transition-colors"
                >
                  ⬇ Télécharger l&apos;acte de cession (PDF)
                </button>
                <button
                  onClick={() => downloadPdf(pvText, `pv-ag-${data.societe.denomination || "societe"}.pdf`, data, "pv")}
                  className="w-full flex items-center gap-2 justify-center px-4 py-3 border-2 border-[#1a2744] text-[#1a2744] rounded-xl font-medium hover:bg-[#1a2744] hover:text-white transition-colors"
                >
                  ⬇ Télécharger le PV AG (PDF)
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-blue-700 flex gap-2">
                <span>ℹ</span>
                <span>Formule Premium : Un juriste vérifiera votre dossier sous 24h.</span>
              </div>

              <button
                onClick={() => { setGenerated(false); setStepIndex(0); setData(initialData); }}
                className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Recommencer un nouveau dossier
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-center gap-6 mt-8 text-xs text-gray-400">
          <span>🔒 Sécurisé</span>
          <span>⚡ Rapide</span>
          <span>💬 Support</span>
        </div>
        <p className="text-center text-xs text-gray-400 mt-3">
          Besoin d&apos;aide ? <a href="mailto:support@legalcorners.fr" className="underline">support@legalcorners.fr</a>
        </p>
      </div>
    </div>
  );
}
