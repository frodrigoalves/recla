import React from "react";

export default function DadosComplementares({ data, onChange }) {
  const linhas = [
    "85 - EST.S.GABRIEL/CENTRO-VIA FLORESTA",
    "812 - ESTAÇÃO SÃO GABRIEL",
    "815 - ESTAÇÃO SÃO GABRIEL/CONJ. PAULO VI",
    "822 - ESTAÇÃO JOSÉ CÂNDIDO / VILA MARIA",
    "5201 - DONA CLARA/BURITIS",
    "5401 - SÃO LUIZ/DOM CABRAL",
    "9105 - NOVA VISTA/SION",
    "9204 - SANTA EFIGÊNIA/ESTORIL",
    "9208 - TAQUARIL/CONJ. SANTA MARIA",
    "9211 - CAETANO FURQUIM/HAVAI",
    "9214 - CAETANO FURQUIM/HAVAI - VIA ALTO HAVAI",
    "9250 - CAETANO FURQUIM/NOVA CINTRA"
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Dados Complementares</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Linha</label>
        <select
          value={data.linha}
          onChange={(e) => onChange("linha", e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-lg"
        >
          <option value="">Selecione uma linha</option>
          {linhas.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Número do Veículo</label>
        <input
          type="text"
          value={data.numero_veiculo}
          onChange={(e) => onChange("numero_veiculo", e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-lg"
        />
      </div>
    </div>
  );
}
