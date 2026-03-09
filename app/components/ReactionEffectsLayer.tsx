"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { ReactionType } from "../lib/reactions";
import { getReactionEmoji } from "../lib/reactions";

export interface ReactionInstance {
  id: string;
  type: ReactionType;
  createdAt: number;
}

const EFFECT_DURATION_MS = 5000;

interface FloatConfig {
  emoji: string;
  size: number;
  left: number;
  bottom: number;
  duration: number;
  delay: number;
  driftPx: number;
}

const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "_");

function ReactionBurst({ id, type, onDone }: { id: string; type: ReactionType; onDone: () => void }) {
  const emoji = getReactionEmoji(type);

  const configs = useMemo<FloatConfig[]>(() => {
    const count = 5 + Math.floor(Math.random() * 2);
    const arr: FloatConfig[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        emoji,
        size: 52 + Math.random() * 56,
        left: 5 + Math.random() * 88,
        bottom: 8 + Math.random() * 22,
        duration: 4 + Math.random() * 1,
        delay: Math.random() * 0.6,
        driftPx: (Math.random() - 0.5) * 60,
      });
    }
    return arr;
  }, [emoji]);

  useEffect(() => {
    const t = setTimeout(onDone, EFFECT_DURATION_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  const styleContent = useMemo(() => {
    const prefix = `reactionFloat_${sanitize(id)}`;
    return configs
      .map(
        (c, idx) => `
@keyframes ${prefix}_${idx}_${String(c.driftPx).replace(".", "d")} {
  0% {
    transform: translate3d(0px, 0px, 0) scale(0.9);
    opacity: 0;
  }
  14% {
    opacity: 1;
  }
  86% {
    opacity: 1;
  }
  100% {
    transform: translate3d(${c.driftPx}px, -420px, 0) scale(1.05);
    opacity: 0;
  }
}`
      )
      .join("\n");
  }, [id, configs]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styleContent }} />
      {configs.map((c, idx) => {
        const prefix = `reactionFloat_${sanitize(id)}`;
        const animName = `${prefix}_${idx}_${String(c.driftPx).replace(".", "d")}`;
        return (
          <div
            key={idx}
            className="absolute pointer-events-none"
            style={{
              left: `${c.left}%`,
              bottom: `${c.bottom}%`,
              fontSize: `${c.size}px`,
              willChange: "transform, opacity",
              animation: `${animName} ${c.duration}s cubic-bezier(0.33, 0.7, 0.5, 0.9) ${c.delay}s forwards`,
            }}
          >
            {c.emoji}
          </div>
        );
      })}
    </>
  );
}

export interface ReactionEffectsLayerProps {
  reactions: ReactionInstance[];
  onExpired: (id: string) => void;
}

export function ReactionEffectsLayer({ reactions, onExpired }: ReactionEffectsLayerProps) {
  const handleDone = useCallback((id: string) => () => onExpired(id), [onExpired]);

  if (reactions.length === 0) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none" aria-hidden>
      {reactions.map((r) => (
        <ReactionBurst key={r.id} id={r.id} type={r.type} onDone={handleDone(r.id)} />
      ))}
    </div>
  );
}
