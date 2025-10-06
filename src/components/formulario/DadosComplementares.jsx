import React from "react";
import { AlertCircle } from "lucide-react";

const TIPOS_ONIBUS = ["Padron", "Convencional", "Articulado"];

export default function DadosComplementares({ formData, errors, onChange }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm">
      <header className="border-b border-slate-100 px-5 py-4">
        <h2 className="flex items-center gap-3 text-slate-800 font-semibold text-base">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-bold">
            2
          </span>
          Dados Complementares
        </h2>
      </header>

      <div className="grid grid-cols-1 gap-4 px-5 py-4">
        <div className="space-y-2">
          <label htmlFor="data_hora_ocorrencia" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            Data e hora da ocorrência <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="data_hora_ocorrencia"
            name="data_hora_ocorrencia"
            required
            value={formData.data_hora_ocorrencia}
            onChange={(event) => onChange("data_hora_ocorrencia", event.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${
              errors.data_hora_ocorrencia ? "border-red-400" : "border-slate-200"
            }`}
          />
          {errors.data_hora_ocorrencia ? (
            <p className="flex items-center gap-1 text-sm text-red-600" role="alert">
              <AlertCircle className="h-4 w-4" />
              {errors.data_hora_ocorrencia}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="linha" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            Número da linha <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="linha"
            name="linha"
            required
            value={formData.linha}
            onChange={(event) => onChange("linha", event.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${
              errors.linha ? "border-red-400" : "border-slate-200"
            }`}
          />
          {errors.linha ? (
            <p className="flex items-center gap-1 text-sm text-red-600" role="alert">
              <AlertCircle className="h-4 w-4" />
              {errors.linha}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="numero_veiculo" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            Número do veículo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="numero_veiculo"
            name="numero_veiculo"
            required
            value={formData.numero_veiculo}
            onChange={(event) => onChange("numero_veiculo", event.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${
              errors.numero_veiculo ? "border-red-400" : "border-slate-200"
            }`}
          />
          {errors.numero_veiculo ? (
            <p className="flex items-center gap-1 text-sm text-red-600" role="alert">
              <AlertCircle className="h-4 w-4" />
              {errors.numero_veiculo}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="local_ocorrencia" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            Local da ocorrência <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="local_ocorrencia"
            name="local_ocorrencia"
            required
            value={formData.local_ocorrencia}
            onChange={(event) => onChange("local_ocorrencia", event.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${
              errors.local_ocorrencia ? "border-red-400" : "border-slate-200"
            }`}
          />
          {errors.local_ocorrencia ? (
            <p className="flex items-center gap-1 text-sm text-red-600" role="alert">
              <AlertCircle className="h-4 w-4" />
              {errors.local_ocorrencia}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="tipo_onibus" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            Tipo de ônibus <span className="text-red-500">*</span>
          </label>
          <select
            id="tipo_onibus"
            name="tipo_onibus"
            required
            value={formData.tipo_onibus}
            onChange={(event) => onChange("tipo_onibus", event.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${
              errors.tipo_onibus ? "border-red-400" : "border-slate-200"
            }`}
          >
            <option value="">Selecione...</option>
            {TIPOS_ONIBUS.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
          {errors.tipo_onibus ? (
            <p className="flex items-center gap-1 text-sm text-red-600" role="alert">
              <AlertCircle className="h-4 w-4" />
              {errors.tipo_onibus}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
