"use client";

import { useEffect, useState } from "react";
import { supabase, type ApprovedUser } from "./supabase";

const SESSION_KEY = "hadas_girl_session";
const PENDING_AVATAR_KEY = "hadas_pending_avatar";

export interface GirlSession {
  id: string;
  name: string;
  /** Public URL for the chosen profile image (e.g. `/avatars/...`). */
  avatar_url: string | null;
}

export function getCurrentGirl(): GirlSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as GirlSession & { avatar?: string | null };
    if (!data?.id || !data?.name) return null;
    const avatar_url =
      data.avatar_url !== undefined ? data.avatar_url : (data.avatar ?? null);
    return { id: data.id, name: data.name, avatar_url };
  } catch {
    return null;
  }
}

export function loginGirl(girl: GirlSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(girl));
}

/** While true, home page stays on login UI for avatar selection after PIN. */
export function setPendingAvatarSelection(pending: boolean): void {
  if (typeof window === "undefined") return;
  if (pending) sessionStorage.setItem(PENDING_AVATAR_KEY, "1");
  else sessionStorage.removeItem(PENDING_AVATAR_KEY);
}

export function hasPendingAvatarSelection(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(PENDING_AVATAR_KEY) === "1";
}

/**
 * Updates local session `avatar_url` and persists the same value to `approved_users.avatar`.
 */
export async function updateSessionAvatarUrl(avatar_url: string | null): Promise<void> {
  const g = getCurrentGirl();
  if (!g) return;
  loginGirl({ ...g, avatar_url });
  const { error } = await supabase.from("approved_users").update({ avatar: avatar_url }).eq("id", g.id);
  if (error) {
    console.error("approved_users.avatar update failed", error);
  }
}

/** Loads `approved_users.avatar` for one user (trimmed string or null). */
export async function fetchApprovedUserAvatar(userId: string): Promise<string | null> {
  const { data, error } = await supabase.from("approved_users").select("avatar").eq("id", userId).maybeSingle();
  if (error) {
    console.error("fetchApprovedUserAvatar failed", error);
    return null;
  }
  const raw = data?.avatar;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed || null;
}

/**
 * If the client session has no avatar image but Supabase `approved_users.avatar` is set, copy it into the session.
 */
export async function hydrateSessionAvatarFromSupabase(): Promise<void> {
  const g = getCurrentGirl();
  if (!g) return;
  if (g.avatar_url != null && g.avatar_url !== "") return;

  const { data, error } = await supabase.from("approved_users").select("avatar").eq("id", g.id).maybeSingle();

  if (error) {
    console.error("hydrateSessionAvatarFromSupabase failed", error);
    return;
  }
  const dbAvatar = data?.avatar;
  if (typeof dbAvatar !== "string" || !dbAvatar.trim()) return;

  loginGirl({ ...g, avatar_url: dbAvatar });
}

/** Run once after mount when a session may exist; triggers a re-render after hydration. */
export function useSessionAvatarHydration(mounted: boolean): void {
  const [, bump] = useState(0);
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    void hydrateSessionAvatarFromSupabase().then(() => {
      if (!cancelled) bump((n) => n + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [mounted]);
}

export function logoutGirl(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(PENDING_AVATAR_KEY);
}

export async function fetchApprovedGirls(): Promise<ApprovedUser[]> {
  const { data, error } = await supabase
    .from("approved_users")
    .select("id, display_name, avatar, pin_code, is_active, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("fetchApprovedGirls error", error);
    throw error;
  }
  return (data ?? []) as ApprovedUser[];
}

export function validatePin(girl: ApprovedUser, enteredPin: string): boolean {
  const code = (girl.pin_code ?? "").toString().trim();
  const pin = enteredPin.trim();
  return code === pin;
}
