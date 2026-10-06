import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { type JobStatus, getStatus, getJobs } from "@/services/ocrApi";

interface JobsContextType {
  jobs: JobStatus[];
  addJob: (job: JobStatus) => void;
  updateJob: (jobId: string, update: Partial<JobStatus>) => void;
  removeJob: (jobId: string) => void;
  refreshJob: (jobId: string) => Promise<void>;
  setJobs: React.Dispatch<React.SetStateAction<JobStatus[]>>;
}

const JobsContext = createContext<JobsContextType | null>(null);

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<JobStatus[]>([]);

  // Hydrate jobs list from backend on first load so jobs
  // survive refreshes and server restarts.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const serverJobs = await getJobs();
        if (!cancelled) {
          setJobs(serverJobs);
        }
      } catch {
        // ignore; UI can still work with empty list
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const addJob = useCallback((job: JobStatus) => {
    setJobs((prev) => [job, ...prev.filter((j) => j.job_id !== job.job_id)]);
  }, []);

  const updateJob = useCallback((jobId: string, update: Partial<JobStatus>) => {
    setJobs((prev) => prev.map((j) => (j.job_id === jobId ? { ...j, ...update } : j)));
  }, []);

  const removeJob = useCallback((jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.job_id !== jobId));
  }, []);

  const refreshJob = useCallback(async (jobId: string) => {
    try {
      const data = await getStatus(jobId);
      updateJob(jobId, data);
    } catch {
      // silently fail
    }
  }, [updateJob]);

  return (
    <JobsContext.Provider value={{ jobs, addJob, updateJob, removeJob, refreshJob, setJobs }}>
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error("useJobs must be used within JobsProvider");
  return ctx;
}
