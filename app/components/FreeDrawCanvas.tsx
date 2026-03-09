"use client";

import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";

const W = 800;
const H = 500;

export interface FreeDrawCanvasHandle {
  clear: () => void;
  getImageDataUrl: () => string | null;
}

type Props = {
  brushColor: string;
  brushSize: number;
  isEraser: boolean;
  initialDataUrl?: string | null;
  onStrokeEnd?: () => void;
};

function getPoint(canvas: HTMLCanvasElement, x: number, y: number) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (x - r.left) * (canvas.width / r.width),
    y: (y - r.top) * (canvas.height / r.height),
  };
}

export const FreeDrawCanvas = forwardRef<FreeDrawCanvasHandle, Props>(function FreeDrawCanvas(
  { brushColor, brushSize, isEraser, initialDataUrl, onStrokeEnd },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const didLoad = useRef(false);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    el.width = W;
    el.height = H;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);
    if (initialDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        didLoad.current = true;
      };
      img.src = initialDataUrl;
    } else {
      didLoad.current = true;
    }
  }, [initialDataUrl]);

  useImperativeHandle(ref, () => ({
    clear() {
      const el = canvasRef.current;
      if (!el) return;
      const ctx = el.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, W, H);
    },
    getImageDataUrl() {
      return canvasRef.current?.toDataURL("image/png") ?? null;
    },
  }), []);

  const stroke = useCallback(
    (ctx: CanvasRenderingContext2D, a: { x: number; y: number }, b: { x: number; y: number }) => {
      ctx.strokeStyle = isEraser ? "#fff" : brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    },
    [brushColor, brushSize, isEraser]
  );

  const onStart = useCallback(
    (x: number, y: number) => {
      const el = canvasRef.current;
      if (!el) return;
      const ctx = el.getContext("2d");
      if (!ctx) return;
      const p = getPoint(el, x, y);
      isDrawing.current = true;
      last.current = p;
      ctx.fillStyle = isEraser ? "#fff" : brushColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    },
    [brushColor, brushSize, isEraser]
  );

  const onMove = useCallback(
    (x: number, y: number) => {
      if (!isDrawing.current) return;
      const el = canvasRef.current;
      if (!el) return;
      const ctx = el.getContext("2d");
      if (!ctx || !last.current) return;
      const p = getPoint(el, x, y);
      stroke(ctx, last.current, p);
      last.current = p;
    },
    [stroke]
  );

  const onEnd = useCallback(() => {
    const wasDrawing = isDrawing.current;
    isDrawing.current = false;
    last.current = null;
    if (wasDrawing && onStrokeEnd) {
      onStrokeEnd();
    }
  }, [onStrokeEnd]);

  return (
    <div className="relative w-full max-w-3xl max-h-[62vh] rounded-3xl border-4 border-white shadow-xl bg-white overflow-hidden touch-none" style={{ aspectRatio: "4/3", touchAction: "none" }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="absolute inset-0 w-full h-full"
        onMouseDown={(e) => { e.preventDefault(); onStart(e.clientX, e.clientY); }}
        onMouseMove={(e) => onMove(e.clientX, e.clientY)}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
        onTouchStart={(e) => { if (e.touches.length) e.preventDefault(); onStart(e.touches[0].clientX, e.touches[0].clientY); }}
        onTouchMove={(e) => { if (e.touches.length) e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }}
        onTouchEnd={(e) => { if (!e.touches.length) onEnd(); }}
        onTouchCancel={(e) => { if (!e.touches.length) onEnd(); }}
      />
    </div>
  );
});
