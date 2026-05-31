import { buildProducts } from "./build-products.js";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const distDir = path.join(rootDir, "dist");
const ioniconsDistDir = path.join(rootDir, "node_modules", "ionicons", "dist");

console.log("📦 Building products from markdown...");
const { showcaseCards, catalogCards, products } = buildProducts();

// Compile SCSS to CSS
console.log("🎨 Compiling SCSS...");
execSync(
  `npx sass ${rootDir}/src/styles/main.scss ${rootDir}/dist/src/styles/main.css --embed-source-map`,
  { cwd: rootDir, stdio: "inherit" }
);
console.log("✅ SCSS compiled to dist/src/styles/main.css");

// Copy JS files
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
copyJsFiles(path.join(rootDir, "src"), path.join(distDir, "src"));
console.log("✅ JS files copied to dist/src/");

// Generate products.json for dynamic loading
const productsData = products.map(p => ({
  slug: p.slug,
  name: p.name,
  tagline: p.tagline,
  status: p.status,
  type: p.type,
  category: p.category,
  link: p.link,
  image: p.image,
}));

fs.writeFileSync(
  path.join(rootDir, "dist", "products.json"),
  JSON.stringify(productsData, null, 2)
);
console.log("Generated: dist/products.json");

// Copy and update index.html with generated content
const indexTemplate = fs.readFileSync(path.join(rootDir, "index.html"), "utf-8");

// Replace showcase cards placeholder and SCSS reference
const updatedIndex = indexTemplate
  .replace(
    /<!-- SHOWCASE_CARDS_START -->[\s\S]*?<!-- SHOWCASE_CARDS_END -->/,
    `<!-- SHOWCASE_CARDS_START -->${showcaseCards}<!-- SHOWCASE_CARDS_END -->`
  )
  .replace(
    /<!-- CATALOG_CARDS_START -->[\s\S]*?<!-- CATALOG_CARDS_END -->/,
    `<!-- CATALOG_CARDS_START -->${catalogCards}<!-- CATALOG_CARDS_END -->`
  )
  .replace(/<link rel="stylesheet" href="\/src\/styles\/main\.scss" \/>/, '<link rel="stylesheet" href="/src/styles/main.css?v=' + Date.now() + '" />');

// Ensure dist directory exists
fs.mkdirSync(distDir, { recursive: true });

// Write the updated index.html to dist
fs.writeFileSync(path.join(distDir, "index.html"), updatedIndex);
console.log("Generated: dist/index.html (with products from markdown)");

// Copy other HTML files
const docsDir = path.join(rootDir, "docs");
const distDocsDir = path.join(rootDir, "dist", "docs");
fs.mkdirSync(distDocsDir, { recursive: true });

const docsFiles = fs.readdirSync(docsDir).filter(f => f.endsWith(".html"));
for (const file of docsFiles) {
  fs.copyFileSync(
    path.join(docsDir, file),
    path.join(distDocsDir, file)
  );
  console.log(`Copied: docs/${file}`);
}

// Copy public assets to dist root, matching Vite public semantics
if (fs.existsSync(publicDir)) {
  copyDirectory(publicDir, distDir);
  console.log("Copied: public/* -> dist/");
}

// Copy ionicons runtime for generated static pages
if (fs.existsSync(ioniconsDistDir)) {
  copyDirectory(ioniconsDistDir, path.join(distDir, "vendor", "ionicons"));
  console.log("Copied: ionicons runtime -> dist/vendor/ionicons/");
}

console.log("\n✅ Build complete!");

function copyDirectory(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
