import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "destructive" | "secondary";
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    default: "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500",
    destructive: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500",
  };

  return (
    <button
      className={cn(baseStyle, variants[variant] || variants.default, className)}
      {...props}
    />
  );
}
