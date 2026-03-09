"use client";

import { supabase } from "./supabase";
import type { GirlSession } from "./auth";

const THIRTY_SECONDS_AGO = () => new Date(Date.now() - 30 * 1000).toISOString();

export interface OnlineUser {
  user_id: string;
  last_seen: string;
  display_name: string | null;
  avatar: string | null;
}

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

export function startPresence(session: GirlSession) {
  upsertPresence(session);
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => upsertPresence(session), 10_000);
}

export function stopPresence() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

/** Call on logout or page unload so the user drops off the online list quickly. Returns a promise so callers can await. */
export function markOffline(session: GirlSession): Promise<void> {
  const oldSeen = new Date(Date.now() - 40 * 1000).toISOString();
  return Promise.resolve(
    supabase
      .from("online_users")
      .upsert(
        {
          user_id: session.id,
          last_seen: oldSeen,
          display_name: session.name,
          avatar: session.avatar,
        },
        { onConflict: "user_id", ignoreDuplicates: false }
      )
  ).then(() => {}, () => {});
}

export async function upsertPresence(session: GirlSession): Promise<void> {
  await supabase.from("online_users").upsert(
    {
      user_id: session.id,
      last_seen: new Date().toISOString(),
      display_name: session.name,
      avatar: session.avatar,
    },
    { onConflict: "user_id", ignoreDuplicates: false }
  );
}

export async function getOnlineUsers(excludeUserId: string): Promise<OnlineUser[]> {
  const since = THIRTY_SECONDS_AGO();
  const { data, error } = await supabase
    .from("online_users")
    .select("user_id, last_seen, display_name, avatar")
    .gte("last_seen", since)
    .order("display_name", { ascending: true });

  if (error) {
    console.error("getOnlineUsers error", error);
    return [];
  }
  const list = (data ?? []) as OnlineUser[];
  return list.filter((u) => u.user_id !== excludeUserId);
}
