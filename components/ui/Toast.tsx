"use client";
import { Check, AlertCircle, X, AlertTriangle, Info } from "lucide-react";
import React, { useEffect, useState } from "react";

export interface ToastProps {
  show: boolean;
  message: string;
  type: "success" | "error" | "warning" | "info";
  onClose?: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ show, message, type, onClose, duration = 3000 }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsExiting(false);
      setIsVisible(true);

      if (onClose) {
        const timer = setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            onClose();
            setIsVisible(false);
          }, 350);
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
      setIsExiting(false);
    }
  }, [show, onClose, duration]);

  if (!show && !isVisible) return null;

  const getGradient = () => {
    switch (type) {
      case "success":
        return "from-emerald-500 to-cyan-500";
      case "error":
        return "from-red-500 to-rose-500";
      case "warning":
        return "from-amber-400 to-orange-400";
      case "info":
        return "from-amber-400 to-yellow-400";
      default:
        return "from-slate-700 to-slate-500";
    }
  };

  const getBoxShadow = () => {
    switch (type) {
      case "warning":
        return "0 8px 32px -4px rgba(245, 158, 11, 0.4), 0 0 0 1px rgba(245, 158, 11, 0.1)";
      case "error":
        return "0 8px 32px -4px rgba(239, 68, 68, 0.35), 0 0 0 1px rgba(239, 68, 68, 0.1)";
      case "success":
        return "0 8px 32px -4px rgba(16, 185, 129, 0.35), 0 0 0 1px rgba(16, 185, 129, 0.1)";
      case "info":
        return "0 8px 32px -4px rgba(245, 158, 11, 0.35), 0 0 0 1px rgba(245, 158, 11, 0.1)";
      default:
        return "0 8px 32px -4px rgba(0,0,0,0.2)";
    }
  };

  const Icon = () => {
    switch (type) {
      case "success":
        return <Check className="h-4 w-4 text-white stroke-3" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-white stroke-3" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-white stroke-3" />;
      case "info":
        return <Info className="h-4 w-4 text-white stroke-3" />;
      default:
        return <Info className="h-4 w-4 text-white stroke-3" />;
    }
  };

  const isWarning = type === "warning";
  const animationClass = isExiting ? "toast-exit" : "toast-enter";

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 pointer-events-none">
      <div
        className={`pointer-events-auto rounded-xl px-5 py-3 flex items-center gap-3 min-w-65 max-w-[90vw] text-white bg-linear-to-r ${getGradient()} ${animationClass}`}
        style={{ boxShadow: getBoxShadow() }}
      >
        <div
          className={`shrink-0 bg-white/20 rounded-full p-1.5 flex items-center justify-center ${
            isWarning ? "toast-warning-icon" : ""
          }`}
        >
          <Icon />
        </div>
        <p className="text-sm font-bold leading-snug wrap-break-word">{message}</p>

        {onClose && (
          <button
            onClick={() => {
              setIsExiting(true);
              setTimeout(() => {
                onClose();
                setIsVisible(false);
              }, 350);
            }}
            className="shrink-0 ml-1 p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4 text-white stroke-3" />
          </button>
        )}
      </div>

      <style jsx global>{`
        @keyframes toastSlideIn {
          0% {
            opacity: 0;
            transform: translateY(-24px) scale(0.95);
          }
          60% {
            opacity: 1;
            transform: translateY(4px) scale(1.01);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes toastSlideOut {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-18px) scale(0.96);
          }
        }

        @keyframes warningPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.25);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(255, 255, 255, 0);
            transform: scale(1.08);
          }
        }

        .toast-enter {
          animation: toastSlideIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .toast-exit {
          animation: toastSlideOut 0.35s cubic-bezier(0.4, 0, 1, 1) forwards;
        }

        .toast-warning-icon {
          animation: warningPulse 1.8s ease-in-out 0.5s 3;
        }
      `}</style>
    </div>
  );
};

export default Toast;