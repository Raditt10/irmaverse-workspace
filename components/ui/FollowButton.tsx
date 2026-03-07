"use client";

import React, { useState } from "react";
import { UserPlus, UserCheck, UserMinus, Loader2 } from "lucide-react";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
  initialIsMutual?: boolean;
  onStatusChange?: (isFollowing: boolean) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
  initialIsMutual = false,
  onStatusChange,
  size = "md",
  className = "",
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isMutual, setIsMutual] = useState(initialIsMutual);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleToggleFollow = async () => {
    setLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const res = await fetch("/api/friends/unfollow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId }),
        });
        if (res.ok) {
          setIsFollowing(false);
          setIsMutual(false);
          onStatusChange?.(false);
        }
      } else {
        // Follow
        const res = await fetch("/api/friends/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId }),
        });
        if (res.ok) {
          const data = await res.json();
          setIsFollowing(true);
          setIsMutual(data.isMutual);
          onStatusChange?.(true);
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  if (loading) {
    return (
      <button
        disabled
        className={`inline-flex items-center justify-center font-bold rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed ${sizeClasses[size]} ${className}`}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Memproses...
      </button>
    );
  }

  if (isFollowing) {
    return (
      <button
        onClick={handleToggleFollow}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`inline-flex items-center justify-center font-bold rounded-xl border-2 transition-all duration-200 ${
          hovered
            ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
            : isMutual
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-blue-300 bg-blue-50 text-blue-700"
        } ${sizeClasses[size]} ${className}`}
      >
        {hovered ? (
          <>
            <UserMinus className="h-4 w-4" />
            Berhenti Ikuti
          </>
        ) : isMutual ? (
          <>
            <UserCheck className="h-4 w-4" />
            Teman
          </>
        ) : (
          <>
            <UserCheck className="h-4 w-4" />
            Mengikuti
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFollow}
      className={`inline-flex items-center justify-center font-bold rounded-xl border-2 border-emerald-400 bg-emerald-500 text-white hover:bg-emerald-600 active:translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-md ${sizeClasses[size]} ${className}`}
    >
      <UserPlus className="h-4 w-4" />
      Ikuti
    </button>
  );
}
