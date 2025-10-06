import { Mail, Phone } from "lucide-react";
import { Field } from "./Field";

export function StepContato({ form, update, errors }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="md:col-span-2 space-y-1">
        <p className="text-sm font-semibold text-gray-800">
          Dados para contato e acompanhamento da reclamação
        </p>
        <p className="text-xs text-gray-600">Preencha pelo menos um meio de contato (e-mail ou telefone).</p>
      </div>

      <Field label="Nome completo" error={errors.nome_completo}>
        <input
          value={form.nome_completo}
          onChange={(event) => update("nome_completo", event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          placeholder="Seu nome"
        />
      </Field>

      <Field label="E-mail" error={errors.email}>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="seuemail@dominio.com"
          />
        </div>
      </Field>

      <Field label="Telefone" error={errors.telefone}>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            value={form.telefone}
            onChange={(event) => update("telefone", event.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="(31) 9 9999-9999"
          />
        </div>
      </Field>

      <div className="md:col-span-2">
        <label className="flex items-start gap-3 p-4 rounded-lg border bg-gray-50">
          <input
            type="checkbox"
            checked={form.quer_retorno}
            onChange={(event) => update("quer_retorno", event.target.checked)}
            className="mt-1"
          />
          <span className="text-sm text-gray-700">Desejo ser contatado(a) sobre esta reclamação.</span>
        </label>
      </div>

      <div className="md:col-span-2">
        <label
          className={`flex items-start gap-3 p-4 rounded-lg border ${
            errors.lgpd_aceite ? "border-red-300 bg-red-50" : "bg-gray-50"
          }`}
        >
          <input
            type="checkbox"
            checked={form.lgpd_aceite}
            onChange={(event) => update("lgpd_aceite", event.target.checked)}
            className="mt-1"
          />
          <span className="text-sm text-gray-700">
            Li e concordo com o tratamento dos meus dados pessoais nos termos da LGPD para fins de registro e resposta desta reclamação.
          </span>
        </label>
        {errors.lgpd_aceite ? <p className="mt-1 text-xs text-red-600">{errors.lgpd_aceite}</p> : null}
      </div>
    </section>
  );
}
