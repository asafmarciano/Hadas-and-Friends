"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getCurrentGirl } from "../../lib/auth";
import { getDrawingById } from "../../lib/drawings";
import { supabase } from "../../lib/supabase";

const BUCKET = "drawings";
const SIGNED_URL_EXPIRY_SEC = 60 * 60;

async function getSignedUrl(storagePath: string): Promise<string | null> {
  if (!storagePath?.trim()) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SEC);
  if (error) return null;
  return data?.signedUrl ?? null;
}

/** Deterministic loading shell so server and client first render match. */
function PrintLoadingShell() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4" dir="rtl">
      <p className="text-gray-600">טוען...</p>
    </div>
  );
}

export default function GalleryPrintPage() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const girl = getCurrentGirl();
    if (!girl) {
      window.location.href = "/";
      return;
    }
    const id = searchParams.get("drawingId");
    if (!id) {
      setStatus("error");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const drawing = await getDrawingById(id, girl.id);
        if (cancelled || !drawing?.storage_path) {
          if (!cancelled) setStatus("error");
          return;
        }
        const url = await getSignedUrl(drawing.storage_path);
        if (!cancelled && url) setImageUrl(url);
        else if (!cancelled) setStatus("error");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, searchParams]);

  useEffect(() => {
    if (!mounted || status !== "ready" || !imgRef.current) return;
    window.print();
  }, [mounted, status]);

  const handleLoad = () => setStatus("ready");

  if (!mounted) {
    return <PrintLoadingShell />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4" dir="rtl">
      {status === "loading" && <p className="text-gray-600">טוען...</p>}
      {status === "error" && <p className="text-gray-600">לא ניתן לטעון את הציור.</p>}
      {imageUrl && (
        <img
          ref={imgRef}
          src={imageUrl}
          alt=""
          onLoad={handleLoad}
          className="max-w-full max-h-[90vh] object-contain print:max-h-none"
        />
      )}
    </div>
  );
}
