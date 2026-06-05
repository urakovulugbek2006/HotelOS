"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variants = {
  primary: "bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold",
  secondary: "bg-navy-700 hover:bg-navy-600 text-white border border-navy-600",
  danger: "bg-red-600 hover:bg-red-500 text-white font-semibold",
  ghost: "bg-transparent hover:bg-navy-700 text-slate-300 hover:text-white",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm rounded",
  md: "px-4 py-2 text-sm rounded-md",
  lg: "px-6 py-3 text-base rounded-lg",
};

const Button = forwardRef<HTMLButtonElement, Props>(
  (
    { variant = "primary", size = "md", loading, disabled, children, className = "", ...rest },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
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
