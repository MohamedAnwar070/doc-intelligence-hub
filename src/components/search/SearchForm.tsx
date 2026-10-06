import { Search, Loader2, FolderSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { type JobStatus, type SearchSuggestion } from "@/services/ocrApi";

interface SearchFormProps {
  query: string;
  setQuery: (val: string) => void;
  scope: string;
  setScope: (val: string) => void;
  loading: boolean;
  completedJobs: JobStatus[];
  suggestions: SearchSuggestion[];
  suggestionsLoading: boolean;
  showSuggestions: boolean;
  setShowSuggestions: (val: boolean) => void;
  onSearch: (e?: React.FormEvent) => void;
  onSuggestionSelect: (suggestionText: string) => void;
}

export default function SearchForm({
  query,
  setQuery,
  scope,
  setScope,
  loading,
  completedJobs,
  suggestions,
  suggestionsLoading,
  showSuggestions,
  setShowSuggestions,
  onSearch,
  onSuggestionSelect,
}: SearchFormProps) {
  return (
    <div className="pt-20 pb-6 border-b border-border bg-muted/30 sticky top-0 z-40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6">
        <form onSubmit={onSearch} className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onFocus={() => query.trim().length >= 2 && setShowSuggestions(true)}
              placeholder="What are you looking for today?"
              className="w-full pl-12 pr-4 py-3 text-sm rounded-2xl border border-border bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {showSuggestions && (suggestionsLoading || suggestions.length > 0) && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-2xl border border-border bg-popover shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {suggestionsLoading ? (
                  <div className="px-6 py-4 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing knowledge base...
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.doc_id}-${index}`}
                        type="button"
                        onClick={() => onSuggestionSelect(suggestion.text)}
                        className="w-full px-6 py-4 text-left hover:bg-muted transition-colors group/item"
                      >
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <p className="text-sm font-semibold text-foreground group-hover/item:text-primary transition-colors">
                            {suggestion.filename}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            {suggestion.section_label && (
                              <Badge variant="outline" className="text-[10px] font-normal opacity-70">
                                {suggestion.section_label}
                              </Badge>
                            )}
                            {suggestion.page && (
                              <Badge variant="outline" className="text-[10px] font-normal opacity-70">
                                Page {suggestion.page}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 italic">
                          "{suggestion.text}"
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="w-full md:w-64 rounded-2xl bg-background border-border h-[46px]">
                <div className="flex items-center gap-2">
                  <FolderSearch className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Search scope" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Across all documents</SelectItem>
                {completedJobs.map((job) => (
                  <SelectItem key={job.job_id} value={job.job_id}>
                    {job.pdf_filename}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              type="submit" 
              disabled={!query.trim() || loading}
              className="rounded-2xl px-8 h-[46px] shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Search
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
