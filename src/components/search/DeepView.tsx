import { Search, FileDown, Printer, Sparkles, Loader2, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadTextAsPdf, printTextDocument } from "@/lib/documentExport";
import { type SearchMatch, type OcrResult } from "@/services/ocrApi";
import { getRawSnippet, pickSnippet } from "@/lib/searchUtils";
import HighlightedText from "./HighlightedText";
import DocumentContentViewer from "./DocumentContentViewer";

interface DocumentGroup {
  docId: string;
  filename: string;
  bestScore: number;
  filenameMatched: boolean;
  passages: SearchMatch[];
}

interface DeepViewProps {
  query: string;
  activeQuery: string;
  selectedDoc: DocumentGroup;
  selectedDocResult: OcrResult | null;
  selectedDocLoading: boolean;
  selectedDocError: string | null;
  localSearchQuery: string;
  setLocalSearchQuery: (val: string) => void;
  passagesToDisplay: SearchMatch[];
  activePassage: string | null;
  handlePassageClick: (passageText: string) => void;
}

export default function DeepView({
  query,
  activeQuery,
  selectedDoc,
  selectedDocResult,
  selectedDocLoading,
  selectedDocError,
  localSearchQuery,
  setLocalSearchQuery,
  passagesToDisplay,
  activePassage,
  handlePassageClick,
}: DeepViewProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="border-t border-border pt-12 pb-24">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
          <div className="flex-1 min-w-0 w-full">
            <Badge className="mb-2 uppercase tracking-widest text-[10px]">Deep View</Badge>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight truncate w-full" title={selectedDoc.filename}>
              <HighlightedText text={selectedDoc.filename} query={query} />
            </h3>
          </div>

          <div className="w-full xl:w-96 relative shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              placeholder="Local search (use + for range)"
              className="pl-11 rounded-2xl bg-muted/30 border-primary/20 h-[46px] shadow-sm focus-visible:ring-primary/40 focus-visible:bg-background w-full"
            />
          </div>

          <div className="flex gap-3 shrink-0 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full gap-2 border-border shrink-0"
              onClick={() => downloadTextAsPdf(selectedDoc.filename, selectedDocResult?.text || "")}
              disabled={!selectedDocResult?.text}
            >
              <FileDown className="h-4 w-4" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full gap-2 border-border"
              onClick={() => printTextDocument(selectedDoc.filename, selectedDocResult?.text || "")}
              disabled={!selectedDocResult?.text}
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-4">
            <div className="sticky top-44 space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4" />
                Relevant Passages
              </h4>
              {passagesToDisplay.length > 0 ? (
                <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                  {passagesToDisplay.map((match, idx) => (
                    <div
                      key={idx}
                      onClick={() => handlePassageClick(getRawSnippet(match.text, activeQuery, 300))}
                      className="p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group/passage"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="outline" className="text-[10px]">
                          Page {match.page || "?"}
                        </Badge>
                        <span className="text-[10px] font-bold text-primary group-hover/passage:underline">
                          Match {idx + 1}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-foreground/80 italic pointer-events-none">
                        <HighlightedText text={pickSnippet(match.text, activeQuery, 150)} query={activeQuery} />
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-border rounded-xl opacity-50">
                  <p className="text-sm italic">No specific snippets found. Browse full text below.</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="rounded-3xl border border-border bg-card shadow-2xl p-8 md:p-12 overflow-hidden relative min-h-[400px]">
              {selectedDocLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/50 backdrop-blur-sm z-10">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="font-medium animate-pulse">Loading Document Content...</p>
                </div>
              ) : selectedDocError ? (
                <div className="text-center py-20">
                  <FileText className="h-12 w-12 mx-auto text-destructive mb-4" />
                  <h4 className="text-xl font-bold mb-2">Content Unavailable</h4>
                  <p className="text-muted-foreground">{selectedDocError}</p>
                </div>
              ) : selectedDocResult?.text ? (
                <div className="prose prose-slate max-w-none prose-sm md:prose-base dark:prose-invert">
                  <div className="font-mono-ocr text-foreground/90 whitespace-pre-wrap leading-loose">
                    <DocumentContentViewer text={selectedDocResult.text} query={activeQuery} activePassage={activePassage} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground italic">No OCR content found for this file.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
