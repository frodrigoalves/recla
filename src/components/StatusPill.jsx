function normalize(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const STATUS_STYLES = {
  resolvido: "bg-green-100 text-green-700",
  "em analise": "bg-yellow-100 text-yellow-700",
  pendente: "bg-red-100 text-red-700",
};

export function StatusPill({ status }) {
  if (!status) {
    status = "Pendente";
  }

  const key = normalize(status);
  const style = STATUS_STYLES[key] ?? STATUS_STYLES.pendente;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style}`}>
      {status}
    </span>
  );
}
