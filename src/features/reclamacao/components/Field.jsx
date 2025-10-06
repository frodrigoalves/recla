export function Field({ label, hint, error, children }) {
  return (
    <div className="flex flex-col">
      <label className="block text-sm font-medium text-gray-800 mb-1">{label}</label>
      {children}
      {hint ? <p className="text-xs text-gray-500 mt-1">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
