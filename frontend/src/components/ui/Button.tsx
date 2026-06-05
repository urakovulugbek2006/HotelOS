"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variants = {
  primary:
    "bg-gold-sheen text-navy-950 font-semibold shadow-gold hover:brightness-[1.06] active:brightness-95",
  secondary:
    "bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/10 hover:border-white/20",
  danger:
    "bg-red-500/90 hover:bg-red-500 text-white font-semibold shadow-[0_12px_30px_-10px_rgba(239,68,68,0.5)]",
  ghost: "bg-transparent hover:bg-white/[0.06] text-slate-300 hover:text-white",
  outline:
    "bg-transparent border border-gold-500/50 text-gold-300 hover:bg-gold-500/10 hover:border-gold-400",
};

const sizes = {
  sm: "px-3.5 py-2 text-xs rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-lg",
  lg: "px-7 py-3.5 text-base rounded-xl",
};

const Button = forwardRef<HTMLButtonElement, Props>(
  (
    { variant = "primary", size = "md", loading, disabled, children, className = "", ...rest },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`group inline-flex items-center justify-center gap-2 font-medium tracking-wide
        transition-all duration-200 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950
        disabled:opacity-50 disabled:cursor-not-allowed disabled:saturate-50
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
export default Button;
