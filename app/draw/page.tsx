"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCurrentGirl, logoutGirl } from "../lib/auth";
import { getLatestDrawingForGirl, saveDrawingToGallery } from "../lib/drawings";
import { startPresence, stopPresence, markOffline } from "../lib/online";
import {
  subscribeReactions,
  sendReaction,
  getSenderName,
  getReactionMessage,
  type ReactionType,
  type ReactionPayload,
} from "../lib/reactions";
import { FreeDrawCanvas, type FreeDrawCanvasHandle } from "../components/FreeDrawCanvas";
import { DrawingToolbar } from "../components/DrawingToolbar";
import { OnlineGirlsList } from "../components/OnlineGirlsList";
import { ReactionBanner } from "../components/ReactionBanner";
import { ReactionEffectsLayer, type ReactionInstance } from "../components/ReactionEffectsLayer";
import { BRUSH_SIZES } from "../components/BrushSizePicker";


const DEFAULT_COLOR = "#f9a8d4";

export default function DrawPage() {
  const router = useRouter();
  const canvasRef = useRef<FreeDrawCanvasHandle | null>(null);
  const sessionRef = useRef<{ id: string; name: string; avatar: string | null } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1].size);
  const [isEraser, setIsEraser] = useState(false);
  const [initialDrawingUrl, setInitialDrawingUrl] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: ReactionType }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!getCurrentGirl()) router.replace("/");
  }, [mounted, router]);

  useEffect(() => {
    if (!mounted) return;
    const girl = getCurrentGirl();
    if (!girl) return;
    const draftKey = `draft_drawing_${girl.id}`;
    const draft = typeof localStorage !== "undefined" ? localStorage.getItem(draftKey) : null;
    if (draft) {
      setInitialDrawingUrl(draft);
      return;
    }
    (async () => {
      try {
        const latest = await getLatestDrawingForGirl(girl.id);
        setInitialDrawingUrl(latest?.image_url ?? null);
      } catch {
        setInitialDrawingUrl(null);
      }
    })();
  }, [mounted]);

  useEffect(() => {
    return () => {
      if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
    };
  }, []);

  const girl = mounted ? getCurrentGirl() : null;

  useEffect(() => {
    sessionRef.current = girl;
  }, [girl]);

  useEffect(() => {
    if (!girl) return;
    startPresence(girl);
    return () => stopPresence();
  }, [girl?.id]);

  useEffect(() => {
    const handleUnload = () => {
      const session = sessionRef.current;
      if (session) {
        markOffline(session);
        stopPresence();
      }
    };
    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  useEffect(() => {
    if (!girl) return;
    const unsubscribe = subscribeReactions(girl.id, async (payload: ReactionPayload) => {
      const senderName = await getSenderName(payload.from_user_id);
      const message = getReactionMessage(senderName, payload.reaction_type);
      const id = payload.id ?? crypto.randomUUID();
      setNotifications((prev) => [...prev, { id, message, type: payload.reaction_type }]);
    });
    return unsubscribe;
  }, [girl?.id]);

  const handleSendReaction = (toUserId: string, type: ReactionType) => {
    if (!girl) return;
    sendReaction(girl.id, toUserId, type);
  };

  const handleLogout = async () => {
    if (!girl) return;
    await markOffline(girl);
    stopPresence();
    logoutGirl();
    router.replace("/");
  };

  const handleClear = () => {
    if (girl) {
      try {
        localStorage.removeItem(`draft_drawing_${girl.id}`);
      } catch {}
    }
    canvasRef.current?.clear();
  };

  const handleStrokeEnd = useCallback(() => {
    if (!girl) return;
    if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
    draftSaveTimerRef.current = setTimeout(() => {
      draftSaveTimerRef.current = null;
      const dataUrl = canvasRef.current?.getImageDataUrl();
      if (dataUrl) {
        try {
          localStorage.setItem(`draft_drawing_${girl.id}`, dataUrl);
        } catch (e) {
          console.warn("draft save failed", e);
        }
      }
    }, 500);
  }, [girl?.id]);

  const handleSaveDrawing = async () => {
    if (!girl || !canvasRef.current) return;
    const dataUrl = canvasRef.current.getImageDataUrl();
    if (!dataUrl) return;
    setSaving(true);
    try {
      await saveDrawingToGallery(girl.id, dataUrl);
      setSaveMessage("הציור נשמר");
    } catch (e) {
      console.error("save drawing failed", e);
      setSaveMessage("שמירה נכשלה, נסי שוב");
    } finally {
      setSaving(false);
      window.setTimeout(() => setSaveMessage(null), 2000);
    }
  };

  if (!mounted || !girl) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-violet-50 to-sky-50" dir="rtl">
        <p className="text-xl text-gray-700">טוען...</p>
      </main>
    );
  }

  const reactionInstances: ReactionInstance[] = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    createdAt: Date.now(),
  }));

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-violet-50 to-sky-50" dir="rtl">
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none max-w-[90vw]">
        {notifications.map((n) => (
          <ReactionBanner key={n.id} message={n.message} />
        ))}
        {saveMessage && (
          <div className="mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-md">
            {saveMessage}
          </div>
        )}
      </div>
      <ReactionEffectsLayer
        reactions={reactionInstances}
        onExpired={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
      />
      <header className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 border-b border-white/60 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {girl.avatar ? (
            <img
              src={girl.avatar}
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
            style={{ display: girl.avatar ? "none" : "flex" }}
          >
            👤
          </div>
          <span className="font-bold text-gray-800">{girl.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <OnlineGirlsList currentUserId={girl.id} onSendReaction={handleSendReaction} />
          <a
            href="/gallery"
            className="rounded-2xl border-2 border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100 shrink-0"
          >
            הציורים שלי
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-2xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shrink-0"
          >
            יציאה
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center gap-4 px-3 py-4 pb-6">
        <FreeDrawCanvas
          ref={canvasRef}
          brushColor={color}
          brushSize={brushSize}
          isEraser={isEraser}
          initialDataUrl={initialDrawingUrl}
          onStrokeEnd={handleStrokeEnd}
        />
        <DrawingToolbar
          selectedColor={color}
          onSelectColor={(c) => { setColor(c); if (isEraser) setIsEraser(false); }}
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
          isEraser={isEraser}
          onEraserToggle={() => setIsEraser((v) => !v)}
          onClear={handleClear}
          onSave={handleSaveDrawing}
        />
      </main>
    </div>
  );
}
