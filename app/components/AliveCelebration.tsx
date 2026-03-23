"use client";

import { useEffect } from "react";
import type { AlivePresetId } from "@/app/lib/coloringAlivePreset";

type AliveCelebrationProps = {
  preset: AlivePresetId;
  girl: { name: string; avatar_url: string | null };
  onComplete: () => void;
};

/** Match CSS + container animation duration */
export const ALIVE_CELEBRATION_MS = 2800;

/**
 * Themed “picture came to life” accents (bubbles, glow, etc.).
 * Mount inside the drawing stack so it moves with the animated container; pointer-events none.
 */
export function AliveCelebration({ preset, girl, onComplete }: AliveCelebrationProps) {
  useEffect(() => {
    const t = window.setTimeout(onComplete, ALIVE_CELEBRATION_MS);
    return () => window.clearTimeout(t);
  }, [onComplete]);
  const avatarInitial = girl.name.trim().charAt(0) || "👧";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[25] overflow-hidden rounded-[inherit]"
      aria-hidden
    >
      {preset === "fish" ? (
        <>
          <span className="alive-accent-bubble absolute bottom-[12%] left-[8%] h-3 w-3 rounded-full border border-sky-300/70 bg-sky-100/50" style={{ animationDelay: "0s" }} />
          <span className="alive-accent-bubble absolute bottom-[10%] left-[18%] h-2 w-2 rounded-full border border-cyan-300/60 bg-white/40" style={{ animationDelay: "0.25s" }} />
          <span className="alive-accent-bubble absolute bottom-[14%] left-[28%] h-2.5 w-2.5 rounded-full border border-sky-200/80 bg-cyan-50/60" style={{ animationDelay: "0.5s" }} />
          <span className="alive-accent-bubble absolute bottom-[11%] right-[12%] h-2 w-2 rounded-full border border-sky-300/50 bg-white/45" style={{ animationDelay: "0.35s" }} />
        </>
      ) : null}

      {preset === "elephant" ? (
        <>
          <span className="alive-accent-dust absolute bottom-[8%] left-[20%] h-2 w-2 rounded-full bg-amber-200/50" style={{ animationDelay: "0.1s" }} />
          <span className="alive-accent-dust absolute bottom-[9%] left-[35%] h-1.5 w-1.5 rounded-full bg-stone-300/45" style={{ animationDelay: "0.4s" }} />
          <span className="alive-accent-dust absolute bottom-[7%] right-[25%] h-2 w-2 rounded-full bg-amber-100/55" style={{ animationDelay: "0.65s" }} />
        </>
      ) : null}

      {preset === "butterfly" ? (
        <>
          <span className="alive-accent-flutter absolute left-[15%] top-[35%] text-lg opacity-80" style={{ animationDelay: "0s" }}>
            ✨
          </span>
          <span className="alive-accent-flutter absolute right-[18%] top-[42%] text-base opacity-75" style={{ animationDelay: "0.2s" }}>
            ✨
          </span>
          <span className="alive-accent-flutter absolute left-[42%] top-[22%] text-sm opacity-70" style={{ animationDelay: "0.45s" }}>
            🦋
          </span>
        </>
      ) : null}

      {preset === "car" ? (
        <>
          <span className="alive-accent-speed absolute bottom-[38%] left-[6%] h-0.5 w-8 rounded-full bg-slate-400/35" style={{ animationDelay: "0s" }} />
          <span className="alive-accent-speed absolute bottom-[44%] left-[4%] h-0.5 w-6 rounded-full bg-slate-400/28" style={{ animationDelay: "0.12s" }} />
          <span className="alive-accent-speed absolute bottom-[50%] left-[8%] h-0.5 w-10 rounded-full bg-slate-300/30" style={{ animationDelay: "0.24s" }} />
        </>
      ) : null}

      {preset === "unicorn" ? (
        <div
          className="alive-accent-unicorn-glow absolute inset-0 rounded-[inherit] opacity-90"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(253,186,255,0.45) 0%, rgba(253,224,71,0.12) 45%, transparent 70%)",
          }}
        />
      ) : null}

      {preset === "default" ? (
        <>
          <span className="alive-accent-sparkle absolute left-[12%] top-[28%] text-lg" style={{ animationDelay: "0.1s" }}>
            ✨
          </span>
          <span className="alive-accent-sparkle absolute right-[14%] top-[32%] text-base" style={{ animationDelay: "0.35s" }}>
            ⭐
          </span>
        </>
      ) : null}

      <div className="absolute right-[6%] top-[6%] z-[30] flex max-w-[74%] items-start gap-2">
        <div className="alive-avatar-wrap relative shrink-0 rounded-full bg-gradient-to-br from-pink-300 via-violet-300 to-sky-300 p-[3px] shadow-[0_8px_24px_rgba(139,92,246,0.35)]">
          {girl.avatar_url ? (
            <img
              src={girl.avatar_url}
              alt={`האוואטר של ${girl.name}`}
              className="alive-avatar-bob h-16 w-16 rounded-full border-[3px] border-white object-cover sm:h-20 sm:w-20"
            />
          ) : (
            <div className="alive-avatar-bob flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-br from-violet-100 to-pink-100 text-2xl font-black text-violet-700 sm:h-20 sm:w-20 sm:text-3xl">
              {avatarInitial}
            </div>
          )}
        </div>
        <div className="alive-cheer-bubble mt-1 rounded-2xl border border-white/90 bg-white/92 px-3 py-1.5 text-right shadow-md backdrop-blur-[1px]">
          <p className="text-sm font-extrabold leading-tight text-violet-900 sm:text-base">כל הכבוד!!</p>
        </div>
      </div>
    </div>
  );
}
