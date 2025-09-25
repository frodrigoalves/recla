import React from "react";

const isFileObject = (item) => {
  if (!item) return false;
  if (typeof File !== "undefined" && item instanceof File) return true;
  return Object.prototype.toString.call(item) === "[object File]";
};

export default function AnexosUpload({ data, onChange }) {
  const isFile = isFileObject;

  const isAllowedType = (file) => {
    const type = (file?.type || "").toLowerCase();
    return type.startsWith("image/") || type.startsWith("audio/") || type.startsWith("video/");
  };

  const attachments = Array.isArray(data.anexos) ? data.anexos.filter(isFile) : [];

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    const newFiles = picked.filter((file) => isFile(file) && isAllowedType(file));
    if (newFiles.length === 0 && attachments.length === 0) {
      e.target.value = "";
      return;
    }

    onChange("anexos", [...attachments, ...newFiles]);
    e.target.value = "";
  };

  const handleRemove = (idx) => {
    const next = attachments.filter((_, index) => index !== idx);
    onChange("anexos", next);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Anexos</h2>
      <input
        type="file"
        multiple
        accept="image/*,audio/*,video/*"
        onChange={handleFiles}
        className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer"
      />
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
