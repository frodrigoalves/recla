import { MAX_DESCRICAO_LENGTH, SLA_DIAS } from "./constants";

function isBrowserFile(item) {
  if (!item) return false;
  if (typeof File !== "undefined" && item instanceof File) return true;
  return typeof item === "object" && typeof item.name === "string" && typeof item.size === "number";
}

export function sanitizeAttachments(value) {
  const list = Array.isArray(value) ? value : [];
  return list.filter(isBrowserFile);
}

export function makeProtocolo() {
  return `TOP-${Date.now()}`;
}

export function buildInitialForm() {
  return {
    protocolo: makeProtocolo(),
    assunto: "",
    data_hora_ocorrencia: "",
    linha: "",
    numero_veiculo: "",
    local_ocorrencia: "",
    descricao: "",
    anexos: [],
    quer_retorno: false,
    nome_completo: "",
    email: "",
    telefone: "",
    lgpd_aceite: false,
    status: "Pendente",
    prazo_sla: "",
  };
}

export function calculatePrazoSla(baseDate = new Date()) {
  const prazo = new Date(baseDate);
  prazo.setDate(prazo.getDate() + SLA_DIAS);
  return prazo;
}

export function createSubmissionFormData(form, storedAttachments = [], originalAttachments = []) {
  const formData = new FormData();
  const prazo = calculatePrazoSla();

  const payload = {
    protocolo: form.protocolo,
    assunto: form.assunto,
    data_hora_ocorrencia: form.data_hora_ocorrencia,
    linha: form.linha,
    numero_veiculo: form.numero_veiculo,
    local_ocorrencia: form.local_ocorrencia,
    descricao: form.descricao?.slice(0, MAX_DESCRICAO_LENGTH) ?? "",
    quer_retorno: form.quer_retorno,
    nome_completo: form.nome_completo,
    email: form.email,
    telefone: form.telefone,
    lgpd_aceite: form.lgpd_aceite,
    status: form.status,
    prazo_sla: prazo.toISOString(),
  };

  if (Array.isArray(storedAttachments) && storedAttachments.length > 0) {
    payload.anexos_registrados = JSON.stringify(
      storedAttachments.map((item) => ({
        id: item?.id,
        nome: item?.name ?? item?.nome ?? "arquivo",
        tipo: item?.mime_type ?? item?.mimeType ?? item?.type ?? "",
        tamanho: item?.size ?? item?.tamanho ?? 0,
      }))
    );
  }

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (typeof value === "boolean") {
      formData.append(key, value ? "true" : "false");
      return;
    }

    formData.append(key, value);
  });

  if (Array.isArray(originalAttachments) && originalAttachments.length > 0) {
    originalAttachments.forEach((file, index) => {
      if (!file) {
        return;
      }

      const hasFileConstructor = typeof File !== "undefined";
      const isFileInstance = hasFileConstructor && file instanceof File;
      const isBlobInstance = typeof Blob !== "undefined" && file instanceof Blob;

      if (!isFileInstance && !isBlobInstance) {
        return;
      }

      const filename = file?.name ?? `arquivo${index + 1}`;
      formData.append(`arquivo${index + 1}`, file, filename);
    });
  }

  return formData;
}
