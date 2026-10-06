import { type JobStatus } from "@/services/ocrApi";

interface AssistantSidebarProps {
  completedJobs: JobStatus[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
}

export default function AssistantSidebar({
  completedJobs,
  selectedJobId,
  onSelectJob,
}: AssistantSidebarProps) {
  return (
    <div className="w-[260px] shrink-0 flex flex-col">
      <h2 className="text-sm font-semibold text-foreground mb-3">Documents</h2>
      <div className="flex-1 overflow-auto space-y-2 pr-2">
        {completedJobs.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No completed jobs yet. Process a PDF first on the Upload page.
          </p>
        ) : (
          completedJobs.map((job) => {
            const isActive = job.job_id === selectedJobId;
            return (
              <button
                key={job.job_id}
                onClick={() => onSelectJob(job.job_id)}
                className={`w-full text-left rounded-md border px-3 py-2 text-xs transition-colors ${
                  isActive
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card hover:border-muted-foreground/70"
                }`}
              >
                <div className="truncate font-medium text-[13px]">{job.pdf_filename}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {job.processed_pages}/{job.total_pages} pages · {job.engine}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
