export function getQueryTerms(query: string): string[] {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        // Replace +, -, ", ' with space so highlighting captures pure words
        .replace(/[+\-"']/g, " ")
        .split(/\s+/)
        .map((term) => term.trim())
        .filter((term) => term.length > 1)
    )
  );
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function pickSnippet(text: string, query: string, radius = 150): string {
  const terms = getQueryTerms(query);
  if (!text) return "";
  if (terms.length === 0) return text.slice(0, radius * 2);

  const lower = text.toLowerCase();
  const hitIndices = terms
    .map((term) => lower.indexOf(term))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b);

  if (hitIndices.length === 0) {
    return text.slice(0, radius * 2);
  }

  const firstHit = hitIndices[0];
  // Calculate term length so the last hit is fully covered (roughly 10 chars average or use term length)
  const lastHitTerm = terms.find(t => lower.indexOf(t) === hitIndices[hitIndices.length - 1]) || "";
  const lastHit = hitIndices[hitIndices.length - 1] + lastHitTerm.length;

  const center = Math.floor((firstHit + lastHit) / 2);
  const gap = lastHit - firstHit;
  
  // Stretch effective radius to cover the gap if terms are far apart
  const effectiveRadius = Math.max(radius, gap / 2 + 30);

  const start = Math.max(0, center - effectiveRadius);
  const end = Math.min(text.length, center + effectiveRadius);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

export function getRawSnippet(text: string, query: string, radius = 300): string {
  const terms = getQueryTerms(query);
  if (!text) return "";
  if (terms.length === 0) return text.slice(0, radius * 2);

  const lower = text.toLowerCase();
  const hitIndices = terms
    .map((term) => lower.indexOf(term))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b);

  if (hitIndices.length === 0) {
    return text.slice(0, radius * 2);
  }

  const firstHit = hitIndices[0];
  const lastHitTerm = terms.find(t => lower.indexOf(t) === hitIndices[hitIndices.length - 1]) || "";
  const lastHit = hitIndices[hitIndices.length - 1] + lastHitTerm.length;

  const center = Math.floor((firstHit + lastHit) / 2);
  const gap = lastHit - firstHit;
  const effectiveRadius = Math.max(radius, gap / 2 + 50);

  let start = Math.max(0, center - effectiveRadius);
  let end = Math.min(text.length, center + effectiveRadius);

  // Try to logically snap to paragraph breaks (newlines) if they are close
  const prevNewline = text.lastIndexOf("\n", start);
  if (prevNewline !== -1 && start - prevNewline < 150) {
      start = prevNewline + 1;
  }
  const nextNewline = text.indexOf("\n", end);
  if (nextNewline !== -1 && nextNewline - end < 150) {
      end = nextNewline;
  }

  return text.slice(start, end).trim();
}
