"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { OnlineGirlsList } from "./OnlineGirlsList";
import { ReactionBanner } from "./ReactionBanner";
import { ReactionEffectsLayer, type ReactionInstance } from "./ReactionEffectsLayer";
import type { ReactionType } from "../lib/reactions";

export type DrawingSessionNotification = {
  id: string;
  message: string;
  type: ReactionType;
};

type DrawingSessionShellProps = {
  girl: { id: string; name: string; avatar_url: string | null };
  notifications: DrawingSessionNotification[];
  reactionInstances: ReactionInstance[];
  onReactionExpired: (id: string) => void;
  onSendReaction: (toUserId: string, type: ReactionType) => void;
  onLogout: () => void | Promise<void>;
  bannerExtra?: ReactNode;
  mainClassName?: string;
  showGalleryLink?: boolean;
  children: ReactNode;
};

/**
 * Shared page shell for drawing modes: same outer wrapper, reaction banners, header, and `main` as Free Draw.
 */
export function DrawingSessionShell({
  girl,
  notifications,
  reactionInstances,
  onReactionExpired,
  onSendReaction,
  onLogout,
  bannerExtra,
  mainClassName,
  showGalleryLink = true,
  children,
}: DrawingSessionShellProps) {
  const router = useRouter();
  const mainBase =
    "flex-1 flex flex-col gap-2 py-2 pb-3 max-sm:min-w-0 max-sm:px-2 sm:gap-4 sm:py-4 sm:pb-6 sm:px-3 sm:items-center";
  const mainClasses = mainClassName ? `${mainBase} ${mainClassName}` : mainBase;

  return (
    <div
      className="min-h-screen flex flex-col w-full min-w-0 max-sm:overflow-x-hidden bg-gradient-to-br from-pink-50 via-violet-50 to-sky-50"
      dir="rtl"
    >
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none max-w-[90vw]">
        {notifications.map((n) => (
          <ReactionBanner key={n.id} message={n.message} />
        ))}
        {bannerExtra}
      </div>
      <ReactionEffectsLayer reactions={reactionInstances} onExpired={onReactionExpired} />
      <header className="flex flex-wrap items-center justify-between gap-2 min-w-0 max-sm:px-2 sm:gap-3 sm:px-3 py-2 sm:py-3 border-b border-white/60 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0 sm:gap-3">
          {girl.avatar_url ? (
            <img
              src={girl.avatar_url}
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = "flex";
              }}
              className="h-9 w-9 shrink-0 rounded-full border-2 border-white object-cover sm:h-10 sm:w-10"
            />
          ) : null}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white bg-violet-200 text-base shadow-md sm:h-10 sm:w-10 sm:text-lg"
            style={{ display: girl.avatar_url ? "none" : "flex" }}
          >
            👤
          </div>
          <span className="min-w-0 truncate text-sm font-bold text-gray-800 sm:text-base">{girl.name}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 min-w-0 sm:gap-3">
          <button
            type="button"
            onClick={() => router.push("/choose")}
            className="rounded-xl border-2 border-pink-300 bg-pink-100 px-3 py-1.5 text-sm font-bold text-pink-900 shadow-sm hover:bg-pink-200 hover:border-pink-400 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-base"
          >
            🔙 לבחור משהו אחר
          </button>
          <OnlineGirlsList currentUserId={girl.id} onSendReaction={onSendReaction} />
          {showGalleryLink ? (
            <a
              href="/gallery"
              className="rounded-xl border-2 border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-sm"
            >
              הציורים שלי
            </a>
          ) : null}
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border-2 border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-sm"
          >
            יציאה
          </button>
        </div>
      </header>

      <main className={mainClasses}>{children}</main>
    </div>
  );
}
