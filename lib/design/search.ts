// lib/design/search.ts
import fs from "fs";
import path from "path";
import { rankDocuments, BM25Doc } from "./bm25";

type CSVRow = Record<string, string>;
const DATA_DIR = path.join(process.cwd(), "data");

// ===== FIELD WEIGHTS (CRITICAL FOR QUALITY) =====
const FIELD_WEIGHTS: Record<string, number> = {
  "Pattern Name": 3,
  "Style Category": 3,
  "Font Pairing Name": 3,

  Keywords: 2.5,
  "AI Prompt Keywords": 2.5,
  "Mood/Style Keywords": 2.5,

  "Section Order": 2,
  "Conversion Optimization": 2,
  "Best For": 2,

  Notes: 1.5,
};

// ===== EXTENDED DOMAIN SOURCES =====
const DOMAIN_SOURCES: Record<string, string[]> = {
  style: ["styles.csv", "design.csv", "draft.csv"],
  color: ["colors.csv"],
  typography: ["typography.csv", "google-fonts.csv"],
  pattern: ["landing.csv", "app-interface.csv"],
  product: ["products.csv"],
  ux: ["ux-guidelines.csv"],
  performance: ["react-performance.csv"],
  components: ["icons.csv", "charts.csv"],
};

// ===== CSV CONFIG =====
export const CSV_CONFIG: Record<
  string,
  { file: string; searchCols: string[]; outputCols: string[] }
> = {
  style: {
    file: "styles.csv",
    searchCols: ["Style Category", "Keywords", "Best For", "Type", "AI Prompt Keywords"],
    outputCols: ["Style Category", "Type", "Keywords", "Best For", "AI Prompt Keywords"],
  },
  color: {
    file: "colors.csv",
    searchCols: ["Product Type", "Notes"],
    outputCols: ["Product Type", "Primary", "Secondary", "Accent", "Background", "Notes"],
  },
  typography: {
    file: "typography.csv",
    searchCols: ["Font Pairing Name", "Category", "Mood/Style Keywords", "Best For"],
    outputCols: ["Font Pairing Name", "Heading Font", "Body Font", "Mood/Style Keywords", "Best For"],
  },
  pattern: {
    file: "landing.csv",
    searchCols: ["Pattern Name", "Keywords", "Section Order", "Conversion Optimization"],
    outputCols: ["Pattern Name", "Section Order", "Primary CTA Placement", "Color Strategy", "Conversion Optimization"],
  },
  product: {
    file: "products.csv",
    searchCols: ["Product Type", "Keywords"],
    outputCols: ["Product Type"],
  },
};

// ===== SAFE CSV LOADER =====
function loadCSV(file: string): CSVRow[] {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) return [];

  const raw = fs.readFileSync(filePath, "utf-8");
  const [headerLine, ...lines] = raw.split("\n").filter(Boolean);
  const headers = headerLine.split(",").map((h) => h.trim());

  return lines.map((line) => {
    const values = line.split(",");
    return headers.reduce<Record<string, string>>((acc, col, idx) => {
      acc[col] = values[idx]?.trim() || "";
      return acc;
    }, {});
  });
}

// ===== DOMAIN DETECTION =====
export function detectDomain(query: string): string {
  const q = query.toLowerCase();

  const domainKeywords: Record<string, string[]> = {
    style: ["style", "ui", "design", "minimal", "modern"],
    color: ["color", "palette", "hex", "accent"],
    typography: ["font", "typography", "heading"],
    pattern: ["landing", "cta", "hero", "section"],
    product: ["product", "app", "dashboard"],
  };

  let best = "style";
  let max = 0;

  for (const d in domainKeywords) {
    const score = domainKeywords[d].reduce(
      (acc, kw) => acc + (q.includes(kw) ? 1 : 0),
      0
    );
    if (score > max) {
      max = score;
      best = d;
    }
  }

  return best;
}

// ===== BUILD STRUCTURED DOCS =====
function buildDocs(
  data: CSVRow[],
  searchCols: string[],
  source: string
): BM25Doc[] {
  return data.map((row) => {
    let content = "";
    let weight = 1;

    searchCols.forEach((col) => {
      const val = row[col] || "";
      content += " " + val;

      if (FIELD_WEIGHTS[col]) {
        weight += FIELD_WEIGHTS[col];
      }
    });

    return {
      content,
      weight,
      meta: {
        ...row,
        __source: source, // 🔥 track origin CSV
      },
    };
  });
}

// ===== MAIN SEARCH =====
export function search(
  query: string,
  domain?: string,
  maxResults = 7
) {
  const detected = domain || detectDomain(query);
  const config = CSV_CONFIG[detected];

  if (!config) {
    return { domain: detected, query, count: 0, results: [] };
  }

  const files = DOMAIN_SOURCES[detected] || [config.file];

  let docs: BM25Doc[] = [];

  for (const file of files) {
    const data = loadCSV(file);
    if (data.length) {
      docs = docs.concat(buildDocs(data, config.searchCols, file));
    }
  }

  if (!docs.length) {
    return { domain: detected, query, count: 0, results: [] };
  }

  const ranked = rankDocuments(docs, query)
    .filter((r) => r.score > 0)
    .slice(0, maxResults);

  const results = ranked.map((r) => {
    const row = docs[r.index].meta;
    const out: Record<string, string> = {};

    config.outputCols.forEach((col) => {
      if (row[col] !== undefined) {
        out[col] = row[col];
      }
    });

    return {
      score: r.score,
      ...out,
    };
  });

  return {
    domain: detected,
    query,
    file: files.join(", "),
    count: results.length,
    results,
  };
}

// ===== FORMAT =====
export function formatOutput(result: any): string {
  if (result.error) return `Error: ${result.error}`;

  const lines: string[] = [];
  lines.push(`## UI Pro Max Search Results`);
  lines.push(`Domain: ${result.domain} | Query: ${result.query}`);
  lines.push(`Source: ${result.file} | Found: ${result.count}\n`);

  result.results.forEach((row: any, i: number) => {
    lines.push(`### Result ${i + 1} (Score: ${row.score.toFixed(2)})`);
    Object.entries(row).forEach(([k, v]) => {
      if (k === "score") return;
      lines.push(`- ${k}: ${v}`);
    });
    lines.push("");
  });

  return lines.join("\n");
}