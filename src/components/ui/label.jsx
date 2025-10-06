import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Label({ className = "", ...props }) {
  return (
    <label
      className={cn("text-sm font-semibold text-slate-700", className)}
      {...props}
    />
  );
}
