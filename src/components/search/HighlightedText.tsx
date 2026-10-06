import { getQueryTerms, escapeRegExp } from "@/lib/searchUtils";

export default function HighlightedText({ text, query }: { text: string; query: string }) {
  const terms = getQueryTerms(query);

  if (terms.length === 0) {
    return <>{text}</>;
  }

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) => {
        const matched = terms.some((term) => term === part.toLowerCase());
        return matched ? (
          <mark key={`${part}-${index}`} className="rounded bg-primary/20 px-0.5 text-foreground">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        );
      })}
    </>
  );
}
