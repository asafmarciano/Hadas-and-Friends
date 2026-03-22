"use client";

import { useState } from "react";

interface PinEntryProps {
  girlName: string;
  onSubmit: (pin: string) => void | Promise<void>;
  onBack: () => void;
  error: string | null;
  /** True while verifying PIN / loading next step */
  busy?: boolean;
}

export function PinEntry({ girlName, onSubmit, onBack, error, busy = false }: PinEntryProps) {
  const [pin, setPin] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await Promise.resolve(onSubmit(pin));
  };

  return (
    <div className="w-full max-w-md px-3 sm:px-4" dir="rtl">
      <div className="rounded-2xl sm:rounded-3xl border-2 border-violet-200 bg-white/90 shadow-lg sm:shadow-xl p-5 sm:p-8">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">הזינו קוד</h2>
          <button
            type="button"
            onClick={onBack}
            className="rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
          >
            חזרה
          </button>
        </div>
        <p className="mb-4 sm:mb-6 flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-violet-50/80 py-2.5 sm:py-3 px-3 sm:px-4 text-center">
          <span className="text-gray-600 text-xs sm:text-sm font-medium">בחרתם את </span>
          <span className="text-violet-700 font-bold text-base sm:text-lg">{girlName}</span>
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
          <div>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="קוד"
              disabled={busy}
              className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-violet-200 text-center text-lg sm:text-xl tracking-[0.35em] sm:tracking-[0.4em] focus:border-violet-400 focus:ring-2 focus:ring-violet-200 focus:outline-none transition-shadow disabled:opacity-60"
              dir="ltr"
            />
            {error && (
              <p className="mt-3 text-red-600 text-sm text-center font-medium">{error}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-violet-500 text-white text-base sm:text-lg font-semibold hover:bg-violet-600 transition-colors shadow-md disabled:opacity-60 disabled:pointer-events-none"
          >
            {busy ? "טוען…" : "כניסה"}
          </button>
        </form>
      </div>
    </div>
  );
}
