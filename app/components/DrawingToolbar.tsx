"use client";

import { ColorPalette } from "./ColorPalette";
import { BrushSizePicker, BRUSH_SIZES } from "./BrushSizePicker";

interface DrawingToolbarProps {
  selectedColor: string;
  onSelectColor: (c: string) => void;
  brushSize: number;
  onBrushSizeChange: (s: number) => void;
  isEraser: boolean;
  onEraserToggle: () => void;
  onClear: () => void;
  onSave: () => void;
}

export function DrawingToolbar({
  selectedColor,
  onSelectColor,
  brushSize,
  onBrushSizeChange,
  isEraser,
  onEraserToggle,
  onClear,
  onSave,
}: DrawingToolbarProps) {
  return (
    <div className="w-full max-w-3xl flex flex-col gap-4 bg-white/70 rounded-3xl border-2 border-white shadow-lg px-4 py-4">
      <ColorPalette selectedColor={selectedColor} onSelectColor={onSelectColor} />
      <div className="flex flex-wrap items-center justify-center gap-4">
        <BrushSizePicker selectedSize={brushSize} onSelectSize={onBrushSizeChange} />
        <button
          type="button"
          onClick={onEraserToggle}
          className={`min-w-[44px] h-11 px-4 rounded-2xl border-2 font-semibold ${
            isEraser ? "bg-gray-300 border-gray-500 text-gray-800" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          🧽 מחק
        </button>
        <button
          type="button"
          onClick={onClear}
          className="min-w-[44px] h-11 px-4 rounded-2xl border-2 border-red-200 bg-red-50 font-semibold text-red-700 hover:bg-red-100"
        >
          🗑️ נקה
        </button>
        <button
          type="button"
          onClick={onSave}
          className="min-w-[44px] h-11 px-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 font-semibold text-emerald-700 hover:bg-emerald-100"
        >
          💾 שמור
        </button>
      </div>
    </div>
  );
}
