import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useJobs } from "@/contexts/JobsContext";
import { semanticSearch, type SearchResponse } from "@/services/ocrApi";
import { useToast } from "@/hooks/use-toast";
import AssistantSidebar from "@/components/assistant/AssistantSidebar";
import AssistantChatPanel from "@/components/assistant/AssistantChatPanel";

export default function AssistantPage() {
  const { jobs } = useJobs();
  const { toast } = useToast();

  const completedJobs = jobs.filter((j) => j.status === "completed");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Chat state
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<
    { id: number; query: string; result: SearchResponse }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [useLlm, setUseLlm] = useState(true);
  const [topK, setTopK] = useState(5);

  useEffect(() => {
    if (!selectedJobId && completedJobs.length > 0) {
      setSelectedJobId(completedJobs[0].job_id);
    }
  }, [completedJobs, selectedJobId]);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed || !selectedJobId) return;
    setSearching(true);
    try {
      const res = await semanticSearch({ query: trimmed, jobId: selectedJobId, topK, useLlm });
      setHistory((prev) => [...prev, { id: Date.now(), query: trimmed, result: res }]);
      setQuery("");
    } catch (e: any) {
      toast({ title: "Search failed", description: e.message, variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const handleClear = () => setHistory([]);

  return (
    <AppLayout title="AI Chat">
      <div className="flex gap-6 max-w-[1400px] mx-auto h-[calc(100vh-8rem)]">
        <AssistantSidebar 
          completedJobs={completedJobs} 
          selectedJobId={selectedJobId} 
          onSelectJob={setSelectedJobId} 
        />

        <AssistantChatPanel
          selectedJobId={selectedJobId}
          history={history}
          searching={searching}
          query={query}
          setQuery={setQuery}
          useLlm={useLlm}
          setUseLlm={setUseLlm}
          topK={topK}
          setTopK={setTopK}
          onSearch={handleSearch}
          onClear={handleClear}
        />
      </div>
    </AppLayout>
  );
}
