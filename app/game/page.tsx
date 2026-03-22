"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentGirl, logoutGirl, useSessionAvatarHydration } from "../lib/auth";
import { BRUSH_SIZES } from "../components/BrushSizePicker";
import { DrawingSessionShell } from "../components/DrawingSessionShell";
import { type ReactionInstance } from "../components/ReactionEffectsLayer";
import { startPresence, stopPresence, markOffline } from "../lib/online";
import {
  subscribeReactions,
  sendReaction,
  getSenderName,
  getReactionMessage,
  type ReactionType,
  type ReactionPayload,
} from "../lib/reactions";
import { riddles, type RiddleRecord } from "@/app/data/riddles";
import { imageRiddles } from "@/app/data/imageRiddles";
import { GAME_DRAW_PALETTE as PALETTE } from "@/app/lib/gameDrawPalette";
import { GamePaintPaletteStrip } from "@/app/components/GamePaintPaletteStrip";

const allRiddles: RiddleRecord[] = [...riddles, ...imageRiddles];

type ActiveQuiz = {
  question: string;
  choices: string[];
  correctIndex: number;
  image?: string;
};

function jsonRiddleToActive(raw: RiddleRecord): ActiveQuiz {
  const choices = raw.options.map((o) => String(o).trim());
  const ans = String(raw.answer).trim();
  let correctIndex = choices.findIndex((c) => c === ans);
  if (correctIndex < 0) {
    correctIndex = choices.findIndex((c) => c.normalize("NFKC") === ans.normalize("NFKC"));
  }
  if (correctIndex < 0) correctIndex = 0;
  const image =
    typeof raw.image === "string" && raw.image.trim() !== "" ? raw.image.trim() : undefined;
  return { question: raw.prompt, choices, correctIndex, image };
}

type Phase = "paint" | "quiz";

