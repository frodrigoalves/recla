const DEFAULT_ENDPOINT = import.meta.env.VITE_APPSCRIPT_URL;
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB - sincronizado com Apps Script

function isAllowedMimeType(type) {
  return /^(image|audio|video)\//.test(type) || /\b(pdf|msword|officedocument)\b/.test(type);
}

function validateFile(file) {
  if (!file) throw new Error("Arquivo inválido");
  
  if (!isAllowedMimeType(file.type)) {
    throw new Error("Tipo de arquivo não permitido. Envie apenas imagens, áudios, vídeos ou documentos.");
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Arquivo muito grande. Tamanho máximo permitido: ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }
}

export async function uploadAttachments(protocolo, files, options = {}) {
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const list = Array.isArray(files) ? files : [];

  if (!protocolo || list.length === 0 || !endpoint) {
    return [];
  }

  // Validar todos os arquivos primeiro
  for (const file of list) {
    validateFile(file);
  }

  // Criar FormData com todos os arquivos
  const formData = new FormData();
  formData.append("protocolo", protocolo);
  
  list.forEach((file, index) => {
    formData.append(`arquivo${index}`, file);
  });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: "Erro desconhecido" }));
      throw new Error(data.error || "Falha ao enviar anexos.");
    }

    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(data.error || "Erro ao processar anexos no servidor.");
    }

    // Extrair URLs dos anexos do protocolo
    const urls = String(data.anexos || "").split(" ").filter(Boolean);
    
    return urls.map((url, index) => ({
      id: url.match(/[?&]id=([^&]+)/)?.[1] || "",
      name: list[index]?.name || "arquivo",
      mime_type: list[index]?.type || "",
      size: list[index]?.size || 0,
      url: url
    }));

  } catch (error) {
    console.error("Erro ao enviar anexos:", error);
    throw new Error("Falha ao enviar anexos. " + error.message);
  }
}
