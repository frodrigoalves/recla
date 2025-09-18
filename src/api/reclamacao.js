const API_URL = "/api/reclamacao";
const MB15 = 15 * 1024 * 1024;

export function validarArquivos(files) {
  const rejeitados = [];
  for (const arquivo of files) {
    if (arquivo.size > MB15) {
      rejeitados.push(arquivo.name);
    }
  }
  return rejeitados;
}

export async function enviarReclamacaoFormData(formData) {
  const resp = await fetch(API_URL, { method: "POST", body: formData });
  const contentType = resp.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await resp.text().catch(() => "");
    return { ok: false, error: text || "Resposta inesperada do servidor." };
  }

  const json = await resp.json();
  return json;
}

export async function enviarReclamacao(formEl) {
  const formData = new FormData(formEl);
  return enviarReclamacaoFormData(formData);
}
