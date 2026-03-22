"use client";

import { useState, useEffect } from "react";

async function fetchAvatarUrlList(): Promise<string[]> {
  const res = await fetch("/api/avatars");
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data
    .filter((x): x is { url: string } => typeof (x as { url?: unknown }).url === "string")
    .map((x) => (x as { url: string }).url);
}

export type AvatarPickerProps = {
  displayName: string;
  title?: string;
  subtitle?: string | null;
  continueLabel: string;
  /** When set, uses this list and does not call /api/avatars */
  urlsOverride?: string[];
  initialSelectedUrl?: string | null;
  onBack?: () => void;
  backLabel?: string;
  onConfirm: (url: string) => void | Promise<void>;
  /** Optional id for the title heading (e.g. aria-labelledby) */
  headingId?: string;
};

export function AvatarPicker({
  displayName,
  title = "בחרי תמונה לפרופיל",
  subtitle,
  continueLabel,
  urlsOverride,
  initialSelectedUrl = null,
  onBack,
  backLabel = "🔙 חזרה",
  onConfirm,
  headingId,
}: AvatarPickerProps) {
  const [urls, setUrls] = useState<string[]>(() => urlsOverride ?? []);
  const [loading, setLoading] = useState(() => urlsOverride === undefined);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(initialSelectedUrl);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setSelectedUrl(initialSelectedUrl);
  }, [initialSelectedUrl]);

  useEffect(() => {
    if (urlsOverride !== undefined) {
      setUrls(urlsOverride);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchAvatarUrlList()
      .then((list) => {
        if (!cancelled) setUrls(list);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [urlsOverride]);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 flex-1 px-4 py-8" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="rounded-2xl border-2 border-pink-300 bg-pink-100 px-4 py-2 text-sm font-bold text-pink-900 hover:bg-pink-200 shrink-0"
          >
            {backLabel}
          </button>
        ) : (
          <span className="w-[6.5rem] shrink-0" aria-hidden />
        )}
        <h2 id={headingId} className="text-xl sm:text-2xl font-extrabold text-gray-900 text-center flex-1">
          {title}
        </h2>
        <span className="w-[6.5rem] shrink-0" aria-hidden />
      </div>
      <p className="text-center text-gray-700 text-lg font-medium">{displayName}</p>
      {subtitle ? <p className="text-center text-gray-600 text-sm -mt-2">{subtitle}</p> : null}

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <p className="text-xl text-gray-700">טוען תמונות…</p>
        </div>
      ) : urls.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 px-4">
          <p className="text-lg text-gray-600 text-center">אין תמונות זמינות כרגע</p>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="rounded-2xl border-2 border-violet-200 bg-violet-50 px-6 py-3 font-bold text-violet-800 hover:bg-violet-100"
            >
              {backLabel}
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 w-full">
            {urls.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => setSelectedUrl(url)}
                className={
                  "relative aspect-square rounded-2xl overflow-hidden border-4 shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-violet-300/70 touch-manipulation " +
                  (selectedUrl === url
                    ? "border-violet-500 ring-4 ring-violet-200 scale-[1.02]"
                    : "border-white/90 hover:border-violet-200 hover:scale-[1.01]")
                }
              >
                <img src={url} alt="" className="w-full h-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={selectedUrl === null || confirming}
            onClick={() => {
              if (!selectedUrl || confirming) return;
              setConfirming(true);
              void Promise.resolve(onConfirm(selectedUrl)).finally(() => setConfirming(false));
            }}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3.5 text-lg font-bold text-white shadow-lg hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-45 disabled:pointer-events-none touch-manipulation"
          >
            {confirming ? "שומרים…" : continueLabel}
          </button>
        </>
      )}
    </div>
  );
}
