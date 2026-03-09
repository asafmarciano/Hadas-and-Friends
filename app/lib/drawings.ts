"use client";

import { supabase } from "./supabase";

export interface DrawingRecord {
  id: string;
  girl_id: string;
  image_url: string;
  storage_path: string;
  created_at: string;
}

function buildPath(girlId: string) {
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, "-");
  return `${girlId}/${ts}.png`;
}

export async function saveDrawingToGallery(girlId: string, dataUrl: string): Promise<DrawingRecord> {
  const path = buildPath(girlId);

  const res = await fetch(dataUrl);
  const blob = await res.blob();
  console.log("[saveDrawingToGallery] blob", { size: blob.size, type: blob.type });
  console.log("[saveDrawingToGallery] storage path", path);

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("drawings")
    .upload(path, blob, {
      contentType: "image/png",
      upsert: false,
    });

  console.log("[saveDrawingToGallery] upload result", { uploadData, uploadError: uploadError ?? null });

  if (uploadError) {
    console.error("[saveDrawingToGallery] upload failed, skipping DB insert", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from("drawings").getPublicUrl(path);
  const imageUrl = data.publicUrl;

  console.log("[saveDrawingToGallery] upload succeeded, inserting row into drawings table");
  const { data: row, error: insertError } = await supabase
    .from("drawings")
    .insert({
      girl_id: girlId,
      image_url: imageUrl,
      storage_path: path,
    })
    .select("*")
    .single();

  if (insertError) {
    console.error("[saveDrawingToGallery] insert error", insertError);
    throw insertError;
  }

  return row as DrawingRecord;
}

export async function listGirlDrawings(girlId: string): Promise<DrawingRecord[]> {
  const { data, error } = await supabase
    .from("drawings")
    .select("id, girl_id, image_url, storage_path, created_at")
    .eq("girl_id", girlId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listGirlDrawings error", error);
    throw error;
  }
  return (data ?? []) as DrawingRecord[];
}

export async function getLatestDrawingForGirl(girlId: string): Promise<DrawingRecord | null> {
  const { data, error } = await supabase
    .from("drawings")
    .select("id, girl_id, image_url, storage_path, created_at")
    .eq("girl_id", girlId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("getLatestDrawingForGirl error", error);
    throw error;
  }
  return (data as DrawingRecord) ?? null;
}

/** Returns image_url if valid, otherwise builds public URL from storage_path for older/broken rows. */
export function getDisplayImageUrl(record: DrawingRecord): string {
  const url = record.image_url?.trim();
  if (url && url.startsWith("http") && url.includes("/drawings/")) {
    return url;
  }
  if (record.storage_path) {
    const base = typeof process !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (base) {
      return `${base}/storage/v1/object/public/drawings/${record.storage_path}`;
    }
  }
  return url || "";
}

export async function deleteDrawingById(id: string, storagePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage.from("drawings").remove([storagePath]);
  if (storageError) {
    console.error("deleteDrawing storage error", storageError);
  }

  const { error } = await supabase.from("drawings").delete().eq("id", id);
  if (error) {
    console.error("deleteDrawing row error", error);
    throw error;
  }
}
