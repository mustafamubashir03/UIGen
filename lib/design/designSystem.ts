// lib/design/designSystem.ts
import fs from "fs";
import path from "path";
import { search } from "./search";

type RawResult = Record<string, string>;

type Domain = "style" | "color" | "typography" | "pattern";

interface SearchResponse {
  domain: string;
  results: RawResult[];
}

const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, "data");
const REASONING_CSV = "ui-reasoning.csv";

// ===== CSV LOADER =====
function loadCSV(file: string): RawResult[] {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) return [];

  const raw = fs.readFileSync(filePath, "utf-8");
  const [headerLine, ...lines] = raw.split("\n").filter(Boolean);
  const headers = headerLine.split(",").map((h) => h.trim());

  return lines.map((line) => {
    const values = line.split(",");
    const row: RawResult = {};

    headers.forEach((col, idx) => {
      row[col] = values[idx]?.trim() || "";
    });

    return row;
  });
}

// ===== TYPES =====
export interface DesignSystem {
  project_name: string;
  category: string;

  pattern: {
    name: string;
    sections: string[];
    cta_placement: string;
    color_strategy?: string;
    conversion?: string;
  };

  style: {
    name: string;
    type?: string;
    keywords?: string;
    effects?: string;
  };

  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };

  typography: {
    heading: string;
    body: string;
    mood?: string;
  };

  key_effects: string;
  anti_patterns: string;
  decision_rules: Record<string, unknown>;
  severity: "LOW" | "MEDIUM" | "HIGH";

  candidates: Record<Domain, RawResult[]>;
  reasoning_summary: string;
}

// ===== GENERATOR =====
export class DesignSystemGenerator {
  private reasoningCSV: RawResult[];

  constructor() {
    this.reasoningCSV = loadCSV(REASONING_CSV);
  }

  // ===== MULTI SEARCH =====
  private multiSearch(
    query: string,
    stylePriority: string[]
  ): Record<Domain, RawResult[]> {
    const domains: Domain[] = [
      "style",
      "color",
      "typography",
      "pattern",
    ];

    const results = {} as Record<Domain, RawResult[]>;

    for (const domain of domains) {
      const q =
        domain === "style"
          ? `${query} ${stylePriority.join(" ")}`
          : query;

      const res = search(q, domain, 7) as SearchResponse;

      results[domain] = res.results ?? [];
    }

    return results;
  }

  // ===== REASONING =====
  private getReasoning(category: string) {
    const row =
      this.reasoningCSV.find(
        (r) =>
          r["Category"]?.toLowerCase() === category.toLowerCase()
      ) ?? {};

    return {
      pattern: row["Pattern"] || "Hero + Features + CTA",
      style_priority:
        row["Style Priority"]
          ?.split("|")
          .map((s) => s.trim()) ?? ["Minimal"],
      typography_mood: row["Typography Mood"] || "Clean",
      key_effects: row["Key Effects"] || "",
      anti_patterns: row["Anti-Patterns"] || "",
      severity:
        (row["Severity"] as "LOW" | "MEDIUM" | "HIGH") ||
        "MEDIUM",
    };
  }

  // ===== SAFE GET =====
  private getValue(obj: RawResult, key: string): string {
    return obj[key] ?? "";
  }

  // ===== CRITIC SCORE =====
  private criticScore(
    item: RawResult,
    query: string,
    priorities: string[]
  ): number {
    let score = 0;

    const str = JSON.stringify(item).toLowerCase();
    const q = query.toLowerCase();

    if (str.includes(q)) score += 10;

    for (const p of priorities) {
      if (str.includes(p.toLowerCase())) score += 5;
    }

    if (str.includes("cta")) score += 3;
    if (str.includes("conversion")) score += 3;
    if (str.includes("hero")) score += 2;

    return score;
  }

  // ===== PICK TOP =====
  private pickTop(
    results: RawResult[],
    query: string,
    priorities: string[],
    topN = 3
  ): RawResult[] {
    const scored = results.map((r) => ({
      item: r,
      score: this.criticScore(r, query, priorities),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topN).map((s) => s.item);
  }

  // ===== MAIN =====
  public generate(query: string, projectName?: string): DesignSystem {
    // CATEGORY
    const product = search(query, "product", 1) as SearchResponse;

    const category =
      product.results?.[0]?.["Product Type"] ?? "General";

    // REASONING
    const reasoning = this.getReasoning(category);

    // SEARCH
    const results = this.multiSearch(
      query,
      reasoning.style_priority
    );

    // TOP RESULTS
    const styles = this.pickTop(
      results.style,
      query,
      reasoning.style_priority
    );

    const colors = this.pickTop(results.color, query, []);
    const typography = this.pickTop(
      results.typography,
      query,
      []
    );
    const patterns = this.pickTop(results.pattern, query, []);

    // BEST
    const bestStyle = styles[0] ?? {};
    const bestColor = colors[0] ?? {};
    const bestTypography = typography[0] ?? {};
    const bestPattern = patterns[0] ?? {};

    return {
      project_name: projectName ?? query.toUpperCase(),
      category,

      pattern: {
        name:
          this.getValue(bestPattern, "Pattern Name") ||
          reasoning.pattern,
        sections: (
          this.getValue(bestPattern, "Section Order") ||
          "Hero > Features > CTA"
        )
          .split(">")
          .map((s) => s.trim()),
        cta_placement:
          this.getValue(bestPattern, "Primary CTA Placement") ||
          "Above fold",
        color_strategy: this.getValue(
          bestPattern,
          "Color Strategy"
        ),
        conversion: this.getValue(
          bestPattern,
          "Conversion Optimization"
        ),
      },

      style: {
        name:
          this.getValue(bestStyle, "Style Category") ||
          "Minimal",
        type: this.getValue(bestStyle, "Type"),
        keywords: this.getValue(bestStyle, "Keywords"),
        effects: this.getValue(
          bestStyle,
          "Recommended Effects"
        ),
      },

      colors: {
        primary:
          this.getValue(bestColor, "Primary") || "#2563EB",
        secondary:
          this.getValue(bestColor, "Secondary") ||
          "#3B82F6",
        accent:
          this.getValue(bestColor, "Accent") || "#F97316",
        background:
          this.getValue(bestColor, "Background") ||
          "#F8FAFC",
      },

      typography: {
        heading:
          this.getValue(bestTypography, "Heading Font") ||
          "Inter",
        body:
          this.getValue(bestTypography, "Body Font") ||
          "Inter",
        mood:
          this.getValue(
            bestTypography,
            "Mood/Style Keywords"
          ) || reasoning.typography_mood,
      },

      key_effects: reasoning.key_effects,
      anti_patterns: reasoning.anti_patterns,
      decision_rules: {},
      severity: reasoning.severity,

      candidates: {
        style: styles,
        color: colors,
        typography: typography,
        pattern: patterns,
      },

      reasoning_summary: `
Top pattern: ${this.getValue(bestPattern, "Pattern Name")}
Top style: ${this.getValue(bestStyle, "Style Category")}
Color strategy: ${this.getValue(bestPattern, "Color Strategy")}
Typography mood: ${this.getValue(bestTypography, "Mood/Style Keywords")}
      `.trim(),
    };
  }
}