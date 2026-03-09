"use client";

import { supabase, type ApprovedUser } from "./supabase";

const SESSION_KEY = "hadas_girl_session";

export interface GirlSession {
  id: string;
  name: string;
  avatar: string | null;
}

export function getCurrentGirl(): GirlSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as GirlSession;
    return data?.id && data?.name ? data : null;
  } catch {
    return null;
  }
}

export function loginGirl(girl: GirlSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(girl));
}

export function logoutGirl(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
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
