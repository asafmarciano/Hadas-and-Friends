"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { getOnlineUsers, type OnlineUser } from "../lib/online";
import { REACTION_TYPES, getReactionEmoji, type ReactionType } from "../lib/reactions";

const POLL_INTERVAL_MS = 3000;
const POPOVER_Z = 9999;
const PANEL_WIDTH_PX = 320;

interface OnlineGirlsListProps {
  currentUserId: string;
  pollIntervalMs?: number;
  onSendReaction?: (toUserId: string, type: ReactionType) => void;
  /** Wider trigger on mobile (e.g. /draw header grid) */
  fullWidthTrigger?: boolean;
}

function updatePanelPosition(triggerEl: HTMLElement | null) {
  if (!triggerEl) return null;
  const rect = triggerEl.getBoundingClientRect();
  const vw = window.innerWidth || 0;
  const desiredLeft = rect.left + rect.width / 2 - PANEL_WIDTH_PX / 2;
  const minMargin = 8;
  const maxLeft = Math.max(minMargin, vw - PANEL_WIDTH_PX - minMargin);
  const left = Math.min(Math.max(desiredLeft, minMargin), maxLeft);
  return {
    top: rect.bottom + 8,
    left,
  };
}

export function OnlineGirlsList({
  currentUserId,
  pollIntervalMs = POLL_INTERVAL_MS,
  onSendReaction,
  fullWidthTrigger = false,
}: OnlineGirlsListProps) {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchList = async () => {
      const list = await getOnlineUsers(currentUserId);
      if (!cancelled) setUsers(list);
    };
    fetchList().finally(() => {
      if (!cancelled) setLoading(false);
    });
    const id = setInterval(fetchList, pollIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [currentUserId, pollIntervalMs]);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    const sync = () => setPosition(updatePanelPosition(triggerRef.current));
    sync();
    const raf = requestAnimationFrame(sync);
    window.addEventListener("scroll", sync, true);
    window.addEventListener("resize", sync);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", sync, true);
      window.removeEventListener("resize", sync);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      const panel = document.getElementById("online-girls-popover");
      if (panel?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const count = users.length;
  const triggerLabel =
    loading
      ? "טוען..."
      : count === 0
        ? "אין חברים מחוברים כרגע"
        : `חברים מחוברים (${count})`;

  const panel =
    open && typeof document !== "undefined" && position
      ? createPortal(
          <div
            id="online-girls-popover"
            role="dialog"
            aria-label="חברים מחוברים"
            className="fixed min-w-[320px] max-w-[95vw] rounded-3xl border-2 border-violet-200 bg-white shadow-xl overflow-hidden"
            dir="rtl"
            style={{
              zIndex: POPOVER_Z,
              top: position.top,
              left: position.left,
              right: "auto",
              boxShadow: "0 12px 48px rgba(139, 92, 246, 0.18)",
            }}
          >
            <div className="px-5 py-3.5 border-b border-violet-100 bg-gradient-to-b from-violet-50/95 to-pink-50/80">
              <span className="text-base font-bold text-gray-800">חברים מחוברים</span>
            </div>
            <div className="max-h-80 overflow-y-auto bg-white p-3">
              {loading ? (
                <p className="px-4 py-6 text-gray-500 text-sm text-center">טוען...</p>
              ) : count === 0 ? (
                <p className="px-4 py-6 text-gray-500 text-sm text-center">אין חברים מחוברים כרגע</p>
              ) : (
                <ul className="space-y-3">
                  {users.map((u) => (
                    <li
                      key={u.user_id}
                      className="flex items-center gap-3 rounded-2xl bg-violet-50/70 px-4 py-3 border border-violet-100"
                    >
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt=""
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                            if (fallback) fallback.style.display = "flex";
                          }}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shrink-0 shadow-sm"
                        />
                      ) : null}
                      <div
                        className="w-10 h-10 rounded-full bg-violet-200 flex items-center justify-center text-base shrink-0 border-2 border-white"
                        style={{ display: u.avatar ? "none" : "flex" }}
                      >
                        👤
                      </div>
                      <span className="text-sm font-semibold text-gray-800 truncate min-w-0 flex-1">
                        {u.display_name ?? u.user_id}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {onSendReaction &&
                          REACTION_TYPES.map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => onSendReaction(u.user_id, type)}
                              className="w-10 h-10 rounded-xl bg-white border-2 border-violet-200 flex items-center justify-center text-xl hover:bg-violet-100 hover:border-violet-300 transition-colors"
                              aria-label={type}
                            >
                              {getReactionEmoji(type)}
                            </button>
                          ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={
          "rounded-xl border-2 border-white bg-white/80 px-2.5 py-1.5 text-xs font-bold text-gray-800 hover:bg-violet-50 hover:border-violet-200 transition-colors shadow-sm min-w-0 max-w-full max-sm:truncate sm:rounded-2xl sm:px-4 sm:py-2 sm:text-sm sm:shrink-0 " +
          (fullWidthTrigger ? "max-sm:w-full max-sm:justify-center max-sm:text-center " : "")
        }
        aria-expanded={open}
      >
        {triggerLabel}
      </button>
      {panel}
    </>
  );
}
