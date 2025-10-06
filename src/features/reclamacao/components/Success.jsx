import { CheckCircle2 } from "lucide-react";

export function Success({ protocolo, message, onNew }) {
  return (
    <section className="flex flex-col items-center text-center py-10">
      <CheckCircle2 className="w-14 h-14 text-green-600" />
      <h2 className="text-2xl font-bold mt-4">Reclamação enviada!</h2>
      <p className="text-gray-600 mt-2">Guarde seu protocolo para acompanhamento:</p>
      <div className="mt-3 px-4 py-2 bg-green-50 text-green-700 rounded font-mono">{protocolo}</div>
      {message ? <p className="mt-4 text-gray-700">{message}</p> : null}
      <button
        onClick={onNew}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
      >
        Registrar nova reclamação
      </button>
    </section>
  );
}
