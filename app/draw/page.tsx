"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentGirl, logoutGirl } from "../lib/auth";
import { getLatestDrawingForGirl, getDrawingById, saveDrawingToGallery } from "../lib/drawings";
import { supabase } from "../lib/supabase";
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
import { DrawingSessionShell } from "../components/DrawingSessionShell";
import { type ReactionInstance } from "../components/ReactionEffectsLayer";
import { BRUSH_SIZES } from "../components/BrushSizePicker";


const DEFAULT_COLOR = "#f9a8d4";

const DRAWINGS_BUCKET = "drawings";
const SIGNED_URL_EXPIRY_SEC = 60 * 60;

function DrawPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canvasRef = useRef<FreeDrawCanvasHandle | null>(null);
  const sessionRef = useRef<{ id: string; name: string; avatar: string | null } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [brushSize, setBrushSize] = useState<number>(BRUSH_SIZES[1].size);
  const [isEraser, setIsEraser] = useState(false);
  const [initialDrawingUrl, setInitialDrawingUrl] = useState<string | null>(null);
  const [initialReady, setInitialReady] = useState(false);
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
    const editId = searchParams.get("edit");
    if (editId) {
      (async () => {
        try {
          const drawing = await getDrawingById(editId, girl.id);
          if (drawing?.storage_path) {
            const { data } = await supabase.storage
              .from(DRAWINGS_BUCKET)
              .createSignedUrl(drawing.storage_path, SIGNED_URL_EXPIRY_SEC);
            setInitialDrawingUrl(data?.signedUrl ?? null);
          } else setInitialDrawingUrl(null);
        } catch {
          setInitialDrawingUrl(null);
        }
        setInitialReady(true);
      })();
      return;
    }
    const draftKey = `draft_drawing_${girl.id}`;
    const draft = typeof localStorage !== "undefined" ? localStorage.getItem(draftKey) : null;
    if (draft) {
      setInitialDrawingUrl(draft);
      setInitialReady(true);
      return;
    }
    (async () => {
      try {
        const latest = await getLatestDrawingForGirl(girl.id);
        setInitialDrawingUrl(latest?.image_url ?? null);
      } catch {
        setInitialDrawingUrl(null);
      }
      setInitialReady(true);
    })();
  }, [mounted, searchParams]);

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

  if (!mounted || !girl || !initialReady) {
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
    <DrawingSessionShell
      girl={girl}
      notifications={notifications}
      reactionInstances={reactionInstances}
      onReactionExpired={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
      onSendReaction={handleSendReaction}
      onLogout={handleLogout}
      bannerExtra={
        saveMessage ? (
          <div className="mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-md">
            {saveMessage}
          </div>
        ) : null
      }
    >
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
    </DrawingSessionShell>
  );
}

export default function DrawPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-violet-50 to-sky-50" dir="rtl">
          <p className="text-xl text-gray-700">טוען...</p>
        </main>
      }
    >
      <DrawPageContent />
    </Suspense>
  );
}
