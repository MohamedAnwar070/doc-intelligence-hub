import { useState, useEffect, useRef } from "react";
import { checkHealth, type HealthResponse } from "@/services/ocrApi";

type HealthState = "connected" | "degraded" | "offline";

export function useHealth(interval = 15000) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [state, setState] = useState<HealthState>("offline");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const data = await checkHealth();
        setHealth(data);
        setState(data.status === "healthy" ? "connected" : "degraded");
      } catch {
        setState("offline");
        setHealth(null);
      }
    };

    check();
    timerRef.current = setInterval(check, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [interval]);

  return { health, state };
}
