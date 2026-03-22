"use client";

import { ApprovedUserAvatar } from "./ApprovedUserAvatar";

interface GirlCardProps {
  displayName: string;
  avatar: string | null;
  colorClass: string;
  onSelect: () => void;
  isOnline?: boolean;
  /** When set, picks a unique emoji by index so no two cards share the same icon. */
  emojiIndex?: number;
}

export function GirlCard({ displayName, avatar, colorClass, onSelect, isOnline, emojiIndex }: GirlCardProps) {
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
      <ApprovedUserAvatar avatar={avatar} displayName={displayName} emojiIndex={emojiIndex} />
      <span className="relative z-10 mt-2 text-xl sm:text-2xl font-bold text-gray-900" dir="rtl">
        {displayName}
      </span>
      {isOnline && (
        <span className="relative z-10 mt-1 text-xs font-medium text-gray-600">מחוברת עכשיו</span>
      )}
    </button>
  );
}
