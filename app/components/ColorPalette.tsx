"use client";

const COLORS = [
  "#f9a8d4", "#f87171", "#fb923c", "#facc15", "#4ade80",
  "#2dd4bf", "#60a5fa", "#a78bfa", "#c084fc", "#a16207", "#1f2937",
];

interface ColorPaletteProps {
  selectedColor: string;
  onSelectColor: (hex: string) => void;
}

export function ColorPalette({ selectedColor, onSelectColor }: ColorPaletteProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {COLORS.map((hex) => (
        <button
          key={hex}
          type="button"
          onClick={() => onSelectColor(hex)}
          className="w-10 h-10 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
          style={{
            backgroundColor: hex,
            borderColor: selectedColor === hex ? "#7c3aed" : "rgba(255,255,255,0.8)",
          }}
        />
      ))}
    </div>
  );
}
