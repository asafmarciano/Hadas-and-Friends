"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ApprovedUser } from "../lib/supabase";
import {
  fetchApprovedGirls,
  validatePin,
  loginGirl,
  getCurrentGirl,
  setPendingAvatarSelection,
  hasPendingAvatarSelection,
  updateSessionAvatarUrl,
  logoutGirl,
  fetchApprovedUserAvatar,
} from "../lib/auth";
import { getOnlineUsers } from "../lib/online";
import { GirlCard } from "./GirlCard";
import { PinEntry } from "./PinEntry";
import { AvatarPicker } from "./AvatarPicker";

const ONLINE_POLL_MS = 3000;

const CARD_COLORS = [
  "from-pink-300 to-rose-400",
  "from-violet-300 to-indigo-400",
  "from-sky-300 to-emerald-400",
  "from-amber-300 to-orange-400",
];

const EMOJI_POOL_SIZE = 15;

type FlowStep = "girls" | "pin" | "avatars";

function initialLoginStep(): FlowStep {
  if (typeof window === "undefined") return "girls";
  const g = getCurrentGirl();
  if (g && hasPendingAvatarSelection() && g.avatar_url === null) return "avatars";
  return "girls";
}

function shuffleEmojiIndices(count: number): number[] {
  const indices = Array.from({ length: EMOJI_POOL_SIZE }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, count);
}

export function LoginScreen() {
  const router = useRouter();
  const [girls, setGirls] = useState<ApprovedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<FlowStep>("girls");

  useLayoutEffect(() => {
    if (initialLoginStep() === "avatars") setStep("avatars");
  }, []);
  const [selectedGirl, setSelectedGirl] = useState<ApprovedUser | null>(null);
  /** When set after PIN, avoids a second /api/avatars fetch in AvatarPicker */
  const [avatarUrlsOverride, setAvatarUrlsOverride] = useState<string[] | undefined>(undefined);
  const [pinBusy, setPinBusy] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [emojiIndices, setEmojiIndices] = useState<number[]>([]);
  const shuffledOnce = useRef(false);

  useEffect(() => {
    const girl = getCurrentGirl();
    if (!girl) return;
    if (hasPendingAvatarSelection()) return;
    router.replace("/choose");
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchApprovedGirls();
        if (!cancelled) setGirls(data);
      } catch (e) {
        if (!cancelled) setError("משהו השתבש, נסי שוב");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (girls.length > 0 && !shuffledOnce.current) {
      shuffledOnce.current = true;
      setEmojiIndices(shuffleEmojiIndices(girls.length));
    }
  }, [girls.length]);

  useEffect(() => {
    let cancelled = false;
    const fetchOnline = async () => {
      const list = await getOnlineUsers("");
      if (!cancelled) setOnlineUserIds(new Set(list.map((u) => u.user_id)));
    };
    fetchOnline();
    const id = setInterval(fetchOnline, ONLINE_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const handleSelectGirl = (girl: ApprovedUser) => {
    setSelectedGirl(girl);
    setPinError(null);
    setStep("pin");
  };

  const handlePinSubmit = async (pin: string) => {
    if (!selectedGirl) return;
    if (!validatePin(selectedGirl, pin)) {
      setPinError("קוד שגוי, נסי שוב");
      return;
    }
    setPinBusy(true);
    setPinError(null);
    try {
      const dbAvatar = await fetchApprovedUserAvatar(selectedGirl.id);
      const listAvatar = selectedGirl.avatar?.trim() || null;
      const resolvedAvatar = dbAvatar ?? listAvatar;

      loginGirl({
        id: selectedGirl.id,
        name: selectedGirl.display_name,
        avatar_url: resolvedAvatar,
      });

      const hasAvatar = !!(resolvedAvatar && resolvedAvatar.trim());
      if (hasAvatar) {
        setPendingAvatarSelection(false);
        router.replace("/choose");
        return;
      }

      const res = await fetch("/api/avatars");
      const data = await res.json();
      const list = Array.isArray(data)
        ? (data as { url?: unknown }[])
            .filter((x): x is { url: string } => typeof x?.url === "string")
            .map((x) => x.url)
        : [];

      if (list.length === 0) {
        setPendingAvatarSelection(false);
        router.replace("/choose");
        return;
      }

      setPendingAvatarSelection(true);
      setAvatarUrlsOverride(list);
      setStep("avatars");
    } catch {
      setPendingAvatarSelection(false);
      router.replace("/choose");
    } finally {
      setPinBusy(false);
    }
  };

  const handleBackFromPin = () => {
    setPinError(null);
    logoutGirl();
    setSelectedGirl(null);
    setStep("girls");
  };

  const handleBackFromAvatars = () => {
    logoutGirl();
    setPendingAvatarSelection(false);
    setAvatarUrlsOverride(undefined);
    setPinError(null);
    setStep(selectedGirl ? "pin" : "girls");
  };

  const handleAvatarConfirmed = async (url: string) => {
    if (!getCurrentGirl()) return;
    await updateSessionAvatarUrl(url);
    setPendingAvatarSelection(false);
    setAvatarUrlsOverride(undefined);
    router.replace("/choose");
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-violet-50 to-sky-50" dir="rtl">
        <p className="text-xl text-gray-700">טוען...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-pink-50 via-violet-50 to-sky-50 px-4" dir="rtl">
        <p className="text-xl text-red-600">{error}</p>
      </main>
    );
  }

  if (selectedGirl && step === "pin") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-violet-50 to-sky-50 px-4 py-10" dir="rtl">
        <PinEntry
          girlName={selectedGirl.display_name}
          onSubmit={handlePinSubmit}
          onBack={handleBackFromPin}
          error={pinError}
          busy={pinBusy}
        />
      </main>
    );
  }

  if (step === "avatars" && (selectedGirl || getCurrentGirl())) {
    const avatarStepName = selectedGirl?.display_name ?? getCurrentGirl()?.name ?? "";
    return (
      <main className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-violet-50 to-sky-50" dir="rtl">
        <AvatarPicker
          displayName={avatarStepName}
          subtitle="אחרי הקוד — עכשיו בוחרים איך נראה הפרופיל"
          continueLabel="המשך לבחירת מצב"
          urlsOverride={avatarUrlsOverride}
          initialSelectedUrl={null}
          onBack={handleBackFromAvatars}
          backLabel="🔙 חזרה לקוד"
          onConfirm={handleAvatarConfirmed}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-violet-50 to-sky-50 px-4 py-10" dir="rtl">
      <section className="w-full max-w-4xl flex flex-col items-center gap-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            הדס והחברות
          </h1>
          <p className="text-lg sm:text-xl text-gray-700">בחרי את השם שלך</p>
          <p className="text-sm text-gray-500">אחר כך יבקשו את הקוד, ואז תמונת פרופיל</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
          {girls.map((girl, i) => (
            <GirlCard
              key={girl.id}
              displayName={girl.display_name}
              avatar={girl.avatar}
              colorClass={CARD_COLORS[i % CARD_COLORS.length]}
              onSelect={() => handleSelectGirl(girl)}
              isOnline={onlineUserIds.has(girl.id)}
              emojiIndex={emojiIndices[i] ?? i}
            />
          ))}
        </div>
        {girls.length === 0 && (
          <p className="text-gray-600">אין משתמשות מאושרות כרגע.</p>
        )}
      </section>
    </main>
  );
}
