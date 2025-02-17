import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
};

export function Button({ children, onClick, variant = "default" }: ButtonProps) {
  const baseStyle = "px-4 py-2 rounded text-white font-bold";
  const variants = {
    default: "bg-blue-500 hover:bg-blue-600",
    destructive: "bg-red-500 hover:bg-red-600",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyle} ${variants[variant] || variants.default}`}
    >
      {children}
    </button>
  );
}
