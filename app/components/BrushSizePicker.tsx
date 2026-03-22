"use client";

export const BRUSH_SIZES = [
  { id: "s", label: "קטן", size: 6 },
  { id: "m", label: "בינוני", size: 14 },
  { id: "l", label: "גדול", size: 24 },
] as const;

interface BrushSizePickerProps {
  selectedSize: number;
  onSelectSize: (size: number) => void;
  /** Match /game mobile control density */
  gameMobile?: boolean;
}

export function BrushSizePicker({ selectedSize, onSelectSize, gameMobile = false }: BrushSizePickerProps) {
  return (
    <div
      className={
        gameMobile
          ? "flex flex-wrap items-center justify-center gap-0.5 sm:gap-2"
          : "flex flex-wrap items-center gap-1.5 sm:gap-2"
      }
    >
      <span
        className={
          gameMobile
            ? "max-sm:text-[0.65rem] max-sm:font-bold max-sm:text-violet-900 sm:text-xs sm:font-semibold sm:text-gray-700 sm:text-sm"
            : "text-xs font-semibold text-gray-700 sm:text-sm"
        }
      >
        גודל מכחול:
      </span>
      {BRUSH_SIZES.map(({ id, label, size }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelectSize(size)}
          className={
            gameMobile
              ? "min-h-[32px] touch-manipulation rounded-md border px-1.5 py-0.5 text-[0.65rem] font-bold transition-colors sm:min-w-[44px] sm:h-11 sm:rounded-2xl sm:border-2 sm:px-3 sm:text-sm sm:font-semibold " +
                (selectedSize === size ? "bg-violet-200 border-violet-500 text-violet-950" : "border-violet-200 bg-white text-violet-800 hover:bg-violet-50")
              : "min-w-[40px] h-9 px-2 text-xs sm:min-w-[44px] sm:h-11 sm:px-3 sm:text-sm rounded-xl border-2 font-semibold sm:rounded-2xl " +
                (selectedSize === size ? "bg-violet-200 border-violet-400" : "bg-white border-gray-200 hover:bg-gray-50")
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}
