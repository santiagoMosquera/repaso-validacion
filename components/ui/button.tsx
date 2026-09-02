import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
  size?: "default" | "lg";
};

export function Button({
  className = "",
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  const variantClasses =
    variant === "outline"
      ? "border border-border bg-background text-foreground hover:bg-accent"
      : "bg-primary text-primary-foreground hover:opacity-90";
  const sizeClasses = size === "lg" ? "h-11 px-6" : "h-10 px-4";

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    />
  );
}
