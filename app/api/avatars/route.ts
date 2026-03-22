import { readdirSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

const IMAGE_EXT = /\.(jpe?g|png)$/i;

export function GET() {
  const dir = join(process.cwd(), "public", "avatars");
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter(
      (name) => !name.startsWith(".") && IMAGE_EXT.test(name),
    );
  } catch {
    files = [];
  }
  files.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  const list = files.map((name) => ({
    url: `/avatars/${encodeURIComponent(name)}`,
  }));
  return NextResponse.json(list);
}
