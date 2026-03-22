"use client";

import { ColorPalette } from "./ColorPalette";
import { BrushSizePicker } from "./BrushSizePicker";

interface DrawingToolbarProps {
  selectedColor: string;
  onSelectColor: (c: string) => void;
  brushSize: number;
  onBrushSizeChange: (s: number) => void;
  isEraser: boolean;
  onEraserToggle: () => void;
  onClear: () => void;
  onSave: () => void;
  /** /draw mobile: same strip + primary CTA pattern as /game */
  gameMobileLayout?: boolean;
}

const desktopCardOuter =
  "w-full min-w-0 max-w-full max-sm:min-w-0 sm:max-w-3xl flex flex-col gap-2 bg-white/80 rounded-2xl border-2 border-white shadow-lg px-2 py-2 box-border sm:gap-3 sm:rounded-3xl sm:px-3 sm:py-3";

export function DrawingToolbar({
  selectedColor,
  onSelectColor,
  brushSize,
  onBrushSizeChange,
  isEraser,
  onEraserToggle,
  onClear,
  onSave,
  gameMobileLayout = false,
}: DrawingToolbarProps) {
  const desktopRow = (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      <BrushSizePicker selectedSize={brushSize} onSelectSize={onBrushSizeChange} />
      <button
        type="button"
        onClick={onEraserToggle}
        className={`min-w-[40px] h-9 px-3 text-sm sm:min-w-[44px] sm:h-11 sm:px-4 sm:text-base rounded-xl border-2 font-semibold sm:rounded-2xl ${
          isEraser ? "bg-gray-300 border-gray-500 text-gray-800" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
      >
        🧽 מחק
      </button>
      <button
        type="button"
        onClick={onClear}
        className="min-w-[40px] h-9 px-3 text-sm sm:min-w-[44px] sm:h-11 sm:px-4 sm:text-base rounded-xl border-2 border-red-200 bg-red-50 font-semibold text-red-700 hover:bg-red-100 sm:rounded-2xl"
      >
        🗑️ נקה
      </button>
      <button
        type="button"
        onClick={onSave}
        className="min-w-[40px] h-9 px-3 text-sm sm:min-w-[44px] sm:h-11 sm:px-4 sm:text-base rounded-xl border-2 border-emerald-200 bg-emerald-50 font-semibold text-emerald-700 hover:bg-emerald-100 sm:rounded-2xl"
      >
        💾 שמרו לגלריה
      </button>
    </div>
  );

  if (!gameMobileLayout) {
    return (
      <div className={desktopCardOuter}>
        <ColorPalette selectedColor={selectedColor} onSelectColor={onSelectColor} />
        {desktopRow}
      </div>
    );
  }

  const gameSkyBtn =
    "min-h-[32px] px-1.5 py-0.5 text-[0.65rem] sm:min-h-[36px] sm:px-2 sm:py-1 sm:text-xs rounded-md border font-bold touch-manipulation sm:rounded-lg";

  return (
    <div
      className={
        "w-full min-w-0 max-w-full max-sm:min-w-0 sm:max-w-3xl flex flex-col shrink-0 box-border max-sm:gap-1 sm:gap-3 " +
        "sm:rounded-3xl sm:border-2 sm:border-white sm:bg-white/80 sm:shadow-lg sm:px-3 sm:py-3"
      }
    >
      <div className="flex flex-col gap-1.5 sm:hidden w-full">
        <div className="rounded-lg border border-violet-100/70 bg-white/60 px-1 py-0.5 shadow-sm">
          <ColorPalette
            selectedColor={selectedColor}
            onSelectColor={onSelectColor}
            gameMobileGrid
          />
        </div>
        <div className="rounded-lg border border-sky-100/80 bg-gradient-to-r from-sky-50/70 to-violet-50/50 px-1 py-0.5 shadow-sm">
          <div className="flex flex-wrap items-center justify-center gap-0.5">
            <BrushSizePicker selectedSize={brushSize} onSelectSize={onBrushSizeChange} gameMobile />
            <button
              type="button"
              onClick={onEraserToggle}
              className={`${gameSkyBtn} ${
                isEraser
                  ? "bg-amber-200 border-amber-500 text-amber-950"
                  : "bg-white border-amber-200 text-amber-900 hover:bg-amber-50"
              }`}
            >
              🧽 מחק
            </button>
            <button
              type="button"
              onClick={onClear}
              className={`${gameSkyBtn} border-red-200 bg-red-50 text-red-800 hover:bg-red-100`}
            >
              🗑️ נקה
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onSave}
          className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 py-1.5 text-sm font-bold text-white shadow-md ring-1 ring-white/40 hover:from-emerald-600 hover:to-teal-600 sm:rounded-xl sm:py-2 sm:text-base"
        >
          💾 שמרו לגלריה
        </button>
      </div>

      <div className="hidden sm:flex sm:flex-col sm:gap-3 w-full">
        <ColorPalette selectedColor={selectedColor} onSelectColor={onSelectColor} />
        {desktopRow}
      </div>
    </div>
  );
}
