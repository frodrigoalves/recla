import React from "react";
import { AlertCircle } from "lucide-react";

const ASSUNTOS = [
  "ACESSIBILIDADE",
  "AUSÊNCIA DE AGENTE DE BORDO",
  "CARTÃO BHBUS / RECARGA À BORDO",
  "COMPORTAMENTO INADEQUADO DO MOTORISTA/AGENTE DE BORDO X IDOSO",
  "DESCUMPRIMENTO DE ITINERARIO",
  "ESTADO DE CONSERVAÇÃO DO VEÍCULO",
  "SUPERLOTAÇÃO",
  "TEMPO DE ESPERA",
  "TARIFA",
];

export default function DadosBasicos({ formData, errors, onChange }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm">
      <header className="border-b border-slate-100 px-5 py-4">
        <h2 className="flex items-center gap-3 text-slate-800 font-semibold text-base">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-bold">
            1
          </span>
          Dados da Reclamação
        </h2>
      </header>

      <div className="space-y-3 px-5 py-4">
        <label htmlFor="assunto" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          Assunto <span className="text-red-500">*</span>
        </label>
        <select
          id="assunto"
          name="assunto"
          required
          value={formData.assunto}
          onChange={(event) => onChange("assunto", event.target.value)}
          className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${
            errors.assunto ? "border-red-400" : "border-slate-200"
          }`}
        >
          <option value="">Selecione o assunto da sua reclamação...</option>
          {ASSUNTOS.map((assunto) => (
            <option key={assunto} value={assunto}>
              {assunto}
            </option>
          ))}
        </select>
        {errors.assunto ? (
          <p className="flex items-center gap-1 text-sm text-red-600" role="alert">
            <AlertCircle className="h-4 w-4" />
            {errors.assunto}
          </p>
        ) : null}
      </div>
    </section>
  );
}
