"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentGirl, logoutGirl, updateSessionAvatarUrl, useSessionAvatarHydration } from "../lib/auth";
import { markOffline, stopPresence } from "../lib/online";
import { AvatarPicker } from "../components/AvatarPicker";

export default function ChooseModePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useSessionAvatarHydration(mounted);

  useEffect(() => {
    if (!mounted) return;
    if (!getCurrentGirl()) router.replace("/");
  }, [mounted, router]);

  const girl = mounted ? getCurrentGirl() : null;
  const avatarInitial = girl?.name?.trim()?.charAt(0) || "👧";

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
      <div className="w-full max-w-md sm:max-w-lg mx-auto px-3 sm:px-4 pt-2 sm:pt-4 flex flex-col gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {girl.avatar_url ? (
              <img
                src={girl.avatar_url}
                alt=""
                className="w-14 h-14 sm:w-16 sm:h-16 md:w-[4.5rem] md:h-[4.5rem] rounded-full object-cover border-[3px] sm:border-4 border-white shadow-md shrink-0"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-[4.5rem] md:h-[4.5rem] rounded-full bg-violet-200 border-[3px] sm:border-4 border-white shadow-md flex items-center justify-center text-2xl sm:text-3xl shrink-0">
                👤
              </div>
            )}
            <div className="min-w-0 text-right">
              <p className="font-bold text-gray-900 text-base sm:text-lg md:text-xl leading-tight truncate">{girl.name}</p>
              {!girl.avatar_url ? (
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 leading-snug">אפשר לבחור תמונת פרופיל למטה</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl sm:rounded-2xl border-2 border-gray-200 bg-white px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 shrink-0"
          >
            יציאה
          </button>
        </div>
        <button
          type="button"
          onClick={() => setAvatarPickerOpen(true)}
          className="w-full rounded-xl sm:rounded-2xl border-2 border-violet-200 bg-violet-50 py-2.5 text-sm sm:py-3 sm:text-base font-bold text-violet-800 hover:bg-violet-100 shadow-sm transition-colors"
        >
          החלפת אווטאר
        </button>
      </div>

      <section className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 pb-6 sm:pb-10 w-full max-w-md sm:max-w-lg mx-auto gap-4 sm:gap-8">
        <header className="w-full text-center space-y-2 sm:space-y-3">
          <div className="mx-auto relative w-fit">
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-300/45 via-violet-300/40 to-sky-300/45 blur-md scale-110"
              aria-hidden
            />
            <div className="relative rounded-full p-[5px] bg-gradient-to-br from-pink-300 via-violet-300 to-sky-300 shadow-[0_10px_35px_rgba(139,92,246,0.28)]">
              {girl.avatar_url ? (
                <img
                  src={girl.avatar_url}
                  alt={`האוואטר של ${girl.name}`}
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover border-4 border-white motion-safe:animate-pulse"
                />
              ) : (
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-white bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center text-4xl sm:text-5xl font-black text-violet-700 motion-safe:animate-pulse">
                  {avatarInitial}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-lg sm:text-xl font-bold text-violet-900">{girl.name}</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              מה תרצי לעשות עכשיו?
            </h1>
            <p className="text-sm sm:text-base text-gray-600">בחרי משחק ותתחילי ליצור קסם בצבעים ✨</p>
          </div>
        </header>
        <div className="flex flex-col gap-3 sm:gap-5 w-full">
          <button
            type="button"
            onClick={() => router.push("/draw")}
            className="relative flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-white/90 bg-white/75 sm:bg-white/80 shadow-md sm:shadow-lg transition-all duration-200 hover:shadow-lg sm:hover:shadow-xl hover:-translate-y-0.5 sm:hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-violet-300/60 min-h-[104px] sm:min-h-[128px] lg:min-h-[140px] w-full px-5 py-5 sm:px-6 sm:py-8"
          >
            <span
              className="absolute inset-0 rounded-2xl sm:rounded-3xl opacity-55 sm:opacity-60 bg-gradient-to-br from-pink-300 to-rose-400 pointer-events-none"
              aria-hidden
            />
            <span className="relative z-10 text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              צביעה חופשית 🎨
            </span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/game")}
            className="relative flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-white/90 bg-white/75 sm:bg-white/80 shadow-md sm:shadow-lg transition-all duration-200 hover:shadow-lg sm:hover:shadow-xl hover:-translate-y-0.5 sm:hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-violet-300/60 min-h-[104px] sm:min-h-[128px] lg:min-h-[140px] w-full px-5 py-5 sm:px-6 sm:py-8"
          >
            <span
              className="absolute inset-0 rounded-2xl sm:rounded-3xl opacity-55 sm:opacity-60 bg-gradient-to-br from-sky-300 to-emerald-400 pointer-events-none"
              aria-hidden
            />
            <span className="relative z-10 text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              משחק צבעים 🎮
            </span>
          </button>
        </div>
      </section>

      {avatarPickerOpen ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-pink-50 via-violet-50 to-sky-50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="choose-avatar-title"
        >
          <AvatarPicker
            headingId="choose-avatar-title"
            displayName={girl.name}
            title="בחרו תמונה לפרופיל"
            subtitle="בחרו תמונה חדשה או השאירו את הקודמת"
            continueLabel="שמירה וחזרה"
            initialSelectedUrl={girl.avatar_url}
            onBack={() => setAvatarPickerOpen(false)}
            backLabel="ביטול"
            onConfirm={async (url) => {
              await updateSessionAvatarUrl(url);
              setAvatarPickerOpen(false);
            }}
          />
        </div>
      ) : null}
    </main>
  );
}
