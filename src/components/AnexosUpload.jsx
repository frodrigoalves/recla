import React, { useCallback, useMemo } from "react";

const isFileObject = (item) => {
  if (!item) return false;
  if (typeof File !== "undefined" && item instanceof File) return true;
  return Object.prototype.toString.call(item) === "[object File]";
};

const isAllowedType = (file) => {
  const type = (file?.type || "").toLowerCase();
  return type.startsWith("image/") || type.startsWith("audio/") || type.startsWith("video/");
};

const toArray = (value) => {
  if (!value) return [];
  if (typeof FileList !== "undefined" && value instanceof FileList) {
    return Array.from(value);
  }
  if (Array.isArray(value)) {
    return value;
  }
  return [];
};

const sanitizeFiles = (files) =>
  toArray(files).filter((file) => isFileObject(file) && isAllowedType(file));

export default function AnexosUpload({ data, onChange }) {
  const attachments = useMemo(() => sanitizeFiles(data?.anexos), [data?.anexos]);

  const handleFiles = useCallback(
    (event) => {
      const picked = sanitizeFiles(event.target?.files);
      if (picked.length === 0) {
        event.target.value = "";
        return;
      }

      onChange("anexos", [...attachments, ...picked]);
      event.target.value = "";
    },
    [attachments, onChange]
  );

  const handleRemove = useCallback(
    (indexToRemove) => {
      const next = attachments.filter((_, index) => index !== indexToRemove);
      onChange("anexos", next);
    },
    [attachments, onChange]
  );

  return (
    <div className="space-y-4">
      <input
        type="file"
        name="anexos"
        multiple
        accept="image/*,audio/*,video/*"
        onChange={handleFiles}
        className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer"
      />

      {attachments.length > 0 && (
        <ul className="space-y-2 text-sm text-gray-700">
          {attachments.map((file, index) => (
            <li
              key={`${file?.name ?? "arquivo"}-${index}`}
              className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 bg-white"
            >
              <span className="truncate pr-3">{file?.name ?? "Arquivo"}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-gray-500">
        Somente arquivos de imagem, áudio ou vídeo enviados diretamente são aceitos.
      </p>
    </div>
  );
}
