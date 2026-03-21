"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentGirl, logoutGirl } from "../lib/auth";
import { markOffline, stopPresence } from "../lib/online";

export default function ChooseModePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!getCurrentGirl()) router.replace("/");
  }, [mounted, router]);

  const girl = mounted ? getCurrentGirl() : null;

  const handleLogout = async () => {
    if (!girl) return;
    await markOffline(girl);
    stopPresence();
    logoutGirl();
    router.replace("/");
  };

  if (!mounted || !girl) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-violet-50 to-sky-50" dir="rtl">
        <p className="text-xl text-gray-700">טוען...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-violet-50 to-sky-50" dir="rtl">
      <div className="w-full max-w-lg mx-auto flex justify-end px-4 pt-4 shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-2xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shrink-0"
        >
          יציאה
        </button>
      </div>
      <section className="flex-1 flex flex-col items-center justify-center px-4 pb-10 w-full max-w-lg mx-auto gap-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">בחרי מצב</h1>
          <p className="text-lg text-gray-700">מה נעשה היום?</p>
        </header>
        <div className="flex flex-col gap-5 w-full">
          <button
            type="button"
            onClick={() => router.push("/draw")}
            className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-white bg-white/80 shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-violet-300/60 min-h-[140px] w-full px-6 py-8"
          >
            <span
              className="absolute inset-0 rounded-3xl opacity-60 bg-gradient-to-br from-pink-300 to-rose-400 pointer-events-none"
              aria-hidden
            />
            <span className="relative z-10 text-3xl sm:text-4xl font-bold text-gray-900">
              צביעה חופשית 🎨
            </span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/game")}
            className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-white bg-white/80 shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-violet-300/60 min-h-[140px] w-full px-6 py-8"
          >
            <span
              className="absolute inset-0 rounded-3xl opacity-60 bg-gradient-to-br from-sky-300 to-emerald-400 pointer-events-none"
              aria-hidden
            />
            <span className="relative z-10 text-3xl sm:text-4xl font-bold text-gray-900">
              משחק צביעה 🎮
            </span>
          </button>
        </div>
      </section>
    </main>
  );
}
