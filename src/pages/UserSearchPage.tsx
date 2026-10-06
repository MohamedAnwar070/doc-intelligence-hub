import { useEffect, useMemo, useState } from "react";
import { Search, Loader2, Sparkles, FolderSearch } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  semanticSearch,
  getJobs,
  getResult,
  searchSuggestions,
  type SearchMatch,
  type SearchSuggestion,
  type JobStatus,
  type OcrResult,
} from "@/services/ocrApi";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { getQueryTerms } from "@/lib/searchUtils";

import SearchForm from "@/components/search/SearchForm";
import DocumentGrid from "@/components/search/DocumentGrid";
import DeepView from "@/components/search/DeepView";

type DocumentGroup = {
  docId: string;
  filename: string;
  bestScore: number;
  filenameMatched: boolean;
  passages: SearchMatch[];
};

type ResultCache = Record<string, OcrResult>;

export default function UserSearchPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [allJobs, setAllJobs] = useState<JobStatus[]>([]);
  const [scope, setScope] = useState<string>("all");
  const [searched, setSearched] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [resultCache, setResultCache] = useState<ResultCache>({});
  const [selectedDocLoading, setSelectedDocLoading] = useState(false);
  const [selectedDocError, setSelectedDocError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activePassage, setActivePassage] = useState<string | null>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState("");

  const handlePassageClick = (passageText: string) => {
    setActivePassage(passageText);
    
    // Poll for the element instead of a single timeout 
    // because rendering a massive document can take >50ms
    let attempts = 0;
    const scrollInterval = window.setInterval(() => {
      const el = document.querySelector(".active-passage-highlight");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        window.clearInterval(scrollInterval);
      }
      attempts++;
      if (attempts > 20) window.clearInterval(scrollInterval); // Max 2 seconds
    }, 100);

    setTimeout(() => {
      setActivePassage((prev) => (prev === passageText ? null : prev));
    }, 2500);
  };

  const shouldShowAnswer = useMemo(() => {
    if (!answer) return false;
    const normalized = answer.toLowerCase();
    return !normalized.includes("based on the provided sources") && !normalized.includes("the document's domain");
  }, [answer]);

  const loadJobs = async (silent = false) => {
    if (!silent) setJobsLoading(true);

    try {
      const jobs = await getJobs();
      setAllJobs(jobs);
    } catch (err: unknown) {
      toast({
        title: "Could not load documents",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    void loadJobs();
    const interval = window.setInterval(() => {
      void loadJobs(true);
    }, 20000);
    return () => window.clearInterval(interval);
  }, []);

  const completedJobs = useMemo(() => allJobs.filter((job) => job.status === "completed"), [allJobs]);

  const searchableJobs = useMemo(
    () => (scope === "all" ? completedJobs : completedJobs.filter((job) => job.job_id === scope)),
    [completedJobs, scope],
  );

  const documentGroups = useMemo(() => {
    const queryTerms = getQueryTerms(query);
    const groups = new Map<string, DocumentGroup>();

    for (const match of results) {
      const job = completedJobs.find((item) => item.job_id === match.doc_id);
      const filename = job?.pdf_filename || match.doc_id;
      const existing = groups.get(match.doc_id);
      const filenameMatched = queryTerms.some((term) => filename.toLowerCase().includes(term));

      if (existing) {
        existing.passages.push(match);
        existing.bestScore = Math.max(existing.bestScore, match.score);
        existing.filenameMatched = existing.filenameMatched || filenameMatched;
      } else {
        groups.set(match.doc_id, {
          docId: match.doc_id,
          filename,
          bestScore: match.score,
          filenameMatched,
          passages: [match],
        });
      }
    }

    for (const job of searchableJobs) {
      const filenameMatched = queryTerms.length > 0 && queryTerms.some((term) => job.pdf_filename.toLowerCase().includes(term));
      if (!filenameMatched) continue;

      const existing = groups.get(job.job_id);
      if (existing) {
        existing.filenameMatched = true;
      } else {
        groups.set(job.job_id, {
          docId: job.job_id,
          filename: job.pdf_filename,
          bestScore: 0,
          filenameMatched: true,
          passages: [],
        });
      }
    }

    return Array.from(groups.values()).sort((a, b) => {
      const scoreA = a.bestScore + (a.filenameMatched ? 0.2 : 0);
      const scoreB = b.bestScore + (b.filenameMatched ? 0.2 : 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.filename.localeCompare(b.filename);
    });
  }, [completedJobs, query, results, searchableJobs]);

  const selectedDoc = useMemo(
    () => documentGroups.find((group) => group.docId === selectedDocId) ?? documentGroups[0] ?? null,
    [documentGroups, selectedDocId],
  );

  const selectedDocResult = selectedDoc ? resultCache[selectedDoc.docId] ?? null : null;

  useEffect(() => {
    if (!selectedDocId && documentGroups.length > 0) {
      setSelectedDocId(documentGroups[0].docId);
      return;
    }

    if (selectedDocId && !documentGroups.some((group) => group.docId === selectedDocId)) {
      setSelectedDocId(documentGroups[0]?.docId ?? null);
    }
  }, [documentGroups, selectedDocId]);

  useEffect(() => {
    if (!selectedDoc) {
      setSelectedDocLoading(false);
      setSelectedDocError(null);
      return;
    }

    if (resultCache[selectedDoc.docId]) {
      setSelectedDocLoading(false);
      setSelectedDocError(null);
      return;
    }

    let cancelled = false;

    const loadSelectedDoc = async () => {
      setSelectedDocLoading(true);
      setSelectedDocError(null);
      try {
        const result = await getResult(selectedDoc.docId);
        if (!cancelled) {
          setResultCache((prev) => ({ ...prev, [selectedDoc.docId]: result }));
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setSelectedDocError(err instanceof Error ? err.message : "Could not load document");
        }
      } finally {
        if (!cancelled) {
          setSelectedDocLoading(false);
        }
      }
    };

    void loadSelectedDoc();

    return () => {
      cancelled = true;
    };
  }, [resultCache, selectedDoc]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || !showSuggestions) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const next = await searchSuggestions({
          query: trimmed,
          jobId: scope === "all" ? undefined : scope,
          limit: 5,
        });
        if (!cancelled) setSuggestions(next);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSuggestionsLoading(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, scope, showSuggestions]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    if (completedJobs.length === 0) {
      toast({
        title: "No searchable documents",
        description: "Ask an admin to finish processing at least one PDF first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSearched(true);
    setShowSuggestions(false);
    setSelectedDocId(null);
    setSelectedDocError(null);
    setSuggestions([]);
    setLocalSearchQuery("");

    try {
      const res = await semanticSearch({
        query,
        jobId: scope === "all" ? undefined : scope,
        topK: 12,
        useLlm: true,
      });
      setResults(res.matches);
      setAnswer(res.answer ?? null);
    } catch (err: unknown) {
      toast({
        title: "Search failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
      setResults([]);
      setAnswer(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = (suggestionText: string) => {
    setQuery(suggestionText);
    setSuggestions([]);
    setShowSuggestions(false);
    void handleSearch();
  };

  useEffect(() => {
    setLocalSearchQuery("");
  }, [selectedDocId]);

  const activeQuery = localSearchQuery.trim() || query;

  const localSearchPassages = useMemo(() => {
    if (!localSearchQuery.trim() || !selectedDocResult?.text) return null;

    const text = selectedDocResult.text;
    const lq = localSearchQuery.trim();
    let matches: SearchMatch[] = [];
    
    // "+" Operator Search logic...
    if (lq.includes("+")) {
      const parts = lq.split("+").map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const escapeRegExp = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const startTerm = escapeRegExp(parts[0]);
        const endTerm = escapeRegExp(parts[parts.length - 1]); 
        
        const startRegex = new RegExp(startTerm, 'gi');
        const endRegex = new RegExp(endTerm, 'gi');
        
        const startIndices: number[] = [];
        let sm;
        while ((sm = startRegex.exec(text)) !== null) startIndices.push(sm.index);
        
        const endIndices: number[] = [];
        let em;
        while ((em = endRegex.exec(text)) !== null) endIndices.push(em.index);
        
        let idx = 0;
        for (let i = 0; i < startIndices.length; i++) {
            const startIdx = startIndices[i];
            const nextStartIdx = (i + 1 < startIndices.length) ? startIndices[i + 1] : Infinity;
            
            const validEnd = endIndices.find(eIdx => eIdx > startIdx && eIdx < nextStartIdx && (eIdx - startIdx) <= 1500);
            
            if (validEnd) {
                let start = text.lastIndexOf("\n", startIdx);
                if (start === -1) start = Math.max(0, startIdx - 150);
                else start += 1;

                let end = text.indexOf("\n", validEnd);
                if (end === -1) end = Math.min(text.length, validEnd + 150);
                
                let context = text.slice(start, end).trim();

                if (context && !matches.some(existing => existing.text === context)) {
                    matches.push({
                        doc_id: selectedDoc?.docId || "",
                        text: context,
                        score: 1, 
                        chunk_id: idx + 1,
                        page: undefined
                    });
                    idx++;
                }
            }
        }
      }
    } else {
      const terms = getQueryTerms(lq);
      if (terms.length > 0) {
        const escapeRegExp = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regexPattern = terms.map(escapeRegExp).join('|');
        const regex = new RegExp(`(${regexPattern})`, 'gi');
        let m;
        let idx = 0;
        
        while ((m = regex.exec(text)) !== null) {
          const hitIndex = m.index;
          let start = text.lastIndexOf("\n", hitIndex);
          if (start === -1) start = Math.max(0, hitIndex - 150);
          else start += 1;

          let end = text.indexOf("\n", hitIndex);
          if (end === -1) end = Math.min(text.length, hitIndex + 150);
          
          let context = text.slice(start, end).trim();

          if (context.length < 50) {
              const start2 = text.lastIndexOf("\n", start - 2);
              const end2 = text.indexOf("\n", end + 1);
              context = text.slice(start2 > 0 ? start2 + 1 : start, end2 > 0 ? end2 : end).trim();
          }

          if (context && !matches.some(existing => existing.text === context)) {
            matches.push({
              doc_id: selectedDoc?.docId || "",
              text: context,
              score: 1,
              chunk_id: idx + 1
            });
            idx++;
          }
        }
      }
    }
    
    return matches;
  }, [localSearchQuery, selectedDocResult?.text, selectedDoc?.docId]);

  const passagesToDisplay = localSearchPassages ?? selectedDoc?.passages ?? [];

  return (
    <div className="min-h-screen bg-background flex flex-col font-inter">
      <Header />
      
      <SearchForm 
        query={query}
        setQuery={setQuery}
        scope={scope}
        setScope={setScope}
        loading={loading}
        completedJobs={completedJobs}
        suggestions={suggestions}
        suggestionsLoading={suggestionsLoading}
        showSuggestions={showSuggestions}
        setShowSuggestions={setShowSuggestions}
        onSearch={handleSearch}
        onSuggestionSelect={handleSuggestionSelect}
      />

      {!searched && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                <Search className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">AI Search Assistant</h2>
            <p className="text-muted-foreground max-w-sm">
                Type your question above to find specific answers across all categorized legal documents.
            </p>
        </div>
      )}

      {searched && (
        <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
          {shouldShowAnswer && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 mb-8 max-w-5xl shadow-sm animate-in zoom-in-95 duration-500">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-sm font-bold text-primary uppercase tracking-wider">AI Insight</span>
              </div>
              <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">{answer}</p>
            </div>
          )}

          <div className="mb-10">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FolderSearch className="h-5 w-5 text-primary" />
                Matching Sources
              </h2>
              <div className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-semibold">
                {documentGroups.length} Documents Found
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center py-20 gap-4 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="text-lg animate-pulse font-medium">Scanning millions of tokens...</span>
              </div>
            ) : (
              <DocumentGrid 
                documentGroups={documentGroups}
                selectedDocId={selectedDocId}
                setSelectedDocId={setSelectedDocId}
                query={query}
                clearSearch={() => setQuery("")}
              />
            )}
          </div>

          {selectedDoc && (
             <DeepView 
                query={query}
                activeQuery={activeQuery}
                selectedDoc={selectedDoc}
                selectedDocResult={selectedDocResult}
                selectedDocLoading={selectedDocLoading}
                selectedDocError={selectedDocError}
                localSearchQuery={localSearchQuery}
                setLocalSearchQuery={setLocalSearchQuery}
                passagesToDisplay={passagesToDisplay}
                activePassage={activePassage}
                handlePassageClick={handlePassageClick}
             />
          )}
        </div>
      )}
    </div>
  );
}
