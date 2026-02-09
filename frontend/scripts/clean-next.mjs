import fs from "node:fs";
import path from "node:path";

const target = path.join(process.cwd(), ".next");

try {
  fs.rmSync(target, { recursive: true, force: true });
  // eslint-disable-next-line no-console
  console.log(`[clean-next] Removed ${target}`);
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn(`[clean-next] Failed to remove ${target}:`, err);
}

