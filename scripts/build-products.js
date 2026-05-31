import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const productsDir = path.join(rootDir, "products");
const outputDir = path.join(rootDir, "dist/products");

// Ensure output directory exists
fs.mkdirSync(outputDir, { recursive: true });

// Read all markdown files from products directory
function readProducts() {
  const files = fs.readdirSync(productsDir).filter((f) => f.endsWith(".md"));
  const products = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(productsDir, file), "utf-8");
    const product = parseMarkdown(content);
    products.push(product);
  }

  return products;
}

// Parse markdown frontmatter and content
function parseMarkdown(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    throw new Error("Invalid markdown format");
  }

  const frontmatter = frontmatterMatch[1];
  const body = frontmatterMatch[2];

  const data = {};
  frontmatter.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split(":");
    if (key && valueParts.length > 0) {
      const trimmedKey = key.trim();
      const value = valueParts.join(":").trim().replace(/^["']|["']$/g, "");
      data[trimmedKey] = trimmedKey === "order" ? Number(value) : value;
    }
  });

  return { ...data, body };
}

// Generate showcase card HTML
function generateShowcaseCard(product, index) {
  const statusClass = {
    new: "showcase-card__state-badge--new",
    available: "showcase-card__state-badge--available",
    discontinued: "showcase-card__state-badge--discontinued",
    kit: "showcase-card__state-badge--kit",
  }[product.status] || "";

  const hasImage = product.image;
  const cardClass = hasImage ? "showcase-card" : "showcase-card showcase-card--text";

  // Use external link if it's an actual URL, otherwise link to product page
  const cardLink = product.link?.startsWith("http")
    ? product.link
    : `products/${product.slug}.html`;

  if (hasImage) {
    return `
                    <a class="${cardClass}" href="${cardLink}">
                        <div class="showcase-card__head">
                            <div class="showcase-card__head-main">
                                <span class="showcase-card__index">${String(index + 1).padStart(2, "0")}</span>
                                <span class="showcase-card__state-badge ${statusClass}">${capitalize(product.status)}</span>
                            </div>
                            <div class="showcase-card__type-badges">
                                <span class="showcase-card__type-badge">${product.type}</span>
                                <span class="showcase-card__type-badge">${product.category}</span>
                            </div>
                        </div>
                        <div class="showcase-card__media">
                            <img src="/showcase-transparent/${product.image}" alt="${product.name} sketch" />
                        </div>
                        <div class="showcase-card__body">
                            <h2>${product.name}</h2>
                            <p>${product.tagline}</p>
                        </div>
                    </a>`;
  } else {
    return `
                    <a class="${cardClass}" href="${cardLink}">
                        <div class="showcase-card__head">
                            <div class="showcase-card__head-main">
                                <span class="showcase-card__index">${String(index + 1).padStart(2, "0")}</span>
                                <span class="showcase-card__state-badge ${statusClass}">${capitalize(product.status)}</span>
                            </div>
                            <div class="showcase-card__type-badges">
                                <span class="showcase-card__type-badge">${product.type}</span>
                                <span class="showcase-card__type-badge">${product.category}</span>
                            </div>
                        </div>
                        <div class="showcase-card__media">
                            <div class="showcase-card__placeholder">
                                <span>Archive</span>
                                <strong>${product.name}</strong>
                            </div>
                        </div>
                        <div class="showcase-card__body">
                            <h2>${product.name}</h2>
                            <p>${product.tagline}</p>
                        </div>
                    </a>`;
  }
}

// Generate catalog card HTML
function generateCatalogCard(product) {
  const status = {
    new: "Development",
    available: "Released",
    discontinued: "Discontinued",
    kit: "Soon",
  }[product.status] || "Released";

  // Use external link if it's an actual URL, otherwise link to product page
  const cardLink = product.link?.startsWith("http")
    ? product.link
    : `products/${product.slug}.html`;

  return `
                        <a class="catalog-card" href="${cardLink}">
                            <div>
                                <p class="catalog-card__meta">
                                    ${product.type} / ${product.category} / ${status}
                                </p>
                                <h3>${product.name}</h3>
                            </div>
                            <p>${product.tagline}</p>
                        </a>`;
}

