"use client";

import { useState } from "react";

interface GirlCardProps {
  displayName: string;
  avatar: string | null;
  colorClass: string;
  onSelect: () => void;
  isOnline?: boolean;
}

const FALLBACK_EMOJIS = [
  "🦄",
  "⭐",
  "🌸",
  "🌈",
  "🧜‍♀️",
  "🍦",
  "🧚‍♀️",
  "☀️",
  "🦋",
  "💖",
] as const;

function getFallbackEmoji(name: string): string {
  const code = Array.from(name).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return FALLBACK_EMOJIS[code % FALLBACK_EMOJIS.length];
}

export function GirlCard({ displayName, avatar, colorClass, onSelect, isOnline }: GirlCardProps) {
  const [failed, setFailed] = useState(false);
  const showAvatar = !!avatar && !failed;
  const fallbackEmoji = getFallbackEmoji(displayName);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isOnline}
      className={`relative flex flex-col items-center justify-center rounded-3xl border-2 px-4 py-6 shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-violet-300/60 min-h-[130px] w-full ${
        isOnline
          ? "border-gray-300 bg-gray-100 cursor-not-allowed opacity-80"
          : "border-white bg-white/80 hover:shadow-xl hover:-translate-y-1"
      }`}
    >
      <div
        className={`absolute inset-0 rounded-3xl opacity-60 bg-gradient-to-br ${colorClass} pointer-events-none`}
      />
      {showAvatar ? (
        <img
          src={avatar!}
          alt=""
          onError={() => setFailed(true)}
          className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-white shadow-md"
        />
      ) : (
        <div className="relative z-10 flex items-center justify-center text-5xl sm:text-6xl drop-shadow-sm">
          {fallbackEmoji}
        </div>
      )}
      <span className="relative z-10 mt-2 text-xl sm:text-2xl font-bold text-gray-900" dir="rtl">
        {displayName}
      </span>
      {isOnline && (
        <span className="relative z-10 mt-1 text-xs font-medium text-gray-600">מחוברת עכשיו</span>
      )}
    </button>
  );
}
