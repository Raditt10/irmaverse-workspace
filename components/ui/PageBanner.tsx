import React, { ElementType } from "react";

interface PageBannerProps {
  title: React.ReactNode;
  description: React.ReactNode;
  icon?: ElementType;
  tag?: string;
  tagIcon?: ElementType;
  action?: React.ReactNode;
  className?: string;
}

export default function PageBanner({
  title,
  description,
  icon: Icon,
  tag,
  tagIcon: TagIcon,
  action,
  className = "",
}: PageBannerProps) {
  return (
    <div className={`bg-linear-to-r from-teal-500 to-emerald-400 rounded-4xl lg:rounded-[3rem] p-6 lg:p-10 border-4 border-teal-700 shadow-[0_8px_0_0_#0f766e] text-white relative overflow-hidden mb-10 group ${className}`}>
      {/* Decorative background blurs */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute bottom-0 left-20 w-32 h-32 bg-teal-300 opacity-20 rounded-full blur-2xl" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left w-full relative z-10 flex flex-col items-center md:items-start">
          {tag && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-xs font-black uppercase tracking-wider mb-4">
              {TagIcon && <TagIcon className="h-4 w-4 text-white" />}
              {tag}
            </div>
          )}
          
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-2 flex items-center gap-3 justify-center md:justify-start w-full">
            {title}
          </h1>
          
          <p className="text-teal-50 font-medium text-sm lg:text-base max-w-xl mx-auto md:mx-0">
            {description}
          </p>
        </div>

        {action && (
          <div className="flex flex-col items-center md:items-end gap-2 shrink-0 z-10 w-full md:w-auto">
            {action}
          </div>
        )}
      </div>

      {Icon && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex w-32 h-32 lg:w-40 lg:h-40 bg-white/10 rounded-full border-4 border-white/20 backdrop-blur-md items-center justify-center shadow-inner transform rotate-12 group-hover:rotate-0 transition-all duration-500 opacity-60">
          <Icon className="h-16 w-16 lg:h-20 lg:w-20 text-white drop-shadow-md" fill="none" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
