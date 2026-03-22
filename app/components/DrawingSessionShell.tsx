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
  /** Same slot as save toast on /draw — optional extra content in the fixed banner stack */
  bannerExtra?: ReactNode;
  /** Merged after the same base `main` classes as `app/draw/page.tsx` (e.g. quiz `pointer-events-none`) */
  mainClassName?: string;
  /** When false, hides the gallery link (e.g. /game). Defaults to true for Free Draw. */
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
  const mainBase = "flex-1 flex flex-col items-center gap-4 px-3 py-4 pb-6";
  const mainClasses = mainClassName ? `${mainBase} ${mainClassName}` : mainBase;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-violet-50 to-sky-50" dir="rtl">
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none max-w-[90vw]">
        {notifications.map((n) => (
          <ReactionBanner key={n.id} message={n.message} />
        ))}
        {bannerExtra}
      </div>
      <ReactionEffectsLayer reactions={reactionInstances} onExpired={onReactionExpired} />
      <header className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 border-b border-white/60 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {girl.avatar_url ? (
            <img
              src={girl.avatar_url}
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = "flex";
              }}
              className="w-10 h-10 rounded-full object-cover border-2 border-white"
            />
          ) : null}
          <div
            className="w-10 h-10 rounded-full bg-violet-200 flex items-center justify-center text-lg"
            style={{ display: girl.avatar_url ? "none" : "flex" }}
          >
            👤
          </div>
          <span className="font-bold text-gray-800">{girl.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/choose")}
            className="rounded-2xl border-2 border-pink-300 bg-pink-100 px-4 py-2.5 text-base font-bold text-pink-900 hover:bg-pink-200 hover:border-pink-400 shrink-0 shadow-sm"
          >
            🔙 חזרה לבחירת מצב
          </button>
          <OnlineGirlsList currentUserId={girl.id} onSendReaction={onSendReaction} />
          {showGalleryLink ? (
            <a
              href="/gallery"
              className="rounded-2xl border-2 border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100 shrink-0"
            >
              הציורים שלי
            </a>
          ) : null}
          <button
            type="button"
            onClick={onLogout}
            className="rounded-2xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shrink-0"
          >
            יציאה
          </button>
        </div>
      </header>

      <main className={mainClasses}>{children}</main>
    </div>
  );
}
