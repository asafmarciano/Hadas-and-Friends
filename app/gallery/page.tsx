"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentGirl } from "../lib/auth";
import { listGirlDrawings, deleteDrawingById, type DrawingRecord } from "../lib/drawings";
import { supabase } from "../lib/supabase";

const BUCKET = "drawings";
const SIGNED_URL_EXPIRY_SEC = 60 * 60;

/** Resolve a signed URL for gallery preview from storage_path. Uses storage_path as source of truth. */
async function resolveDrawingPreviewUrl(storagePath: string): Promise<string | null> {
  if (!storagePath?.trim()) return null;
  console.log("drawing.storage_path", storagePath);
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SEC);
  console.log("signed URL result", { signedUrl: data?.signedUrl ?? null, error: error ?? null });
  if (error) {
    console.error("signed URL error", error);
    return null;
  }
  return data?.signedUrl ?? null;
}

export default function GalleryPage() {
  const [mounted, setMounted] = useState(false);
  const [drawings, setDrawings] = useState<DrawingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string | null>>({});
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const girl = getCurrentGirl();
    if (!girl) {
      window.location.href = "/";
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await listGirlDrawings(girl.id);
        if (!cancelled) setDrawings(list);
      } catch {
        if (!cancelled) setMessage("משהו השתבש בטעינת הציורים");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted]);

  useEffect(() => {
    if (drawings.length === 0) {
      setPreviewUrls({});
      return;
    }
    let cancelled = false;
    (async () => {
      const next: Record<string, string | null> = {};
      for (const d of drawings) {
        if (cancelled) break;
        if (!d.storage_path) {
          next[d.id] = null;
          continue;
        }
        const url = await resolveDrawingPreviewUrl(d.storage_path);
        if (!cancelled) next[d.id] = url;
      }
      if (!cancelled) setPreviewUrls((prev) => ({ ...prev, ...next }));
    })();
    return () => {
      cancelled = true;
    };
  }, [drawings]);

  const handleDelete = async (drawing: DrawingRecord) => {
    const ok = window.confirm("למחוק את הציור הזה?");
    if (!ok) return;
    try {
      await deleteDrawingById(drawing.id, drawing.storage_path);
      setDrawings((prev) => prev.filter((d) => d.id !== drawing.id));
      setMessage("הציור נמחק");
      window.setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage("מחיקה נכשלה, נסי שוב");
      window.setTimeout(() => setMessage(null), 2000);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-violet-50 to-sky-50" dir="rtl">
      <header className="flex items-center justify-between gap-3 px-4 py-4 border-b border-white/60 bg-white/70 backdrop-blur-sm">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">הציורים שלי</h1>
        <Link
          href="/draw"
          className="rounded-2xl border-2 border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100"
        >
          לציור
        </Link>
      </header>

      <main className="flex-1 px-4 py-4 pb-8">
        {message && (
          <div className="mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 max-w-md mx-auto text-center">
            {message}
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-700 text-lg">טוען ציורים...</p>
          </div>
        ) : drawings.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-600 text-base">עדיין אין לך ציורים שמורים.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {drawings.map((d) => {
              const signedUrl = previewUrls[d.id];
              const showImage = d.storage_path && signedUrl && !failedImageIds.has(d.id);
              return (
              <div
                key={d.id}
                className="flex flex-col rounded-3xl bg-white/90 border-2 border-white shadow-lg overflow-hidden"
              >
                <div className="relative w-full pt-[75%] bg-gray-100">
                  {showImage ? (
                    <img
                      src={signedUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-contain bg-white"
                      onError={() => {
                        setFailedImageIds((prev) => new Set(prev).add(d.id));
                        console.warn("Gallery image failed to load", {
                          drawingId: d.id,
                          storage_path: d.storage_path,
                          resolvedUrl: signedUrl,
                        });
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-gray-500 text-sm">
                      לא ניתן לטעון תצוגה מקדימה
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500">
                      {new Date(d.created_at).toLocaleString("he-IL", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(d)}
                      className="rounded-2xl border-2 border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      מחקי
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/gallery/print?drawingId=${d.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-2xl border-2 border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                    >
                      הדפסי
                    </Link>
                    <Link
                      href={`/draw?edit=${d.id}`}
                      className="rounded-2xl border-2 border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                    >
                      עריכת ציור
                    </Link>
                    <a
                      href={signedUrl ? `mailto:?subject=${encodeURIComponent("הציור שלי")}&body=${encodeURIComponent(signedUrl)}` : "#"}
                      className="rounded-2xl border-2 border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                      onClick={(e) => !signedUrl && e.preventDefault()}
                    >
                      שלחי במייל
                    </a>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

