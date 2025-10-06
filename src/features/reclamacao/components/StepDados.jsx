import { Bus, MapPin } from "lucide-react";
import { Field } from "./Field";

export function StepDados({ form, update, errors, assuntos, linhas }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Field label="Protocolo">
        <input
          value={form.protocolo}
          disabled
          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-100 text-gray-700"
        />
      </Field>

      <Field label="Assunto" error={errors.assunto}>
        <select
          value={form.assunto}
          onChange={(event) => update("assunto", event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="">Selecione...</option>
          {assuntos.map((assunto) => (
            <option key={assunto} value={assunto}>
              {assunto}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Data e hora da ocorrência" error={errors.data_hora_ocorrencia}>
        <input
          type="datetime-local"
          value={form.data_hora_ocorrencia}
          onChange={(event) => update("data_hora_ocorrencia", event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </Field>

      <Field label="Linha" error={errors.linha}>
        <select
          value={form.linha}
          onChange={(event) => update("linha", event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="">Selecione...</option>
          {linhas.map((linha) => (
            <option key={linha} value={linha}>
              {linha}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Número do veículo">
        <div className="relative">
          <Bus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            placeholder="Ex.: 12345"
            value={form.numero_veiculo}
            onChange={(event) => update("numero_veiculo", event.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </Field>

      <Field label="Local da ocorrência" error={errors.local_ocorrencia}>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            placeholder="Rua/Estação/Ponto"
            value={form.local_ocorrencia}
            onChange={(event) => update("local_ocorrencia", event.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </Field>
    </section>
  );
}
