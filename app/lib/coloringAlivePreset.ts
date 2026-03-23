export const ALIVE_PRESET_IDS = ["fish", "elephant", "butterfly", "car", "unicorn", "default"] as const;
export type AlivePresetId = (typeof ALIVE_PRESET_IDS)[number];

function decodeFilenameFromColoringUrl(url: string | null): string {
  if (!url || typeof url !== "string") return "";
  try {
    const seg = url.split("/").pop() ?? "";
    return decodeURIComponent(seg);
  } catch {
    return url.split("/").pop() ?? "";
  }
}

function stableHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Pick a motion preset for this coloring sheet.
 * Filenames are often opaque hashes — we use stable hash → preset so each image keeps the same “personality”.
 * Optional substring overrides when filenames become readable later.
 */
export function getAlivePresetForColoringUrl(url: string | null): AlivePresetId {
  const name = decodeFilenameFromColoringUrl(url);
  const lower = name.toLowerCase();

  const overrides: [RegExp, AlivePresetId][] = [
    [/fish|דג|shark|whale|dolphin|jelly|octopus/i, "fish"],
    [/elephant|פיל|lion|tiger|bear|panda|monkey|giraffe/i, "elephant"],
    [/butterfly|פרפר|bee|bird|owl|dragonfly/i, "butterfly"],
    [/car|מכונית|truck|bus|train|plane|bike|rocket/i, "car"],
    [/unicorn|חד|קסם|princess|fairy|rainbow/i, "unicorn"],
  ];
  for (const [re, id] of overrides) {
    if (re.test(name) || re.test(lower)) return id;
  }

  const idx = stableHash(name) % ALIVE_PRESET_IDS.length;
  return ALIVE_PRESET_IDS[idx]!;
}
