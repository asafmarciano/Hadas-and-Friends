"use client";

import { GAME_DRAW_PALETTE } from "@/app/lib/gameDrawPalette";

export type GamePaintPaletteStripProps = {
  selectedColor: string;
  onSelectColor: (hex: string) => void;
  isEraser: boolean;
};

/**
 * Exact paint-phase color strip from /game — single DOM for /game and /draw so visuals cannot drift.
 */
export function GamePaintPaletteStrip({ selectedColor, onSelectColor, isEraser }: GamePaintPaletteStripProps) {
  return (
    <div className="rounded-lg border border-violet-100/70 bg-white/60 px-1 py-0.5 shadow-sm shrink-0 sm:rounded-xl sm:px-1.5 sm:py-1">
      <div className="mx-auto grid w-full max-w-md grid-cols-5 justify-items-center gap-0.5 sm:gap-1">
        {GAME_DRAW_PALETTE.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => {
              onSelectColor(hex);
            }}
            className="h-7 w-7 rounded-full border-2 shadow-sm transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-violet-300/70 active:scale-95 touch-manipulation sm:h-9 sm:w-9"
            style={{
              backgroundColor: hex,
              borderColor: !isEraser && selectedColor === hex ? "#5b21b6" : "rgba(255,255,255,0.95)",
              boxShadow: !isEraser && selectedColor === hex ? "0 0 0 1px #ddd6fe" : undefined,
            }}
            aria-label="בחירת צבע"
            aria-pressed={!isEraser && selectedColor === hex}
          />
        ))}
      </div>
    </div>
  );
}
