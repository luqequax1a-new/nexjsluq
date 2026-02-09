import fs from 'node:fs';
import path from 'node:path';

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const root = process.cwd();
const src = path.join(root, 'node_modules', 'tinymce');
const dest = path.join(root, 'public', 'tinymce');

if (!fs.existsSync(src)) {
  console.error('[copy-tinymce] tinymce not found in node_modules. Did you run npm install?');
  process.exit(1);
}

// Copy only what TinyMCE needs at runtime.
// Keeping it simple: copy the whole package folder (minified assets, skins, plugins, themes).
try {
  fs.rmSync(dest, { recursive: true, force: true });
} catch (_) {}

copyDir(src, dest);

console.log(`[copy-tinymce] Copied TinyMCE assets to ${dest}`);
