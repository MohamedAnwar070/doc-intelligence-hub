import { escapeRegExp } from "@/lib/searchUtils";
import HighlightedText from "./HighlightedText";

interface DocumentContentViewerProps {
  text: string;
  query: string;
  activePassage: string | null;
}

export default function DocumentContentViewer({ text, query, activePassage }: DocumentContentViewerProps) {
  if (!activePassage) {
    return <HighlightedText text={text} query={query} />;
  }

  // 1. Extract terms carefully
  const terms = activePassage.trim().split(/\s+/).filter(Boolean).map(escapeRegExp);
  
  if (terms.length === 0) {
    return <HighlightedText text={text} query={query} />;
  }

  let passagePattern = new RegExp(`(${terms.join("\\s+")})`, "gi");
  let parts = text.split(passagePattern);

  // Fallback 1: Literal match
  if (parts.length === 1) {
    passagePattern = new RegExp(`(${escapeRegExp(activePassage)})`, "gi");
    parts = text.split(passagePattern);
  }

  // Fallback 2: Prefix match (first 8 words) - enough to locate the start of passage
  if (parts.length === 1 && terms.length > 8) {
    const prefixTerms = terms.slice(0, 8);
    passagePattern = new RegExp(`(${prefixTerms.join("\\s+")})`, "gi");
    parts = text.split(passagePattern);
  }

  // Fallback 3: Extreme prefix match (first 4 words)
  if (parts.length === 1 && terms.length > 3) {
    const prefixTerms = terms.slice(0, 4);
    passagePattern = new RegExp(`(${prefixTerms.join("\\s+")})`, "gi");
    parts = text.split(passagePattern);
  }

  if (parts.length === 1) {
    // If all fail, simply render without highlights
    return <HighlightedText text={text} query={query} />;
  }

  return (
    <>
      {parts.map((part, index) => {
        // With a regex split containing exactly one capturing group,
        // odd indices contain the matched substring.
        const isPassage = index % 2 !== 0;
        if (isPassage) {
          return (
            <span 
               key={`passage-${index}`} 
               className="active-passage-highlight bg-primary/30 ring-2 ring-primary/50 text-foreground rounded transition-all duration-300 pointer-events-none"
            >
              <HighlightedText text={part} query={query} />
            </span>
          );
        }
        return <HighlightedText key={`part-${index}`} text={part} query={query} />;
      })}
    </>
  );
}
