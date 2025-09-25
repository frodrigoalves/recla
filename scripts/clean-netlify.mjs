import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const NETLIFY_DIR = resolve(process.cwd(), ".netlify");

if (existsSync(NETLIFY_DIR)) {
  rmSync(NETLIFY_DIR, { recursive: true, force: true });
  console.log("Removed generated .netlify directory.");
} else {
  console.log("No .netlify directory found. Nothing to clean.");
}
