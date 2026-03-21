import { readdirSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

export function GET() {
  const dir = join(process.cwd(), "public", "coloring");
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter(
      (name) => !name.startsWith(".") && IMAGE_EXT.test(name),
    );
  } catch {
    files = [];
  }
  return NextResponse.json({ files });
}
