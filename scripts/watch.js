import { buildProducts } from "./build-products.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import http from "http";
import { fileURLToPath as importMetaUrl } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const productsDir = path.join(rootDir, "products");
const distDir = path.join(rootDir, "dist");
const publicDir = path.join(rootDir, "public");
const ioniconsDistDir = path.join(rootDir, "node_modules", "ionicons", "dist");

let viteProcess = null;
const srcDir = path.join(rootDir, "src");
const stylesDir = path.join(srcDir, "styles");

// Initial build
console.log("📦 Building products...");

function generateDevIndex() {
  const { showcaseCards, catalogCards } = buildProducts();

  const indexTemplate = fs.readFileSync(path.join(rootDir, "index.html"), "utf-8");

  const updatedIndex = indexTemplate
    .replace(
      /<!-- SHOWCASE_CARDS_START -->[\s\S]*?<!-- SHOWCASE_CARDS_END -->/,
      `<!-- SHOWCASE_CARDS_START -->${showcaseCards}<!-- SHOWCASE_CARDS_END -->`
    )
    .replace(
      /<!-- CATALOG_CARDS_START -->[\s\S]*?<!-- CATALOG_CARDS_END -->/,
      `<!-- CATALOG_CARDS_START -->${catalogCards}<!-- CATALOG_CARDS_END -->`
    )
    .replace(/<link rel="stylesheet" href="\/src\/styles\/main\.scss" \/>/, '<link rel="stylesheet" href="/src/styles/main.css" />');

  fs.mkdirSync(path.join(rootDir, "dist"), { recursive: true });
  fs.writeFileSync(path.join(rootDir, "dist", "index.html"), updatedIndex);
  console.log("Generated: dist/index.html (with products from markdown)");
}

// Compile SCSS to CSS
function compileScss() {
  console.log("🎨 Compiling SCSS...");
  try {
    execSync(
      `npx sass ${srcDir}/styles/main.scss ${rootDir}/dist/src/styles/main.css --embed-source-map`,
      { cwd: rootDir, stdio: "inherit" }
    );
    console.log("✅ SCSS compiled to dist/src/styles/main.css");
  } catch (error) {
    console.error("Error compiling SCSS:", error.message);
  }
}

compileScss();

// Copy JS files to dist
function copyJs() {
  const distSrc = path.join(rootDir, "dist", "src");
  fs.mkdirSync(distSrc, { recursive: true });

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
  copyJsFiles(srcDir, distSrc);
  console.log("✅ JS files copied to dist/src/");
}

copyJs();

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

function copyPublicAssets() {
  if (!fs.existsSync(publicDir)) return;
  copyDirectory(publicDir, distDir);
  console.log("✅ Public assets copied to dist/");
}

function copyVendorAssets() {
  if (!fs.existsSync(ioniconsDistDir)) return;
  copyDirectory(ioniconsDistDir, path.join(distDir, "vendor", "ionicons"));
  console.log("✅ Ionicons runtime copied to dist/vendor/ionicons/");
}

copyPublicAssets();
copyVendorAssets();
generateDevIndex();

// Simple HTTP server serving from dist/
function startHttpServer() {
  const PORT = 5173;
  const HOST = "0.0.0.0";

  const mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
  };

  const server = http.createServer((req, res) => {
    // Parse URL
    let urlPath = req.url;
    if (urlPath === "/") {
      urlPath = "/index.html";
    }

    // Remove query string
    urlPath = urlPath.split("?")[0];

    const filePath = path.join(distDir, urlPath);
    const ext = path.extname(urlPath);

    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h1>404 - Not Found</h1>");
        return;
      }

      // Read file and serve (no caching for CSS/JS)
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "text/html" });
          res.end("<h1>500 - Server Error</h1>");
          return;
        }

        // Set content type
        const contentType = mimeTypes[ext] || "application/octet-stream";
        res.writeHead(200, {
          "Content-Type": contentType,
          "Cache-Control": "no-cache, no-store, must-revalidate"
        });
        res.end(data);
      });
    });
  });

  server.listen(PORT, HOST, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}/`);
  });

  return server;
}

const httpServer = startHttpServer();

// Watch products directory
console.log("👀 Watching products/ for changes...");

let rebuildTimeout = null;

fs.watch(productsDir, (eventType, filename) => {
  if (filename && filename.endsWith(".md")) {
    console.log(`\n📝 ${filename} changed, rebuilding...`);

    clearTimeout(rebuildTimeout);
    rebuildTimeout = setTimeout(() => {
      console.log("📦 Rebuilding products...");
      generateDevIndex();
      console.log("✅ Rebuild complete! Refresh the page to see changes.");
    }, 300);
  }
});

// Watch styles directory for SCSS changes
fs.watch(stylesDir, { recursive: true }, (eventType, filename) => {
  if (filename && filename.endsWith(".scss")) {
    console.log(`\n📝 src/styles/${filename} changed, recompiling...`);
    clearTimeout(rebuildTimeout);
    rebuildTimeout = setTimeout(() => {
      compileScss();
      console.log("✅ Recompiled! Refresh the page to see changes.");
    }, 300);
  }
});

// Watch public assets
fs.watch(publicDir, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  console.log(`\n📝 public/${filename} changed, copying assets...`);
  clearTimeout(rebuildTimeout);
  rebuildTimeout = setTimeout(() => {
    copyPublicAssets();
    console.log("✅ Public assets updated.");
  }, 300);
});

// Watch src directory for JS changes
fs.watch(path.join(srcDir, "js"), { recursive: true }, (eventType, filename) => {
  if (filename && filename.endsWith(".js")) {
    console.log(`\n📝 src/js/${filename} changed, copying to dist...`);
    clearTimeout(rebuildTimeout);
    rebuildTimeout = setTimeout(() => {
      copyJs();
      console.log("✅ Copied! Refresh the page to see changes.");
    }, 300);
  }
});

console.log("\n✨ Dev server running at http://localhost:5173");
console.log("Press Ctrl+C to stop.\n");

// Cleanup on exit
process.on("SIGINT", () => {
  if (httpServer) {
    httpServer.close();
  }
  process.exit();
});

process.on("SIGTERM", () => {
  if (httpServer) {
    httpServer.close();
  }
  process.exit();
});
