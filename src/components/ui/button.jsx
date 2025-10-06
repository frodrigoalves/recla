import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const Button = React.forwardRef(function Button(
  { className = "", variant = "default", ...props },
  ref,
) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600";

  const variants = {
    default: "bg-blue-600 text-white shadow-lg hover:bg-blue-700",
    outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    ghost: "text-slate-700 hover:bg-slate-100",
  };

  return (
    <button
      ref={ref}
      className={cn(
        base,
        variants[variant] || variants.default,
        "disabled:cursor-not-allowed disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
});
