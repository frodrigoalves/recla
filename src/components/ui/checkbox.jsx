import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const Checkbox = React.forwardRef(function Checkbox(
  { className = "", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600",
        className,
      )}
      {...props}
    />
  );
});
