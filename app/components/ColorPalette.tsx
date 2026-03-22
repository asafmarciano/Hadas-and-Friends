"use client";

const COLORS = [
  "#f9a8d4", "#f87171", "#fb923c", "#facc15", "#4ade80",
  "#2dd4bf", "#60a5fa", "#a78bfa", "#c084fc", "#a16207", "#1f2937",
];

interface ColorPaletteProps {
  selectedColor: string;
  onSelectColor: (hex: string) => void;
  /** Match /game: 5-column grid (same on all breakpoints when true) */
  gameMobileGrid?: boolean;
}

export function ColorPalette({ selectedColor, onSelectColor, gameMobileGrid = false }: ColorPaletteProps) {
  return (
    <div
      className={
        gameMobileGrid
          ? "mx-auto grid w-full max-w-md grid-cols-5 justify-items-center gap-0.5 sm:gap-1"
          : "flex flex-wrap justify-center gap-1.5 sm:gap-2"
      }
    >
      {COLORS.map((hex) => (
        <button
          key={hex}
          type="button"
          onClick={() => onSelectColor(hex)}
          className={
            gameMobileGrid
              ? "h-7 w-7 touch-manipulation rounded-full border-2 shadow-sm transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-violet-300/70 active:scale-95 sm:h-9 sm:w-9 sm:shadow-none"
              : "h-8 w-8 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-violet-300 sm:h-10 sm:w-10"
          }
          style={{
            backgroundColor: hex,
            borderColor: selectedColor === hex ? "#7c3aed" : "rgba(255,255,255,0.8)",
          }}
        />
      ))}
    </div>
  );
}