// Generate individual product page
function generateProductPage(product) {
  const statusLabels = {
    new: "New",
    available: "Available",
    discontinued: "Discontinued",
    kit: "Kit",
  };
  const statusLabel = statusLabels[product.status] || "Available";
  const statusClass = `showcase-card__state-badge--${product.status}`;

  return `<!doctype html>
<html lang="ja">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${product.name} - HÜGELTON INSTRUMENTS</title>
        <meta name="description" content="${product.tagline}" />
        <meta name="theme-color" content="#0055ff" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Space+Grotesk:wght@400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="../src/styles/main.css" />
    </head>
    <body>
        <div class="cursor-dot" aria-hidden="true"></div>
        <main class="site-shell">
            <header class="topbar" id="top">
                <div class="topbar__brand">
                    <a href="../index.html" class="brand-link" aria-label="Hugelton Home">
                        <svg xmlns="http://www.w3.org/2000/svg" class="brand-logo" viewBox="0 0 8.504 6.373">
                            <g data-name="Print">
                                <path d="M8.226 4.705c-.082 0-.261-.17-.396-.628-.263-.893-.695-1.026-.929-1.026s-.665.133-.929 1.026c-.135.458-.314.628-.369.633-.002-.002-.236-.153-.415-1.208-.19-1.121-.497-1.666-.936-1.666s-.746.545-.937 1.666c-.13.767-.289 1.056-.357 1.156-.086-.159-.271-.647-.417-2.056C2.303.309 1.933 0 1.602 0S.901.309.663 2.602C.498 4.197.283 4.612.217 4.705h-.218v.556h.278c.331 0 .701-.309.938-2.602.131-1.257.291-1.781.386-1.993.095.211.255.735.386 1.993.238 2.293.608 2.602.939 2.602.44 0 .746-.545.937-1.666.161-.949.366-1.167.368-1.203.041.035.247.254.408 1.203.191 1.121.497 1.666.937 1.666.234 0 .665-.133.929-1.026.135-.458.314-.628.396-.628s.261.17.396.628c.263.893.695 1.027.929 1.027h.278v-.556h-.278ZM0 5.817h8.504v.556H0z"></path>
                            </g>
                        </svg>
                    </a>
                </div>
                <nav class="topbar__tags" aria-label="Primary">
                    <div class="topbar__group">
                        <a class="topbar__group-trigger" href="../index.html#showcase">Products</a>
                    </div>
                    <a class="topbar__link" href="../index.html#about">About</a>
                    <a class="topbar__link" href="../docs/index.html">Documents</a>
                    <a class="topbar__link" href="../index.html#contact">Support</a>
                </nav>
            </header>

            <div class="main-shell">
                <section class="hero-grid" id="hero">
                    <div class="hero-grid__main">
                        <p class="detail-label">${product.type} / ${product.category}</p>
                        <h1 class="hero-title">${product.name}</h1>
                        <div class="hero-subline">
                            <p>${product.tagline}</p>
                        </div>
                        <div style="margin-top: 2rem;">
                            <span class="showcase-card__state-badge ${statusClass}">${statusLabel}</span>
                        </div>
                    </div>
                </section>

                <section class="detail-grid">
                    <div class="detail-grid__left">
                        <p class="detail-label">Overview</p>
                        <div class="detail-copy detail-copy--prose">
                            ${parseMarkdownBody(product.body)}
                        </div>
                    </div>
                </section>
            </div>
        </main>
        <script type="module" src="../src/js/site.js"></script>
    </body>
</html>`;
}

// Simple markdown body parser (converts basic MD to HTML)
function parseMarkdownBody(body) {
  let html = body;

  // Headers
  html = html.replace(/^### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^## (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^# (.+)$/gm, "<h2>$1</h2>");

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Lists
  html = html.replace(/^\- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");

  // Paragraphs
  html = html.split("\n\n").map(para => {
    if (para.startsWith("<h") || para.startsWith("<ul")) return para;
    return `<p>${para.replace(/\n/g, "<br>")}</p>`;
  }).join("\n");

  return html;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Main build function
export function buildProducts() {
  const products = readProducts();

  // Sort products for showcase: by order field, then by name
  const sortedProducts = [...products].sort((a, b) => {
    const aOrder = a.order ?? 999;
    const bOrder = b.order ?? 999;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.name.localeCompare(b.name);
  });

  // Generate individual product pages
  for (const product of products) {
    const html = generateProductPage(product);
    fs.writeFileSync(path.join(outputDir, `${product.slug}.html`), html);
    console.log(`Generated: products/${product.slug}.html`);
  }

  // Sort catalog cards alphabetically by name
  const catalogSorted = [...products].sort((a, b) => a.name.localeCompare(b.name));

  // Generate data for main page (as JSON for now)
  const showcaseCards = sortedProducts.map((p, i) => generateShowcaseCard(p, i)).join("\n");
  const catalogCards = catalogSorted.map(p => generateCatalogCard(p)).join("\n");

  fs.writeFileSync(
    path.join(rootDir, "dist", "products-data.json"),
    JSON.stringify({ showcaseCards, catalogCards }, null, 2)
  );

  console.log(`\nGenerated ${products.length} product pages`);
  console.log("Generated: dist/products-data.json");

  return { showcaseCards, catalogCards, products };
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildProducts();
}
