import React from "react";

export default function AnexosUpload({ data, onChange }) {
  const isFile = (item) => {
    if (typeof File !== "undefined" && item instanceof File) return true;
    return (
      item &&
      typeof item === "object" &&
      typeof item.name === "string" &&
      typeof item.size === "number"
    );
  };

  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB - sincronizado com Apps Script

  const isAllowedType = (file) => {
    const type = (file?.type || "").toLowerCase();
    return type.startsWith("image/") || 
           type.startsWith("audio/") || 
           type.startsWith("video/") ||
           type.includes("pdf") ||
           type.includes("msword") ||
           type.includes("officedocument");
  };

  const validateFile = (file) => {
    if (!isFile(file)) {
      return "Arquivo inválido";
    }
    if (!isAllowedType(file)) {
      return "Tipo de arquivo não permitido. Envie apenas imagens, áudios, vídeos ou documentos.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Arquivo muito grande. Tamanho máximo permitido: ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }
    return null;
  };

  const attachments = Array.isArray(data.anexos) ? data.anexos.filter(isFile) : [];

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    const validFiles = [];
    const errors = [];

    for (const file of picked) {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      alert("Erros nos arquivos selecionados:\n\n" + errors.join("\n"));
    }

    if (validFiles.length > 0) {
      onChange("anexos", [...attachments, ...validFiles]);
    }
    
    e.target.value = "";
  };

  const handleRemove = (idx) => {
    const next = attachments.filter((_, index) => index !== idx);
    onChange("anexos", next);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Anexos</h2>
      <div className="text-sm text-gray-600 mb-2">
        Tipos permitidos: imagens, áudios, vídeos e documentos (PDF, Word)
        <br />
        Tamanho máximo por arquivo: 15MB
      </div>
      <div className="space-y-2">
        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">
          Selecione os arquivos
          <span className="text-red-500 ml-1" aria-label="opcional">(opcional)</span>
        </label>
        <input
          id="file-upload"
          type="file"
          multiple
          accept="image/*,audio/*,video/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFiles}
          aria-describedby="file-help"
          className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p id="file-help" className="text-sm text-gray-500">
          Formatos aceitos: imagens, áudios, vídeos, PDF e documentos Word. Tamanho máximo: 15MB por arquivo.
        </p>
      </div>
      {attachments.length > 0 && (
        <ul className="space-y-2 text-sm text-gray-700">
          {attachments.map((f, i) => (
            <li
              key={`${f?.name ?? "arquivo"}-${i}`}
              className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 bg-white"
            >
              <span className="truncate pr-3">{f?.name ?? "Arquivo"}</span>
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
