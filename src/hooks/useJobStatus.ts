import { useState, useEffect, useRef } from "react";
import { getStatus, type JobStatus } from "@/services/ocrApi";

export function useJobStatus(jobId: string | null, interval = 2500) {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const data = await getStatus(jobId);
        setStatus(data);
        if (["completed", "failed", "cancelled"].includes(data.status)) {
          if (timerRef.current) clearInterval(timerRef.current);
        }
      } catch (e: any) {
        setError(e.message);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };

    poll();
    timerRef.current = setInterval(poll, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [jobId, interval]);

  return { status, error };
}
