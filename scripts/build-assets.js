import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const srcDir = path.join(rootDir, "src");
const distDir = path.join(rootDir, "dist", "src");

// Ensure dist/src exists
fs.mkdirSync(distDir, { recursive: true });

// Compile SCSS to CSS using sass
try {
  console.log("🎨 Compiling SCSS...");
  execSync(
    `npx sass ${srcDir}/styles/main.scss ${distDir}/styles/main.css --source-map=embed`,
    { cwd: rootDir }
  );
  console.log("✅ SCSS compiled to dist/src/styles/main.css");

  // Copy all JS files
  const copyJsFiles = (dir, dest) => {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(dir, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyJsFiles(srcPath, destPath);
      } else if (entry.name.endsWith(".js")) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  copyJsFiles(srcDir, distDir);
  console.log("✅ JS files copied to dist/src/");
} catch (error) {
  console.error("Error compiling SCSS:", error.message);
  process.exit(1);
}
