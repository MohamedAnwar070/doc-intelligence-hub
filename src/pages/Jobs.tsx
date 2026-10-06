import { useEffect, useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useJobs } from "@/contexts/JobsContext";
import { getStatus, cancelJob, deleteJob, resumeJob, type JobStatus } from "@/services/ocrApi";
import { useNavigate } from "react-router-dom";
import { Eye, XCircle, Trash2, RotateCcw, Clock, FileText, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const TABS = ["all", "running", "completed", "failed", "cancelled"] as const;
type Tab = typeof TABS[number];

const statusStyles: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  running: "bg-primary/15 text-primary",
  completed: "bg-success/15 text-success",
  failed: "bg-destructive/15 text-destructive",
  cancelled: "bg-warning/15 text-warning",
};

export default function JobsPage() {
  const { jobs, setJobs, updateJob, removeJob } = useJobs();
  const [tab, setTab] = useState<Tab>("all");
  const navigate = useNavigate();
  const { toast } = useToast();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll running/pending jobs
  useEffect(() => {
    const poll = async () => {
      const active = jobs.filter((j) => j.status === "running" || j.status === "pending");
      for (const j of active) {
        try {
          const data = await getStatus(j.job_id);
          updateJob(j.job_id, data);
        } catch {}
      }
    };

    pollRef.current = setInterval(poll, 10000); // Poll every 10 seconds
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [jobs, updateJob]);

  const filtered = tab === "all" ? jobs : jobs.filter((j) => j.status === tab);

  const handleCancel = async (id: string) => {
    try { await cancelJob(id); updateJob(id, { status: "cancelled" }); toast({ title: "Job cancelled" }); } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };
  const handleDelete = async (id: string) => {
    try { await deleteJob(id); removeJob(id); toast({ title: "Job deleted" }); } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };
  const handleResume = async (id: string) => {
    try { await resumeJob(id); updateJob(id, { status: "running" }); toast({ title: "Job resumed" }); } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  return (
    <AppLayout title="Jobs">
      <div className="max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-2.5 text-sm capitalize transition-colors duration-150 ${
                tab === t ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
              {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-slide-underline" />}
            </button>
          ))}
        </div>

        {/* Job list */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No jobs found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((job) => (
              <JobCard
                key={job.job_id}
                job={job}
                onView={() => navigate(`/jobs/${job.job_id}/result`)}
                onCancel={() => handleCancel(job.job_id)}
                onDelete={() => handleDelete(job.job_id)}
                onResume={() => handleResume(job.job_id)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function JobCard({ job, onView, onCancel, onDelete, onResume }: {
  job: JobStatus;
  onView: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onResume: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 hover:border-muted-foreground/30 transition-all duration-150 hover:-translate-y-[1px] hover:shadow-md hover:shadow-background/50 group">
      {/* Status strip */}
      <div className={`w-1.5 h-12 rounded-full shrink-0 ${
        job.status === "running" ? "bg-primary animate-pulse-slow" :
        job.status === "completed" ? "bg-success" :
        job.status === "failed" ? "bg-destructive" :
        job.status === "cancelled" ? "bg-warning" : "bg-muted-foreground"
      }`} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-foreground truncate">{job.pdf_filename}</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${statusStyles[job.status]}`}>
            {job.status}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{job.processed_pages}/{job.total_pages} pages</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.time_taken || "—"}</span>
          <span className="flex items-center gap-1"><Cpu className="h-3 w-3" />{job.engine}</span>
        </div>

        {/* Progress bar for running */}
        {job.status === "running" && (
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${job.percentage}%` }}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {job.status === "completed" && (
          <Button variant="ghost" size="sm" onClick={onView} className="h-8 px-2.5 text-xs"><Eye className="h-3.5 w-3.5 mr-1" />View</Button>
        )}
        {job.status === "running" && (
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 px-2.5 text-xs text-warning"><XCircle className="h-3.5 w-3.5 mr-1" />Cancel</Button>
        )}
        {(job.status === "failed" || job.status === "cancelled") && (
          <Button variant="ghost" size="sm" onClick={onResume} className="h-8 px-2.5 text-xs"><RotateCcw className="h-3.5 w-3.5 mr-1" />Retry</Button>
        )}
        <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 px-2.5 text-xs text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}
