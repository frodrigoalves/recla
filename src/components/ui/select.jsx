import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const Select = React.forwardRef(function Select(
  { className = "", children, placeholder, ...props },
  ref,
) {
  return (
    <div className="relative w-full">
      <select
        ref={ref}
        className={cn(
          "flex h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled={props.required} hidden={props.required}>
            {placeholder}
          </option>
        ) : null}
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
        ▼
      </span>
    </div>
  );
});

export function SelectOption({ value, children }) {
  return <option value={value}>{children}</option>;
}
