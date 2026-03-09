"use client";

interface ReactionBannerProps {
  message: string;
  className?: string;
}

export function ReactionBanner({ message, className = "" }: ReactionBannerProps) {
  return (
    <div
      className={"rounded-2xl bg-white/95 border-2 border-violet-200 px-4 py-2 text-center font-semibold text-gray-800 shadow-lg pointer-events-none " + className}
      dir="rtl"
      role="status"
    >
      {message}
    </div>
  );
}
