"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ApprovedUser } from "../lib/supabase";
import { fetchApprovedGirls, validatePin, loginGirl, getCurrentGirl } from "../lib/auth";
import { getOnlineUsers } from "../lib/online";
import { GirlCard } from "./GirlCard";
import { PinEntry } from "./PinEntry";

const ONLINE_POLL_MS = 3000;

const CARD_COLORS = [
  "from-pink-300 to-rose-400",
  "from-violet-300 to-indigo-400",
  "from-sky-300 to-emerald-400",
  "from-amber-300 to-orange-400",
];

const EMOJI_POOL_SIZE = 15;

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
  const [selectedGirl, setSelectedGirl] = useState<ApprovedUser | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [emojiIndices, setEmojiIndices] = useState<number[]>([]);
  const shuffledOnce = useRef(false);

  useEffect(() => {
    getCurrentGirl() && router.replace("/draw");
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
  };

  const handlePinSubmit = (pin: string) => {
    if (!selectedGirl) return;
    if (!validatePin(selectedGirl, pin)) {
      setPinError("קוד שגוי, נסי שוב");
      return;
    }
    loginGirl({
      id: selectedGirl.id,
      name: selectedGirl.display_name,
      avatar: selectedGirl.avatar,
    });
    router.replace("/draw");
  };

  const handleBack = () => {
    setSelectedGirl(null);
    setPinError(null);
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

  if (selectedGirl) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-violet-50 to-sky-50 px-4 py-10" dir="rtl">
        <PinEntry
          girlName={selectedGirl.display_name}
          onSubmit={handlePinSubmit}
          onBack={handleBack}
          error={pinError}
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
