import { useEffect, useState } from "react";
import { fetchGoogleSheet } from "@/services/googleSheets";

export function useGoogleSheet(url) {
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!url) {
      setColumns([]);
      setRows([]);
      setError("URL da planilha não configurada.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    setLoading(true);
    setError("");

    fetchGoogleSheet({ url, signal: controller.signal })
      .then(({ columns: fetchedColumns, rows: fetchedRows }) => {
        if (cancelled) return;
        setColumns(fetchedColumns);
        setRows(fetchedRows);
      })
      .catch((err) => {
        if (cancelled || err.name === "AbortError") return;
        setColumns([]);
        setRows([]);
        setError(err.message || "Não foi possível carregar os dados.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url]);

  return { columns, rows, loading, error };
}
