import React from "react";

export default function DadosBasicos({ data, onChange }) {
  const assuntos = [
    "ACESSIBILIDADE",
    "AUSÊNCIA DE AGENTE DE BORDO",
    "COMPORTAMENTO INADEQUADO DO MOTORISTA",
    "CONDIÇÕES DO VEÍCULO",
    "EXCESSO DE PASSAGEIROS",
    "FALTA DE ÔNIBUS",
    "FALTA DE PARADA",
    "HORÁRIOS / ATRASOS",
    "ITINERÁRIO / ROTA",
    "LIMPEZA DO VEÍCULO",
    "OUTROS"
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Dados Básicos</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Protocolo</label>
        <input
          type="text"
          value={data.protocolo}
          disabled
          className="w-full border border-gray-300 p-2 rounded-lg bg-gray-100 text-gray-600"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
        <select
          value={data.assunto}
          onChange={(e) => onChange("assunto", e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-lg"
        >
          <option value="">Selecione um assunto</option>
          {assuntos.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Data e Hora da Ocorrência</label>
        <input
          type="datetime-local"
          value={data.data_hora_ocorrencia}
          onChange={(e) => onChange("data_hora_ocorrencia", e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-lg"
        />
      </div>
    </div>
  );
}
