"use client";

import { supabase } from "./supabase";

export const REACTION_TYPES = ["heart", "star", "rainbow", "unicorn"] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

const EMOJI: Record<ReactionType, string> = {
  heart: "\u2764\uFE0F",
  star: "\u2B50",
  rainbow: "\uD83C\uDF08",
  unicorn: "\uD83E\uDD84",
};

export function getReactionEmoji(type: ReactionType): string {
  return EMOJI[type];
}

export function getReactionMessage(senderName: string, type: ReactionType): string {
  const e = EMOJI[type];
  const label = type === "heart" ? "לב" : type === "star" ? "כוכב" : type === "rainbow" ? "קשת" : "חד־קרן";
  return `${senderName} שלחה לך ${label} ${e}`;
}

export interface ReactionPayload {
  id: string;
  from_user_id: string;
  to_user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export async function sendReaction(fromUserId: string, toUserId: string, type: ReactionType): Promise<void> {
  await supabase.from("reactions").insert({
    from_user_id: fromUserId,
    to_user_id: toUserId,
    reaction_type: type,
  });
}

export async function getSenderName(userId: string): Promise<string> {
  const { data } = await supabase.from("approved_users").select("display_name").eq("id", userId).single();
  return (data as { display_name?: string } | null)?.display_name ?? "מישהי";
}

export function subscribeReactions(toUserId: string, onReaction: (p: ReactionPayload) => void) {
  const ch = supabase
    .channel("reactions")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "reactions", filter: `to_user_id=eq.${toUserId}` },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        if (row?.from_user_id && row?.to_user_id && row?.reaction_type) {
          onReaction({
            id: (row.id as string) ?? crypto.randomUUID(),
            from_user_id: row.from_user_id as string,
            to_user_id: row.to_user_id as string,
            reaction_type: row.reaction_type as ReactionType,
            created_at: (row.created_at as string) ?? new Date().toISOString(),
          });
        }
      }
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(ch);
  };
}
