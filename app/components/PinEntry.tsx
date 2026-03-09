"use client";

import { useState } from "react";

interface PinEntryProps {
  girlName: string;
  onSubmit: (pin: string) => void;
  onBack: () => void;
  error: string | null;
}

export function PinEntry({ girlName, onSubmit, onBack, error }: PinEntryProps) {
  const [pin, setPin] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(pin);
  };

  return (
    <div className="w-full max-w-md px-4" dir="rtl">
      <div className="rounded-3xl border-2 border-violet-200 bg-white/90 shadow-xl p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">הכניסי קוד</h2>
          <button
            type="button"
            onClick={onBack}
            className="rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
          >
            חזרה
          </button>
        </div>
        <p className="text-gray-600 mb-6">בחרת ב־{girlName}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="קוד"
              className="w-full px-5 py-4 rounded-2xl border-2 border-violet-200 text-center text-xl tracking-[0.4em] focus:border-violet-400 focus:ring-2 focus:ring-violet-200 focus:outline-none transition-shadow"
              dir="ltr"
            />
            {error && (
              <p className="mt-3 text-red-600 text-sm text-center font-medium">{error}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-violet-500 text-white text-lg font-semibold hover:bg-violet-600 transition-colors shadow-md"
          >
            כניסה
          </button>
        </form>
      </div>
    </div>
  );
}
