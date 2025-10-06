const DEFAULT_ERROR_MESSAGE = "Não foi possível carregar os dados.";

export async function fetchGoogleSheet({ url, signal } = {}) {
  if (!url) {
    throw new Error("URL da planilha não configurada.");
  }

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(DEFAULT_ERROR_MESSAGE);
  }

  const payload = await response.text();
  return parseGoogleSheet(payload);
}

export function parseGoogleSheet(payload) {
  const startIndex = payload.indexOf("{");
  const endIndex = payload.lastIndexOf("}");

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(DEFAULT_ERROR_MESSAGE);
  }

  const json = JSON.parse(payload.slice(startIndex, endIndex + 1));
  const table = json.table ?? {};
  const cols = Array.isArray(table.cols) ? table.cols : [];
  const rows = Array.isArray(table.rows) ? table.rows : [];

  const columns = cols.map((column, index) => {
    const label = (column?.label ?? `Coluna ${index + 1}`).toString().trim();
    const key = normalizeKey(label) || `col_${index}`;
    return { key, label, index };
  });

  const normalizedRows = rows.map((row) => {
    const cells = Array.isArray(row?.c) ? row.c : [];
    return columns.reduce((acc, column) => {
      acc[column.key] = cells[column.index]?.v ?? "";
      return acc;
    }, {});
  });

  return { columns, rows: normalizedRows };
}

function normalizeKey(label) {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
