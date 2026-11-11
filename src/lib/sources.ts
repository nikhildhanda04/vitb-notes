// Shared by the browser and the server: no Node-only imports here.

export type Source = { name: string; text: string };

// Rough sizes: ~4 chars per token. Kept under the Gemini free-tier limit of 250k input tokens/minute.
export const OUTLINE_CHAR_BUDGET = 600_000;
export const PYQ_CHAR_BUDGET = 200_000;
export const TOPIC_CHAR_BUDGET = 200_000;

const totalLength = (sources: Source[]) => sources.reduce((n, s) => n + s.text.length, 0);

// Trim every source by the same ratio so the total fits; small totals pass through untouched.
export function fitToBudget(sources: Source[], budget: number): Source[] {
  const total = totalLength(sources);
  if (total <= budget) return sources;
  const ratio = budget / total;
  return sources.map(s => ({ name: s.name, text: s.text.slice(0, Math.floor(s.text.length * ratio)) }));
}

const CHUNK_CHARS = 3000;
const STOPWORDS = new Set(["the", "and", "for", "with", "from", "that", "this", "are", "its", "into", "under", "their"]);
const words = (text: string) => (text.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []).filter(w => !STOPWORDS.has(w));

// ponytail: keyword-overlap retrieval, swap for embeddings if topics pull in the wrong passages
// Picks the passages most related to `query` until the budget is full; returns everything if it already fits.
export function relevantExcerpts(sources: Source[], query: string, budget: number): Source[] {
  if (totalLength(sources) <= budget) return sources;

  const queryWords = new Set(words(query));
  const chunks = sources.flatMap((s, si) => {
    const parts: { si: number; start: number; text: string; score: number }[] = [];
    for (let start = 0; start < s.text.length; start += CHUNK_CHARS) {
      const text = s.text.slice(start, start + CHUNK_CHARS);
      parts.push({ si, start, text, score: words(text).filter(w => queryWords.has(w)).length });
    }
    return parts;
  });

  const picked: typeof chunks = [];
  let used = 0;
  for (const c of [...chunks].sort((a, b) => b.score - a.score)) {
    if (c.score === 0 || used + c.text.length > budget) continue;
    picked.push(c);
    used += c.text.length;
  }

  return sources
    .map((s, si) => ({
      name: s.name,
      text: picked.filter(c => c.si === si).sort((a, b) => a.start - b.start).map(c => c.text).join("\n[...]\n"),
    }))
    .filter(s => s.text);
}

export const joinSources = (sources: Source[], label: string) =>
  sources.map((s, i) => `--- ${label} ${i + 1} of ${sources.length}: ${s.name} ---\n${s.text}`).join("\n\n");
