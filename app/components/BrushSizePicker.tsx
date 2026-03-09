"use client";

export const BRUSH_SIZES = [
  { id: "s", label: "קטן", size: 6 },
  { id: "m", label: "בינוני", size: 14 },
  { id: "l", label: "גדול", size: 24 },
] as const;

interface BrushSizePickerProps {
  selectedSize: number;
  onSelectSize: (size: number) => void;
}

export function BrushSizePicker({ selectedSize, onSelectSize }: BrushSizePickerProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-semibold text-gray-700">גודל מכחול:</span>
      {BRUSH_SIZES.map(({ id, label, size }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelectSize(size)}
          className={"min-w-[44px] h-11 px-3 rounded-2xl border-2 font-semibold text-sm " +
            (selectedSize === size ? "bg-violet-200 border-violet-400" : "bg-white border-gray-200 hover:bg-gray-50")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
