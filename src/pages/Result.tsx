import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  getResult,
  updateResult,
  getSourcePdfUrl,
  semanticSearch,
  type OcrResult,
  type SearchResponse,
} from "@/services/ocrApi";
import {
  Copy,
  Download,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  SendHorizonal,
  Trash2,
  X,
  MessageSquare,
  Pencil,
  Save,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { downloadTextAsPdf, printTextDocument } from "@/lib/documentExport";

export default function ResultPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [result, setResult] = useState<OcrResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    getResult(jobId)
      .then((r) => {
        setResult(r);
        setEditText(r.text);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleCopy = () => {
    const text = editMode ? editText : result?.text;
    if (text) {
      navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard" });
    }
  };

  const handlePdfDownload = async () => {
    const text = editMode ? editText : result?.text;
    if (!text || !jobId) return;
    try {
      await downloadTextAsPdf(`ocr_result_${jobId}`, text);
    } catch (e: unknown) {
      toast({
        title: "PDF export failed",
        description: e instanceof Error ? e.message : "Could not create PDF.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    const text = editMode ? editText : result?.text;
    if (!text || !jobId) return;
    try {
      printTextDocument(`ocr_result_${jobId}`, text);
    } catch (e: unknown) {
      toast({
        title: "Print failed",
        description:
          e instanceof Error ? e.message : "Could not open print preview.",
        variant: "destructive",
      });
    }
  };

  const handleEditStart = () => {
    setEditText(result?.text ?? "");
    setEditMode(true);
  };

  const handleEditCancel = () => {
    setEditText(result?.text ?? "");
    setEditMode(false);
  };

  const handleSave = async () => {
    if (!jobId) return;
    setSaving(true);
    try {
      await updateResult(jobId, editText);
      // Update local state so subsequent reads reflect the edit
      setResult((prev) => prev ? { ...prev, text: editText } : prev);
      setEditMode(false);
      toast({ title: "Changes saved" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Result">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Result">
        <div className="max-w-xl mx-auto text-center py-20">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      </AppLayout>
    );
  }

  // #toolbar=0 hides the browser's built-in PDF viewer toolbar
  const pdfUrl = jobId ? `${getSourcePdfUrl(jobId)}#toolbar=0` : "";

  return (
    <AppLayout title="Result">
      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-2 gap-4 h-[calc(100vh-8rem)]">

        {/* ══ COL 1 — Converted OCR Text ══ */}
        <div className="flex flex-col min-h-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-2 h-8 shrink-0">
            <span className="text-xs text-muted-foreground">
              {result?.processed_pages}/{result?.total_pages} pages processed
            </span>

            <div className="flex items-center gap-1">
              {/* Edit / Save / Cancel */}
              {!editMode ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditStart}
                  className="h-7 text-xs gap-1 px-2 text-primary hover:text-primary"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditCancel}
                    disabled={saving}
                    className="h-7 text-xs gap-1 px-2 text-muted-foreground"
                  >
                    <XCircle className="h-3 w-3" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="h-7 text-xs gap-1 px-2"
                  >
                    {saving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    Save
                  </Button>
                </>
              )}

              <div className="w-px h-4 bg-border mx-0.5" />

              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 text-xs gap-1 px-2"
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePdfDownload}
                className="h-7 text-xs gap-1 px-2"
              >
                <Download className="h-3 w-3" />
                PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrint}
                className="h-7 text-xs gap-1 px-2"
              >
                <Download className="h-3 w-3" />
                Print
              </Button>
            </div>
          </div>

          {/* Content: read view or editor */}
          <div className="flex-1 min-h-0 bg-card border border-border rounded-xl overflow-hidden relative">
            {editMode ? (
              <>
                {/* Edit mode banner */}
                <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 border-b border-primary/20 shrink-0">
                  <Pencil className="h-3 w-3 text-primary" />
                  <span className="text-[11px] text-primary font-medium">
                    Editing — compare with the original PDF on the right
                  </span>
                </div>
                <textarea
                  id="ocr-edit-textarea"
                  className="w-full h-[calc(100%-32px)] resize-none bg-transparent font-mono-ocr text-foreground p-5 outline-none focus:outline-none"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  spellCheck={false}
                  autoFocus
                />
              </>
            ) : (
              <div className="h-full overflow-auto p-5">
                <pre className="font-mono-ocr text-foreground whitespace-pre-wrap break-words">
                  {result?.text || "No text extracted."}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* ══ COL 2 — Original PDF Viewer (no toolbar) ══ */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center mb-2 h-8 shrink-0">
            <span className="text-xs text-muted-foreground font-medium">
              Original Document
            </span>
          </div>
          <div className="flex-1 min-h-0 bg-card border border-border rounded-xl overflow-hidden">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                title="Original PDF"
                className="w-full h-full border-0"
                style={{ display: "block" }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No PDF available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Floating AI Assistant bubble ── */}
      {jobId && <AiAssistantBubble jobId={jobId} />}
    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating AI Assistant
// ─────────────────────────────────────────────────────────────────────────────
function AiAssistantBubble({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<
    { id: number; query: string; result: SearchResponse }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [useLlm, setUseLlm] = useState(true);
  const [topK, setTopK] = useState(5);
  const { toast } = useToast();
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, searching, open]);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearching(true);
    try {
      const res = await semanticSearch({ query: trimmed, jobId, topK, useLlm });
      setHistory((prev) => [
        ...prev,
        { id: Date.now(), query: trimmed, result: res },
      ]);
      setQuery("");
    } catch (e: any) {
      toast({ title: "Search failed", description: e.message, variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      {/* Expanded chat panel */}
      {open && (
        <div
          className="fixed bottom-20 right-6 z-50 flex flex-col rounded-2xl shadow-2xl border border-border overflow-hidden"
          style={{
            width: 380,
            height: 520,
            background: "hsl(var(--card))",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0"
            style={{ background: "hsl(var(--elevated))" }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">AI Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors p-1"
                  title="Clear chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-auto p-3 space-y-3">
            {history.length === 0 && !searching && (
              <div className="h-full flex flex-col items-center justify-center text-center px-6 py-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ask a question about this document to see answers here.
                </p>
              </div>
            )}

            {history.map((turn) => (
              <ChatTurn key={turn.id} turn={turn} />
            ))}

            {searching && (
              <div className="flex justify-start">
                <div className="border border-border rounded-xl px-3 py-2.5 flex items-center gap-2"
                  style={{ background: "hsl(var(--elevated))" }}>
                  <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                  <p className="text-xs text-muted-foreground">Thinking…</p>
                </div>
              </div>
            )}

            <div ref={historyEndRef} />
          </div>

          {/* Options */}
          <div className="border-t border-border px-3 py-2 flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-1.5">
              <Switch
                id="bubble-llm"
                checked={useLlm}
                onCheckedChange={setUseLlm}
                className="scale-75 origin-left"
              />
              <Label htmlFor="bubble-llm" className="text-[11px] text-muted-foreground cursor-pointer">
                Use LLM
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-[11px] text-muted-foreground">Top K:</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="w-12 h-6 text-xs bg-background px-2"
              />
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-border px-3 py-2.5 flex gap-2 shrink-0">
            <Input
              id="ai-bubble-input"
              placeholder="Ask a question about this document…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="text-xs bg-background flex-1"
              autoFocus={open}
            />
            <Button
              id="ai-bubble-send"
              onClick={handleSearch}
              disabled={searching || !query.trim()}
              size="sm"
              className="shrink-0 h-9 w-9 p-0"
            >
              {searching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <SendHorizonal className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        id="ai-assistant-fab"
        onClick={() => setOpen((v) => !v)}
        title="AI Assistant"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 bg-primary text-primary-foreground"
        style={{ boxShadow: "0 0 24px -4px hsl(var(--primary) / 0.5)" }}
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        {!open && history.length > 0 && (
          <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-cyan-400 border-2 border-background" />
        )}
      </button>
    </>
  );
}

// ─── Chat turn ────────────────────────────────────────────────────────────────
function ChatTurn({
  turn,
}: {
  turn: { id: number; query: string; result: SearchResponse };
}) {
  const { query, result } = turn;
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-3 py-2 text-xs shadow-sm">
          {query}
        </div>
      </div>
      <div className="space-y-1.5">
        {result.answer && (
          <div className="rounded-2xl rounded-tl-sm border border-primary/20 px-3 py-2.5 text-xs text-foreground shadow-sm"
            style={{ background: "hsl(var(--elevated))" }}>
            <p className="text-[10px] font-semibold text-primary mb-1.5 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Answer
            </p>
            <p className="leading-relaxed">{result.answer}</p>
          </div>
        )}
        {result.matches.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide px-0.5">
              Sources
            </p>
            {result.matches.map((m, i) => (
              <SourceChunk key={`${turn.id}-${i}`} match={m} index={i} />
            ))}
          </div>
        )}
        {result.matches.length === 0 && !result.answer && (
          <p className="text-[11px] text-muted-foreground px-1">
            No answer found in the document.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Source chunk ─────────────────────────────────────────────────────────────
function SourceChunk({
  match,
}: {
  match: { score: number; text: string; chunk_id: number };
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = match.text.length > 200;
  return (
    <div className="bg-card border border-border rounded-lg p-2.5 hover:border-muted-foreground/30 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground font-medium">
          Chunk #{match.chunk_id}
        </span>
        <span className="text-[10px] text-primary font-mono">
          {(match.score * 100).toFixed(1)}%
        </span>
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
            <><ChevronUp className="h-3 w-3" />Less</>
          ) : (
            <><ChevronDown className="h-3 w-3" />More</>
          )}
        </button>
      )}
    </div>
  );
}
