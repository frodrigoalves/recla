export function StepChip({ active, icon, label }) {
  return (
    <div className={`flex items-center gap-2 ${active ? "text-blue-700" : "text-gray-400"}`}>
      {icon}
      <span className="font-medium">{label}</span>
    </div>
  );
}
