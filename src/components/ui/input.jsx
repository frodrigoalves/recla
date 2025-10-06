import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const Input = React.forwardRef(function Input(
  { className = "", type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-500",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
});
