"use client";

import { useState } from "react";

const FALLBACK_EMOJIS = [
  "🦋",
  "⭐",
  "🌸",
  "🌈",
  "🧜‍♀️",
  "🍦",
  "🧚‍♀️",
  "☀️",
  "💖",
  "🌺",
  "🎀",
  "🦢",
  "🌙",
  "💫",
  "🍀",
] as const;

const SIZE_CLASS = "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24";

function getFallbackEmoji(displayName: string, emojiIndex?: number): string {
  if (typeof emojiIndex === "number") {
    return FALLBACK_EMOJIS[emojiIndex % FALLBACK_EMOJIS.length];
  }
  const code = Array.from(displayName).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return FALLBACK_EMOJIS[code % FALLBACK_EMOJIS.length];
}

/** True when `approved_users.avatar` stores a URL or app static path to an image */
export function isImageAvatar(value: string | null | undefined): boolean {
  const v = value?.trim();
  if (!v) return false;
  if (v.startsWith("http://") || v.startsWith("https://")) return true;
  if (v.startsWith("/")) return true;
  return false;
}

/** True for legacy emoji/text avatars (anything non-empty that is not treated as an image path) */
export function isEmojiAvatar(value: string | null | undefined): boolean {
  const v = value?.trim();
  if (!v) return false;
  return !isImageAvatar(v);
}

type ApprovedUserAvatarProps = {
  avatar: string | null;
  displayName: string;
  emojiIndex?: number;
};

/**
 * Renders `approved_users.avatar`: image URL/path, legacy emoji string, or a child-friendly placeholder.
 */
export function ApprovedUserAvatar({ avatar, displayName, emojiIndex }: ApprovedUserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const fallbackEmoji = getFallbackEmoji(displayName, emojiIndex);

  const showImage = isImageAvatar(avatar) && !imageFailed;
  const showLegacyEmoji = !showImage && isEmojiAvatar(avatar);

  if (showImage) {
    return (
      <img
        src={avatar!.trim()}
        alt=""
        onError={() => setImageFailed(true)}
        className={`relative z-10 ${SIZE_CLASS} rounded-full object-cover border-2 border-white shadow-md shrink-0`}
      />
    );
  }

  if (showLegacyEmoji) {
    return (
      <div
        className={`relative z-10 ${SIZE_CLASS} rounded-full border-2 border-white shadow-md bg-white/85 flex items-center justify-center shrink-0`}
        aria-hidden
      >
        <span className="text-4xl sm:text-5xl leading-none select-none">{avatar!.trim()}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative z-10 ${SIZE_CLASS} rounded-full border-2 border-white shadow-md bg-gradient-to-br from-violet-100 via-pink-50 to-sky-100 flex items-center justify-center shrink-0`}
      aria-hidden
    >
      <span className="text-3xl sm:text-4xl md:text-5xl leading-none drop-shadow-sm select-none">{fallbackEmoji}</span>
    </div>
  );
}
