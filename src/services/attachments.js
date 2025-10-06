const DEFAULT_ENDPOINT = "/.netlify/functions/upload-attachments";

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler arquivo."));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const base64 = result.split(",").pop();
        resolve(base64 ?? "");
        return;
      }
      reject(new Error("Formato de arquivo inválido."));
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadAttachments(protocolo, files, options = {}) {
  const endpoint = options.endpoint ?? import.meta.env.VITE_ATTACHMENTS_ENDPOINT ?? DEFAULT_ENDPOINT;
  const list = Array.isArray(files) ? files : [];

  if (!protocolo || list.length === 0) {
    return [];
  }

  const payload = await Promise.all(
    list.map(async (file) => ({
      name: file?.name ?? "arquivo",
      type: file?.type ?? "",
      size: typeof file?.size === "number" ? file.size : 0,
      content: await readFileAsBase64(file),
    }))
  );

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ protocolo, attachments: payload }),
  });

  if (!response.ok) {
    throw new Error("Falha ao enviar anexos.");
  }

  const data = await response.json().catch(() => ({ attachments: [] }));
  return Array.isArray(data.attachments) ? data.attachments : [];
}
