"use client";

const PREFIX = "drawing_";

function key(girlId: string) {
  return `${PREFIX}${girlId}`;
}

export function getDrawing(girlId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key(girlId));
}

export function saveDrawing(girlId: string, dataUrl: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key(girlId), dataUrl);
}

export function clearDrawing(girlId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key(girlId));
}
