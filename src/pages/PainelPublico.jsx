import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function PainelPublico() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sheetUrl = import.meta.env.VITE_SHEET_GVIZ;

  useEffect(() => {
    if (!sheetUrl) {
      setError("URL da planilha não configurada.");
      setLoading(false);
      return;
    }

    fetch(sheetUrl)
      .then((res) => res.text())
      .then((t) => {
        const json = JSON.parse(t.substring(47, t.length - 2));
        const R = json.table.rows.map((r) => r.c.map((c) => (c ? c.v : "")));
        setRows(R);
      })
      .catch(() => {
        setRows([]);
        setError("Não foi possível carregar os dados.");
      })
      .finally(() => setLoading(false));
  }, [sheetUrl]);

  const total = rows.length;
  const pendentes = rows.filter((r) => !r[11] || r[11] === "Pendente").length;
  const analise = rows.filter((r) => r[11] === "Em Análise").length;
  const resolvidas = rows.filter((r) => r[11] === "Resolvido").length;

  const renderStatus = (status) => {
    if (status === "Resolvido") {
      return <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700">Resolvido</span>;
    }
    if (status === "Em Análise") {
      return <span className="px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">Em Análise</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs bg-red-100 text-red-700">Pendente</span>;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      {/* Cabeçalho */}
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-800"> Reclamações Públicas</h1>
        <p className="text-gray-500">Acompanhe as ocorrências registradas em tempo real</p>
      </header>

      {/* Cards de Resumo */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="p-5 bg-white shadow rounded-xl flex items-center gap-4 hover:shadow-lg transition">
          <Clock className="text-gray-400 w-8 h-8" />
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
        </div>
        <div className="p-5 bg-white shadow rounded-xl flex items-center gap-4 hover:shadow-lg transition">
          <AlertTriangle className="text-red-500 w-8 h-8" />
          <div>
            <p className="text-sm text-gray-500">Pendentes</p>
            <p className="text-2xl font-bold text-red-600">{pendentes}</p>
          </div>
        </div>
        <div className="p-5 bg-white shadow rounded-xl flex items-center gap-4 hover:shadow-lg transition">
          <Clock className="text-yellow-500 w-8 h-8" />
          <div>
            <p className="text-sm text-gray-500">Em Análise</p>
            <p className="text-2xl font-bold text-yellow-600">{analise}</p>
          </div>
        </div>
        <div className="p-5 bg-white shadow rounded-xl flex items-center gap-4 hover:shadow-lg transition">
          <CheckCircle className="text-green-500 w-8 h-8" />
          <div>
            <p className="text-sm text-gray-500">Resolvidas</p>
            <p className="text-2xl font-bold text-green-600">{resolvidas}</p>
          </div>
        </div>
      </section>

      {/* Tabela */}
      <section className="overflow-x-auto bg-white shadow rounded-xl">
        {loading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Carregando registros...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhum registro encontrado.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-blue-600 text-white text-left">
              <tr>
                <th className="px-6 py-3">Protocolo</th>
                <th className="px-6 py-3">Assunto</th>
                <th className="px-6 py-3">Data/Hora</th>
                <th className="px-6 py-3">Linha</th>
                <th className="px-6 py-3">Veículo</th>
                <th className="px-6 py-3">Local</th>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={`${i % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50 transition`}>
                  <td className="px-6 py-4 font-medium text-gray-800">{r[0]}</td>
                  <td className="px-6 py-4 text-gray-700">{r[1]}</td>
                  <td className="px-6 py-4 text-gray-600">{r[2]}</td>
                  <td className="px-6 py-4 text-gray-700">{r[3]}</td>
                  <td className="px-6 py-4 text-gray-700">{r[4]}</td>
                  <td className="px-6 py-4 text-gray-600">{r[5]}</td>
                  <td className="px-6 py-4 max-w-xs truncate text-gray-600" title={r[9]}>{r[9]}</td>
                  <td className="px-6 py-4">{renderStatus(r[11])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
