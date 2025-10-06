import React, { useMemo } from "react";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useGoogleSheet } from "@/hooks/useGoogleSheet";
import { StatusPill } from "@/components/StatusPill";

const TABLE_COLUMNS = [
  { key: "protocolo", label: "Protocolo" },
  { key: "assunto", label: "Assunto" },
  { key: "dataHora", label: "Data/Hora" },
  { key: "linha", label: "Linha" },
  { key: "veiculo", label: "Veículo" },
  { key: "local", label: "Local" },
  { key: "descricao", label: "Descrição" },
  { key: "status", label: "Status" },
];

const SUMMARY_CONFIG = [
  {
    key: "total",
    label: "Total",
    icon: Clock,
    accentClass: "text-gray-400",
    valueClass: "text-2xl font-bold",
  },
  {
    key: "pendentes",
    label: "Pendentes",
    icon: AlertTriangle,
    accentClass: "text-red-500",
    valueClass: "text-2xl font-bold text-red-600",
  },
  {
    key: "analise",
    label: "Em Análise",
    icon: Clock,
    accentClass: "text-yellow-500",
    valueClass: "text-2xl font-bold text-yellow-600",
  },
  {
    key: "resolvidas",
    label: "Resolvidas",
    icon: CheckCircle,
    accentClass: "text-green-500",
    valueClass: "text-2xl font-bold text-green-600",
  },
];

export default function PainelPublico() {
  const sheetUrl = import.meta.env.VITE_SHEET_GVIZ;
  const { rows, loading, error } = useGoogleSheet(sheetUrl);

  const stats = useMemo(() => buildStats(rows), [rows]);
  const tableRows = useMemo(() => rows.map(mapRowToDisplay), [rows]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-800">Reclamações Públicas</h1>
        <p className="text-gray-500">Acompanhe as ocorrências registradas em tempo real</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {SUMMARY_CONFIG.map(({ key, label, icon, accentClass, valueClass }) => {
          const IconComponent = icon;
          return (
            <div
              key={key}
              className="p-5 bg-white shadow rounded-xl flex items-center gap-4 hover:shadow-lg transition"
            >
              <IconComponent className={`${accentClass} w-8 h-8`} />
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className={valueClass}>{stats[key]}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="overflow-x-auto bg-white shadow rounded-xl">
        {loading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Carregando registros...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : tableRows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhum registro encontrado.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-blue-600 text-white text-left">
              <tr>
                {TABLE_COLUMNS.map((column) => (
                  <th key={column.key} className="px-6 py-3">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, index) => (
                <tr
                  key={row.id ?? index}
                  className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50 transition`}
                >
                  <td className="px-6 py-4 font-medium text-gray-800">{row.protocolo}</td>
                  <td className="px-6 py-4 text-gray-700">{row.assunto}</td>
                  <td className="px-6 py-4 text-gray-600">{row.dataHora}</td>
                  <td className="px-6 py-4 text-gray-700">{row.linha}</td>
                  <td className="px-6 py-4 text-gray-700">{row.veiculo}</td>
                  <td className="px-6 py-4 text-gray-600">{row.local}</td>
                  <td className="px-6 py-4 max-w-xs truncate text-gray-600" title={row.descricao}>
                    {row.descricao}
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function buildStats(rows) {
  const base = { total: rows.length, pendentes: 0, analise: 0, resolvidas: 0 };
  rows.forEach((row) => {
    const key = normalizeStatusKey(row.status);
    if (key === "resolvido") {
      base.resolvidas += 1;
    } else if (key === "em analise") {
      base.analise += 1;
    } else {
      base.pendentes += 1;
    }
  });
  return base;
}

function mapRowToDisplay(row) {
  return {
    id: getValue(row, "id", "protocolo"),
    protocolo: getValue(row, "protocolo"),
    assunto: getValue(row, "assunto"),
    dataHora: getValue(row, "data_hora", "datahora", "data"),
    linha: getValue(row, "linha", "numero_da_linha"),
    veiculo: getValue(row, "numero_veiculo", "numero_do_veiculo", "veiculo"),
    local: getValue(row, "local_ocorrencia", "local"),
    descricao: getValue(row, "descricao", "relato", "observacoes"),
    status: getValue(row, "status", "situacao"),
  };
}

function getValue(row, ...keys) {
  for (const key of keys) {
    if (key && row[key]) {
      return row[key];
    }
  }
  return "";
}

function normalizeStatusKey(status) {
  return (status || "Pendente")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
