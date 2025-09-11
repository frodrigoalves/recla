import React from "react";

export default function ContatoLGPD({ data, onChange }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Contato e LGPD</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
        <input
          type="text"
          value={data.nome_completo}
          onChange={(e) => onChange("nome_completo", e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => onChange("email", e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
        <input
          type="tel"
          value={data.telefone}
          onChange={(e) => onChange("telefone", e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-lg"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={data.lgpd_aceite}
          onChange={(e) => onChange("lgpd_aceite", e.target.checked)}
          className="h-4 w-4 text-blue-600"
        />
        <label className="text-sm text-gray-700">
          Autorizo o uso dos meus dados conforme a LGPD.
        </label>
      </div>
    </div>
  );
}
