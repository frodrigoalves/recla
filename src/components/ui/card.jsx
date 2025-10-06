import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Card({ className = "", ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }) {
  return (
    <div
      className={cn("border-b border-slate-100 px-5 py-4", className)}
      {...props}
    />
  );
}

export function CardContent({ className = "", ...props }) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function CardFooter({ className = "", ...props }) {
  return (
    <div
      className={cn("border-t border-slate-100 px-5 py-4", className)}
      {...props}
    />
  );
}

export function CardTitle({ className = "", ...props }) {
  return (
    <h2
      className={cn("text-base font-semibold text-slate-800", className)}
      {...props}
    />
  );
}

export function CardDescription({ className = "", ...props }) {
  return (
    <p
      className={cn("text-sm text-slate-500", className)}
      {...props}
    />
  );
}
