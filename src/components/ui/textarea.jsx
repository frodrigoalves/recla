import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const Textarea = React.forwardRef(function Textarea(
  { className = "", ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full min-h-[140px] rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-500",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "resize-none",
        className,
      )}
      {...props}
    />
  );
});
