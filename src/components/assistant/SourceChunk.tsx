import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface SourceChunkProps {
  match: { score: number; text: string; chunk_id: number };
  index: number;
}

export default function SourceChunk({ match, index }: SourceChunkProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = match.text.length > 200;

  return (
    <div className="bg-card border border-border rounded-lg p-3 hover:border-muted-foreground/30 transition-colors duration-150">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-muted-foreground font-medium">Chunk #{match.chunk_id}</span>
        <span className="text-[10px] text-primary font-mono">{(match.score * 100).toFixed(1)}%</span>
      </div>
      <p className="text-xs text-secondary-foreground leading-relaxed">
        {isLong && !expanded ? match.text.slice(0, 200) + "…" : match.text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-primary mt-1 flex items-center gap-0.5 hover:underline"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              More
            </>
          )}
        </button>
      )}
    </div>
  );
}
