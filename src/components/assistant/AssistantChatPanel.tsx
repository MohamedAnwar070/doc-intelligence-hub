import { Sparkles, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { type SearchResponse } from "@/services/ocrApi";
import ChatTurn from "./ChatTurn";

interface ChatTurnData {
  id: number;
  query: string;
  result: SearchResponse;
}

interface AssistantChatPanelProps {
  selectedJobId: string | null;
  history: ChatTurnData[];
  searching: boolean;
  query: string;
  setQuery: (val: string) => void;
  useLlm: boolean;
  setUseLlm: (val: boolean) => void;
  topK: number;
  setTopK: (val: number) => void;
  onSearch: () => void;
  onClear: () => void;
}

export default function AssistantChatPanel({
  selectedJobId,
  history,
  searching,
  query,
  setQuery,
  useLlm,
  setUseLlm,
  topK,
  setTopK,
  onSearch,
  onClear,
}: AssistantChatPanelProps) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Document AI Assistant</h3>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* Search input */}
      <div className="flex gap-2 mb-3">
        <Input
          placeholder={
            selectedJobId
              ? "Ask a question about the selected document…"
              : "Select a completed document to start chatting…"
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          className="text-sm bg-card"
          disabled={!selectedJobId}
        />
        <Button
          onClick={onSearch}
          disabled={searching || !query.trim() || !selectedJobId}
          size="sm"
          className="shrink-0"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {/* Options */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <Switch id="assistant-llm" checked={useLlm} onCheckedChange={setUseLlm} className="scale-75" />
          <Label htmlFor="assistant-llm" className="text-xs text-muted-foreground cursor-pointer">
            Use LLM
          </Label>
        </div>
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground">Top K:</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="w-14 h-7 text-xs bg-card"
          />
        </div>
      </div>

      {/* Chat history */}
      <div className="flex-1 overflow-auto space-y-3">
        {!selectedJobId && (
          <p className="text-xs text-muted-foreground text-center py-6">
            Select a completed document on the left to start chatting.
          </p>
        )}

        {selectedJobId && history.length === 0 && !searching && (
          <p className="text-xs text-muted-foreground text-center py-6">
            Ask a question about the selected document to see answers here.
          </p>
        )}

        {history.map((turn) => (
          <ChatTurn key={turn.id} turn={turn} />
        ))}

        {searching && (
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <Loader2 className="h-5 w-5 mx-auto text-primary animate-spin mb-2" />
            <p className="text-xs text-muted-foreground">Thinking…</p>
          </div>
        )}
      </div>
    </div>
  );
}
