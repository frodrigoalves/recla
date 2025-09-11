import React from "react";

export default function DescricaoReclamacao({ data, onChange }) {
  const maxLength = 1000;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Descrição</h2>
      <textarea
        placeholder="Descreva o ocorrido..."
        value={data.descricao}
        onChange={(e) => onChange("descricao", e.target.value)}
        maxLength={maxLength}
        className="w-full border border-gray-300 p-3 rounded-lg h-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p className="text-sm text-gray-500">
        {data.descricao.length} / {maxLength} caracteres
      </p>
    </div>
  );
}
