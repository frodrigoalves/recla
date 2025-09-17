import React from "react";

export default function AnexosUpload({ data, onChange }) {
  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    onChange("anexos", files);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Anexos</h2>
      <input
        type="file"
        multiple
        onChange={handleFiles}
        className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer"
      />
      {data.anexos && data.anexos.length > 0 && (
        <ul className="list-disc pl-5 text-sm text-gray-600">
          {data.anexos.map((f, i) => (
            <li key={i}>{f.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
