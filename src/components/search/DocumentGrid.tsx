import { FolderSearch, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HighlightedText from "./HighlightedText";
import { pickSnippet } from "@/lib/searchUtils";

interface DocumentGroup {
  docId: string;
  filename: string;
  bestScore: number;
  filenameMatched: boolean;
  passages: { text: string }[];
}

interface DocumentGridProps {
  documentGroups: DocumentGroup[];
  selectedDocId: string | null;
  setSelectedDocId: (id: string | null) => void;
  query: string;
  clearSearch: () => void;
}

export default function DocumentGrid({
  documentGroups,
  selectedDocId,
  setSelectedDocId,
  query,
  clearSearch,
}: DocumentGridProps) {
  if (documentGroups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-20 text-center bg-muted/20">
        <FolderSearch className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-xl font-bold mb-2">No matching results found</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          We couldn't find any documents matching your query. Try using different keywords or broaden your search scope.
        </p>
        <Button variant="outline" className="mt-6 rounded-full" onClick={clearSearch}>
          Clear Search
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documentGroups.map((group) => (
        <button
          key={group.docId}
          onClick={() => setSelectedDocId(group.docId)}
          className={`w-full text-left rounded-2xl border p-5 transition-all duration-300 relative overflow-hidden group ${
            selectedDocId === group.docId
              ? "border-primary bg-primary/[0.03] shadow-md ring-1 ring-primary/20"
              : "border-border bg-card hover:border-primary/50 hover:shadow-xl"
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <p
                className={`text-lg font-bold truncate transition-colors ${
                  selectedDocId === group.docId ? "text-primary" : "text-foreground group-hover:text-primary"
                }`}
              >
                <HighlightedText text={group.filename} query={query} />
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {group.filenameMatched && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-medium">
                    <BadgeCheck className="h-3 w-3 mr-1" />
                    Filename Match
                  </Badge>
                )}
                <Badge variant="secondary" className="font-normal">
                  {group.passages.length} Excerpts
                </Badge>
              </div>
            </div>
            <div
              className={`text-xs font-bold px-2 py-1 rounded bg-muted ${
                selectedDocId === group.docId ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {Math.round(group.bestScore * 100)}%
            </div>
          </div>

          <div className="space-y-3 relative">
            {group.passages.slice(0, 1).map((passage, index) => (
              <p
                key={`${group.docId}-${index}`}
                className="text-sm text-muted-foreground leading-relaxed line-clamp-3 italic bg-muted/30 p-3 rounded-lg border border-border/50"
              >
                <HighlightedText text={pickSnippet(passage.text, query, 125)} query={query} />
              </p>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}
