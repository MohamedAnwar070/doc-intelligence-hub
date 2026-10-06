import { Sparkles } from "lucide-react";
import { type SearchResponse } from "@/services/ocrApi";
import SourceChunk from "./SourceChunk";

interface ChatTurnProps {
  turn: {
    id: number;
    query: string;
    result: SearchResponse;
  };
}

export default function ChatTurn({ turn }: ChatTurnProps) {
  const { query, result } = turn;

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs shadow-sm">
          {query}
        </div>
      </div>

      <div className="flex justify-start">
        <div className="max-w-[100%] space-y-2">
          {result.answer && (
            <div className="rounded-lg bg-elevated border border-primary/20 px-3 py-2 text-xs text-foreground shadow-sm">
              <p className="text-[10px] font-medium text-primary mb-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Answer
              </p>
              <p className="leading-relaxed">{result.answer}</p>
            </div>
          )}

          {result.matches.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sources</p>
              {result.matches.map((m, i) => (
                <SourceChunk key={`${turn.id}-${i}`} match={m} index={i} />
              ))}
            </div>
          )}

          {result.matches.length === 0 && !result.answer && (
            <p className="text-[11px] text-muted-foreground">No answer found in the document.</p>
          )}
        </div>
      </div>
    </div>
  );
}
