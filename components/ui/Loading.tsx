import React from "react";
import { Sparkles } from "lucide-react";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export default function Loading({ 
  size = "lg", 
  text = "Memuat...", 
  fullScreen = false,
  className = "" 
}: LoadingProps) {
  
  const sizeMap = {
    sm: { icon: 24, fontSize: "text-xs", gap: "gap-2" },
    md: { icon: 32, fontSize: "text-sm", gap: "gap-3" },
    lg: { icon: 48, fontSize: "text-base", gap: "gap-4" },
  };

  const sizes = sizeMap[size];

  const content = (
    <div className={`flex flex-col items-center justify-center py-12 px-6 ${fullScreen ? "" : "min-h-100"} w-full group ${className}`}>
      {/* Cartoon Style Loading Icon */}
      <div className="relative mb-8">
        {/* Glow effect for professional feel */}
        <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-10 animate-spin" style={{ animationDuration: '8s' }} />
        
        {/* Main Icon Container - No background or card as requested */}
        <div className="relative z-10 flex items-center justify-center">
          <Sparkles 
            className="text-emerald-500 animate-spin" 
            strokeWidth={2.5}
            size={sizes.icon}
            style={{ animationDuration: '3s' }}
          />
        </div>
      </div>

      {/* Loading Text With Cartoon Styling */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <p className={`${sizes.fontSize} font-black text-slate-800 tracking-tight uppercase`}>
            {text}
          </p>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
          </div>
        </div>
        <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase opacity-70">
          Tunggu sebentar ya...
        </p>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-9999 flex items-center justify-center bg-[#FDFBF7] transition-opacity duration-300">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-50 rounded-full -ml-32 -mb-32 blur-3xl opacity-50" />
        
        {content}
      </div>
    );
  }

  return content;
}