function applyCanvasPixelSize(canvas: HTMLCanvasElement, cssWidth: number, cssHeight: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.floor(cssWidth));
  const h = Math.max(1, Math.floor(cssHeight));
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export default function GamePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(PALETTE[0]);
  const [brushSize, setBrushSize] = useState<number>(BRUSH_SIZES[1].size);
  const [isEraser, setIsEraser] = useState(false);
  const [levelIndex, setLevelIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("paint");
  const [quizCorrect, setQuizCorrect] = useState(false);
  const [quizWrong, setQuizWrong] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<ActiveQuiz | null>(null);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: ReactionType }[]>([]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const didDrawStrokeRef = useRef(false);
  const undoStackRef = useRef<ImageData[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const sessionRef = useRef<{ id: string; name: string; avatar_url: string | null } | null>(null);

  const [coloringFilenames, setColoringFilenames] = useState<string[]>([]);
  const [coloringImageUrl, setColoringImageUrl] = useState<string | null>(null);
  const [coloringListReady, setColoringListReady] = useState(false);
  const recentColoringFilenamesRef = useRef<string[]>([]);
  const lastColoringFilenameRef = useRef<string | null>(null);
  const recentRiddleIndexRef = useRef<number[]>([]);
  const lastRiddleIndexRef = useRef<number | null>(null);

  const pickColoringFilenameSmart = useCallback((filenames: string[]): string | null => {
    if (filenames.length === 0) return null;
    if (filenames.length === 1) {
      const only = filenames[0]!;
      recentColoringFilenamesRef.current = [...recentColoringFilenamesRef.current, only].slice(-5);
      lastColoringFilenameRef.current = only;
      return only;
    }
    const last5 = recentColoringFilenamesRef.current;
    const lastFn = lastColoringFilenameRef.current;
    let candidates = filenames.filter((f) => f !== lastFn && !last5.includes(f));
    if (candidates.length === 0) {
      candidates = filenames.filter((f) => f !== lastFn);
    }
    if (candidates.length === 0) {
      const fallback = lastFn ?? filenames[0]!;
      recentColoringFilenamesRef.current = [...recentColoringFilenamesRef.current, fallback].slice(-5);
      lastColoringFilenameRef.current = fallback;
      return fallback;
    }
    const picked = candidates[Math.floor(Math.random() * candidates.length)]!;
    recentColoringFilenamesRef.current = [...recentColoringFilenamesRef.current, picked].slice(-5);
    lastColoringFilenameRef.current = picked;
    return picked;
  }, []);

  const pickRandomActiveQuiz = useCallback((): ActiveQuiz => {
    const n = allRiddles.length;
    if (n === 0) {
      return {
        question: "",
        choices: [""],
        correctIndex: 0,
      };
    }
    const last5 = recentRiddleIndexRef.current;
    const lastIdx = lastRiddleIndexRef.current;
    const indices = allRiddles.map((_, i) => i);
    let candidates = indices.filter((i) => i !== lastIdx && !last5.includes(i));
    if (candidates.length === 0) {
      candidates = indices.filter((i) => i !== lastIdx);
    }
    if (candidates.length === 0) {
      const picked = indices[0]!;
      recentRiddleIndexRef.current = [...recentRiddleIndexRef.current, picked].slice(-5);
      lastRiddleIndexRef.current = picked;
      return jsonRiddleToActive(allRiddles[picked]!);
    }
    const picked = candidates[Math.floor(Math.random() * candidates.length)]!;
    recentRiddleIndexRef.current = [...recentRiddleIndexRef.current, picked].slice(-5);
    lastRiddleIndexRef.current = picked;
    return jsonRiddleToActive(allRiddles[picked]!);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/coloring-images");
        const data = await res.json();
        if (!cancelled && Array.isArray(data.files)) {
          setColoringFilenames(data.files);
        }
      } catch {
        if (!cancelled) setColoringFilenames([]);
      } finally {
        if (!cancelled) setColoringListReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!coloringListReady) return;
    if (coloringFilenames.length === 0) {
      setColoringImageUrl(null);
      return;
    }
    const chosen = pickColoringFilenameSmart(coloringFilenames);
    if (chosen === null) {
      setColoringImageUrl(null);
      return;
    }
    setColoringImageUrl(`/coloring/${encodeURIComponent(chosen)}`);
  }, [levelIndex, coloringFilenames, coloringListReady, pickColoringFilenameSmart]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useSessionAvatarHydration(mounted);

  useEffect(() => {
    if (!mounted) return;
    if (!getCurrentGirl()) router.replace("/");
  }, [mounted, router]);

  const girl = mounted ? getCurrentGirl() : null;
  const girlId = girl?.id;

  useEffect(() => {
    sessionRef.current = girl;
  }, [girl]);

  useEffect(() => {
    if (!girl) return;
    startPresence(girl);
    return () => stopPresence();
  }, [girl?.id, girl?.avatar_url]);

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

  const handleSendReaction = useCallback(
    (toUserId: string, type: ReactionType) => {
      if (!girl) return;
      sendReaction(girl.id, toUserId, type);
    },
    [girl],
  );

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

  const handleLogout = async () => {
    if (!girl) return;
    await markOffline(girl);
    stopPresence();
    logoutGirl();
    router.replace("/");
  };

  const resetUndoToEmpty = useCallback(() => {
    const c = drawCanvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    undoStackRef.current = [ctx.getImageData(0, 0, c.width, c.height)];
    setCanUndo(false);
  }, []);

  const resizeCanvasToWrap = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = drawCanvasRef.current;
    if (!wrap || !canvas) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w < 2 || h < 2) return;
    applyCanvasPixelSize(canvas, w, h);
  }, []);

  useEffect(() => {
    if (!girlId) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const sync = () => {
      resizeCanvasToWrap();
      resetUndoToEmpty();
    };
    sync();
    const ro = new ResizeObserver(() => {
      sync();
    });
    ro.observe(wrap);
    const id = requestAnimationFrame(() => sync());
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [girlId, levelIndex, coloringImageUrl, resizeCanvasToWrap, resetUndoToEmpty]);

  /** Pointer → canvas CSS pixels (matches ctx after setTransform(dpr)) */
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return { x, y };
  }, []);

  const paintSegment = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      const ctx = drawCanvasRef.current?.getContext("2d");
      if (!ctx) return;
      ctx.save();
      if (isEraser) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = selectedColor;
      }
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    },
    [brushSize, isEraser, selectedColor],
  );

  const commitUndoSnapshot = useCallback(() => {
    const c = drawCanvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    try {
      const snap = ctx.getImageData(0, 0, c.width, c.height);
      undoStackRef.current.push(snap);
      while (undoStackRef.current.length > 26) {
        undoStackRef.current.splice(1, 1);
      }
      setCanUndo(undoStackRef.current.length > 1);
    } catch {
      /* ignore */
    }
  }, []);

  const handleUndo = useCallback(() => {
    const c = drawCanvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx || undoStackRef.current.length <= 1) return;
    undoStackRef.current.pop();
    const prev = undoStackRef.current[undoStackRef.current.length - 1];
    if (prev) ctx.putImageData(prev, 0, 0);
    setCanUndo(undoStackRef.current.length > 1);
  }, []);

  const handleClear = useCallback(() => {
    resetUndoToEmpty();
  }, [resetUndoToEmpty]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (phase !== "paint") return;
      const p = getCanvasCoords(e.clientX, e.clientY);
      if (!p) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      drawingRef.current = true;
      didDrawStrokeRef.current = false;
      lastRef.current = p;
    },
    [getCanvasCoords, phase],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (phase !== "paint" || !drawingRef.current || !lastRef.current) return;
      const p = getCanvasCoords(e.clientX, e.clientY);
      if (!p) return;
      e.preventDefault();
      const prev = lastRef.current;
      paintSegment(prev.x, prev.y, p.x, p.y);
      didDrawStrokeRef.current = true;
      lastRef.current = p;
    },
    [getCanvasCoords, paintSegment, phase],
  );

  const endStroke = useCallback(() => {
    drawingRef.current = false;
    lastRef.current = null;
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      const drew = didDrawStrokeRef.current;
      endStroke();
      if (drew) {
        didDrawStrokeRef.current = false;
        commitUndoSnapshot();
      }
    },
    [commitUndoSnapshot, endStroke],
  );

  const handleFinishDrawing = () => {
    setActiveQuiz(pickRandomActiveQuiz());
    setPhase("quiz");
    setQuizCorrect(false);
    setQuizWrong(false);
  };

  const handleQuizPick = (choiceIndex: number) => {
    if (!activeQuiz) return;
    if (choiceIndex === activeQuiz.correctIndex) {
      setQuizCorrect(true);
      setQuizWrong(false);
    } else {
      setQuizWrong(true);
    }
  };

  const handleNextLevel = () => {
    setLevelIndex((i) => i + 1);
    setPhase("paint");
    setActiveQuiz(null);
    setQuizCorrect(false);
    setQuizWrong(false);
    setSelectedColor(PALETTE[0]);
    setIsEraser(false);
  };


  if (!mounted || !girl) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-violet-50 to-sky-50" dir="rtl">
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
    <>
      <DrawingSessionShell
        girl={girl}
        notifications={notifications}
        reactionInstances={reactionInstances}
        onReactionExpired={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
        onSendReaction={handleSendReaction}
        onLogout={handleLogout}
        mainClassName={phase === "quiz" ? "pointer-events-none" : undefined}
        showGalleryLink={false}
      >
        <div className="flex h-full min-h-0 w-full min-w-0 max-w-4xl flex-1 flex-col gap-1 sm:mx-auto sm:gap-2">
              <div className="grid min-h-0 w-full flex-1 grid-rows-[minmax(0,1fr)_auto] gap-1.5 rounded-[1.15rem] border-2 border-violet-200/90 bg-gradient-to-b from-white via-fuchsia-50/30 to-violet-50/40 p-1.5 max-sm:gap-1 max-sm:p-1 shadow-md shadow-violet-200/30 ring-1 ring-white/80 sm:gap-3 sm:p-2">
                <div className="flex h-full min-h-0 min-w-0 w-full items-stretch justify-center max-sm:justify-center sm:justify-start">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl ring-2 ring-violet-100/90 max-sm:h-full max-sm:max-h-full max-sm:w-auto max-sm:max-w-full max-sm:shrink-0 sm:h-auto sm:w-full sm:max-h-full sm:min-h-0 sm:self-start">
                    <div ref={wrapRef} className="absolute inset-0 h-full w-full min-h-0">
                      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none bg-neutral-100 p-0.5">
                        {!coloringListReady ? (
                          <span className="text-sm font-medium text-gray-400">טוען תמונה…</span>
                        ) : coloringImageUrl ? (
                          <img
                            key={coloringImageUrl}
                            src={coloringImageUrl}
                            alt=""
                            className="h-full max-h-full w-auto max-w-full object-contain pointer-events-none select-none"
                            draggable={false}
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-400 text-center px-2">
                            אין תמונות זמינות
                          </span>
                        )}
                      </div>
                      <canvas
                        ref={drawCanvasRef}
                        className={`absolute inset-0 z-10 h-full w-full touch-none ${
                          phase === "paint" ? (isEraser ? "cursor-cell" : "cursor-crosshair") : "cursor-default pointer-events-none"
                        }`}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                      />
                    </div>
                  </div>
                </div>

                <div className="min-w-0">
                {phase === "paint" && (
                  <>
                    <GamePaintPaletteStrip
                      selectedColor={selectedColor}
                      isEraser={isEraser}
                      onSelectColor={(hex) => {
                        setSelectedColor(hex);
                        setIsEraser(false);
                      }}
                    />

                    <div className="rounded-lg border border-sky-100/80 bg-gradient-to-r from-sky-50/70 to-violet-50/50 px-1 py-0.5 shadow-sm shrink-0 sm:rounded-xl sm:px-1.5 sm:py-1">
                      <div className="flex flex-wrap items-center justify-center gap-0.5 sm:gap-1.5">
                        {BRUSH_SIZES.map(({ id, label, size }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setBrushSize(size)}
                            className={
                              "min-h-[32px] px-1.5 py-0.5 text-[0.65rem] sm:min-h-[36px] sm:px-2 sm:py-1 sm:text-xs rounded-md border font-bold transition-colors touch-manipulation sm:rounded-lg " +
                              (brushSize === size
                                ? "bg-violet-200 border-violet-500 text-violet-950"
                                : "bg-white border-violet-200 text-violet-800 hover:bg-violet-50")
                            }
                          >
                            {label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setIsEraser((v) => !v)}
                          className={
                            "min-h-[32px] px-1.5 py-0.5 text-[0.65rem] sm:min-h-[36px] sm:px-2 sm:py-1 sm:text-xs rounded-md border font-bold touch-manipulation sm:rounded-lg " +
                            (isEraser
                              ? "bg-amber-200 border-amber-500 text-amber-950"
                              : "bg-white border-amber-200 text-amber-900 hover:bg-amber-50")
                          }
                        >
                          🧽 מחק
                        </button>
                        <button
                          type="button"
                          onClick={handleUndo}
                          disabled={!canUndo}
                          className="min-h-[32px] px-1.5 py-0.5 text-[0.65rem] sm:min-h-[36px] sm:px-2 sm:py-1 sm:text-xs rounded-md border border-sky-200 bg-white font-bold text-sky-900 hover:bg-sky-50 disabled:pointer-events-none disabled:opacity-40 touch-manipulation sm:rounded-lg"
                        >
                          ↩️ ביטול
                        </button>
                        <button
                          type="button"
                          onClick={handleClear}
                          className="min-h-[32px] px-1.5 py-0.5 text-[0.65rem] sm:min-h-[36px] sm:px-2 sm:py-1 sm:text-xs rounded-md border border-red-200 bg-red-50 font-bold text-red-800 hover:bg-red-100 touch-manipulation sm:rounded-lg"
                        >
                          🗑️ נקה
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleFinishDrawing}
                      className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 py-1.5 text-sm font-bold text-white shadow-md ring-1 ring-white/40 hover:from-emerald-600 hover:to-teal-600 shrink-0 sm:rounded-xl sm:py-2 sm:text-base"
                    >
                      סיימתם! ✨
                    </button>
                  </>
                )}
                </div>
              </div>
            </div>
      </DrawingSessionShell>

      {phase === "quiz" && activeQuiz && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-[3px] pointer-events-auto overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="game-quiz-title"
        >
          <div className="w-full max-w-md rounded-[1.75rem] border-4 border-white/80 bg-gradient-to-br from-pink-50 via-violet-50 to-sky-100 shadow-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 text-center ring-4 ring-violet-200/60 my-auto">
            <p id="game-quiz-title" className="text-xl sm:text-2xl font-extrabold text-emerald-600 drop-shadow-sm">
              כל הכבוד! 🌟
            </p>
            {activeQuiz.image ? (
              <div
                className="text-7xl sm:text-8xl leading-none py-1 select-none"
                aria-hidden
                role="img"
              >
                {activeQuiz.image}
              </div>
            ) : null}
            <p className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">{activeQuiz.question}</p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 pt-0.5">
              {activeQuiz.choices.map((choice, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={quizCorrect}
                  onClick={() => handleQuizPick(idx)}
                  className="min-w-[4rem] rounded-2xl border-2 border-violet-300 bg-white/90 px-5 py-3 text-xl sm:text-2xl font-bold text-violet-900 shadow-md hover:bg-violet-100 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-transform touch-manipulation"
                >
                  {choice}
                </button>
              ))}
            </div>
            {quizWrong && !quizCorrect && (
              <p className="text-base font-semibold text-red-600">לא נכון, נסו שוב</p>
            )}
            {quizCorrect && (
              <button
                type="button"
                onClick={handleNextLevel}
                className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 text-lg sm:text-xl font-bold text-white shadow-lg hover:from-violet-600 hover:to-fuchsia-600 touch-manipulation"
              >
                הבא
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
