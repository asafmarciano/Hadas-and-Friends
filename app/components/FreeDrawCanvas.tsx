"use client";

import {
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useLayoutEffect,
} from "react";

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
  /** Softer frame on mobile when nested in /game-style card (/draw) */
  gameCardMobile?: boolean;
};

function getPoint(canvas: HTMLCanvasElement, x: number, y: number) {
  const r = canvas.getBoundingClientRect();
  if (r.width < 0.5 || r.height < 0.5) return { x: 0, y: 0 };
  return {
    x: (x - r.left) * (canvas.width / r.width),
    y: (y - r.top) * (canvas.height / r.height),
  };
}

/** Maps CSS-pixel brush size to backing-store pixels (handles devicePixelRatio scaling). */
function getBufferScale(canvas: HTMLCanvasElement): number {
  const r = canvas.getBoundingClientRect();
  if (r.width < 0.5) return 1;
  return canvas.width / r.width;
}

export const FreeDrawCanvas = forwardRef<FreeDrawCanvasHandle, Props>(function FreeDrawCanvas(
  { brushColor, brushSize, isEraser, initialDataUrl, onStrokeEnd, gameCardMobile = false },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const hasSizedRef = useRef(false);
  const initialDataUrlRef = useRef(initialDataUrl);
  const lastLoadedInitialUrlRef = useRef<string | null>(null);
  const prevInitialUrlForEffectRef = useRef<string | null | undefined>(undefined);

  initialDataUrlRef.current = initialDataUrl;

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    if (w < 1 || h < 1) return;

    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
    const bw = Math.max(1, Math.floor(w * dpr));
    const bh = Math.max(1, Math.floor(h * dpr));

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prevW = canvas.width;
    const prevH = canvas.height;

    const loadUrlIntoCurrentBuffer = (url: string, targetW: number, targetH: number) => {
      const img = new Image();
      img.onload = () => {
        const c = canvasRef.current;
        const cctx = c?.getContext("2d");
        if (!c || !cctx || c.width !== targetW || c.height !== targetH) return;
        cctx.fillStyle = "#fff";
        cctx.fillRect(0, 0, targetW, targetH);
        cctx.drawImage(img, 0, 0, targetW, targetH);
      };
      img.src = url;
    };

    if (hasSizedRef.current && prevW === bw && prevH === bh) {
      const url = initialDataUrlRef.current;
      if (!url) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, bw, bh);
        lastLoadedInitialUrlRef.current = null;
        return;
      }
      if (lastLoadedInitialUrlRef.current !== url) {
        lastLoadedInitialUrlRef.current = url;
        loadUrlIntoCurrentBuffer(url, bw, bh);
      }
      return;
    }

    let snapshot: HTMLCanvasElement | null = null;
    if (hasSizedRef.current && prevW > 0 && prevH > 0 && (prevW !== bw || prevH !== bh)) {
      snapshot = document.createElement("canvas");
      snapshot.width = prevW;
      snapshot.height = prevH;
      const sctx = snapshot.getContext("2d");
      if (sctx) sctx.drawImage(canvas, 0, 0);
    }

    canvas.width = bw;
    canvas.height = bh;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    hasSizedRef.current = true;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, bw, bh);

    if (snapshot) {
      ctx.drawImage(snapshot, 0, 0, bw, bh);
    } else {
      const url = initialDataUrlRef.current;
      if (url && lastLoadedInitialUrlRef.current !== url) {
        lastLoadedInitialUrlRef.current = url;
        loadUrlIntoCurrentBuffer(url, bw, bh);
      } else if (!url) {
        lastLoadedInitialUrlRef.current = null;
      }
    }
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    resizeCanvas();
    const ro = new ResizeObserver(() => {
      resizeCanvas();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [resizeCanvas]);

  useEffect(() => {
    const next = initialDataUrl ?? null;
    const prev = prevInitialUrlForEffectRef.current;
    prevInitialUrlForEffectRef.current = next;
    if (prev !== undefined && prev !== next) {
      lastLoadedInitialUrlRef.current = null;
      resizeCanvas();
    }
  }, [initialDataUrl, resizeCanvas]);

  useImperativeHandle(ref, () => ({
    clear() {
      const el = canvasRef.current;
      if (!el) return;
      const ctx = el.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, el.width, el.height);
    },
    getImageDataUrl() {
      return canvasRef.current?.toDataURL("image/png") ?? null;
    },
  }), []);

  const stroke = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, a: { x: number; y: number }, b: { x: number; y: number }) => {
      const scale = getBufferScale(canvas);
      ctx.strokeStyle = isEraser ? "#fff" : brushColor;
      ctx.lineWidth = brushSize * scale;
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
      if (!el || el.width < 2) return;
      const ctx = el.getContext("2d");
      if (!ctx) return;
      const p = getPoint(el, x, y);
      const scale = getBufferScale(el);
      isDrawing.current = true;
      last.current = p;
      ctx.fillStyle = isEraser ? "#fff" : brushColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (brushSize / 2) * scale, 0, Math.PI * 2);
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
      stroke(ctx, el, last.current, p);
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
    <div
      ref={containerRef}
      dir="ltr"
      className={
        "relative box-border h-full min-h-0 w-full min-w-0 max-w-full flex-1 touch-none self-stretch overflow-hidden bg-white max-sm:min-h-[55vh] max-sm:aspect-auto sm:aspect-[4/3] sm:min-h-0 " +
        (gameCardMobile
          ? "max-sm:rounded-lg max-sm:border max-sm:border-white/90 max-sm:shadow-inner sm:max-h-[62vh] sm:rounded-3xl sm:border-4 sm:border-white sm:shadow-xl"
          : "max-sm:rounded-2xl max-sm:border-2 max-sm:border-white sm:max-h-[62vh] sm:rounded-3xl sm:border-4 sm:border-white sm:shadow-xl")
      }
      style={{ touchAction: "none" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full max-w-full"
        onMouseDown={(e) => {
          e.preventDefault();
          onStart(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => onMove(e.clientX, e.clientY)}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
        onTouchStart={(e) => {
          if (e.touches.length) e.preventDefault();
          onStart(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          if (e.touches.length) e.preventDefault();
          onMove(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={(e) => {
          if (!e.touches.length) onEnd();
        }}
        onTouchCancel={(e) => {
          if (!e.touches.length) onEnd();
        }}
      />
    </div>
  );
});
