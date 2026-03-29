export interface RankedDoc {
    index: number;
    score: number;
  }
  
  export interface BM25Doc {
    content: string;
    weight?: number;
    meta?: Record<string, string>;
  }
  
  export class BM25 {
    private k1 = 1.5;
    private b = 0.75;
  
    private corpus: string[][] = [];
    private weights: number[] = [];
    private docLengths: number[] = [];
    private avgdl = 0;
  
    private idf: Record<string, number> = {};
    private docFreqs: Record<string, number> = {};
    private N = 0;
  
    tokenize(text: string): string[] {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2);
    }
  
    fit(documents: BM25Doc[]) {
      this.corpus = documents.map((d) => this.tokenize(d.content));
      this.weights = documents.map((d) => d.weight || 1);
  
      this.N = this.corpus.length;
      if (!this.N) return;
  
      this.docLengths = this.corpus.map((d) => d.length);
      this.avgdl =
        this.docLengths.reduce((sum, len) => sum + len, 0) / this.N;
  
      this.docFreqs = {};
  
      this.corpus.forEach((doc) => {
        const seen = new Set<string>();
        doc.forEach((word) => {
          if (!seen.has(word)) {
            this.docFreqs[word] = (this.docFreqs[word] || 0) + 1;
            seen.add(word);
          }
        });
      });
  
      this.idf = {};
      Object.entries(this.docFreqs).forEach(([word, freq]) => {
        this.idf[word] = Math.log(
          (this.N - freq + 0.5) / (freq + 0.5) + 1
        );
      });
    }
  
    score(query: string): RankedDoc[] {
      if (!this.N) return [];
  
      const queryTokens = this.tokenize(query);
  
      // ✅ query term frequency
      const queryFreqs: Record<string, number> = {};
      queryTokens.forEach((t) => {
        queryFreqs[t] = (queryFreqs[t] || 0) + 1;
      });
  
      const results: RankedDoc[] = [];
  
      this.corpus.forEach((doc, idx) => {
        const docLen = this.docLengths[idx];
        const weight = this.weights[idx];
  
        const termFreqs: Record<string, number> = {};
        doc.forEach((w) => {
          termFreqs[w] = (termFreqs[w] || 0) + 1;
        });
  
        let score = 0;
  
        Object.keys(queryFreqs).forEach((token) => {
          if (!(token in this.idf)) return;
  
          const tf = termFreqs[token] || 0;
          const idf = this.idf[token];
          const qtf = queryFreqs[token];
  
          const numerator = tf * (this.k1 + 1);
          const denominator =
            tf +
            this.k1 *
              (1 - this.b + (this.b * docLen) / this.avgdl);
  
          // ✅ weight applied correctly
          score += qtf * weight * idf * (numerator / denominator);
        });
  
        // ✅ optional normalization
        score = score / (docLen + 1);
  
        results.push({ index: idx, score });
      });
  
      return results.sort((a, b) => b.score - a.score);
    }
  }
  
  // ===== Helper =====
  export function rankDocuments(
    docs: BM25Doc[],
    query: string
  ): RankedDoc[] {
    const bm25 = new BM25();
    bm25.fit(docs);
    return bm25.score(query);
  }