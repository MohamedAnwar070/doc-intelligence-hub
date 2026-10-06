import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { getServerInfo } from "@/services/ocrApi";
import { useHealth } from "@/hooks/useHealth";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { health, state } = useHealth();
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getServerInfo()
      .then(setServerInfo)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8001";

  const items = [
    { label: "Backend URL", value: baseUrl },
    { label: "OCR Engine", value: health?.ocr_engine || "—" },
    { label: "Service", value: serverInfo?.service || "—" },
    { label: "Version", value: serverInfo?.version || "—" },
    { label: "Status", value: state, badge: true },
  ];

  return (
    <AppLayout title="Settings">
      <div className="max-w-xl mx-auto mt-4">
        <h2 className="text-xl font-semibold text-foreground mb-1">Configuration</h2>
        <p className="text-sm text-muted-foreground mb-6">Backend connection details. Read-only.</p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 text-primary animate-spin" /></div>
        ) : (
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {items.map((item) => (
              <div key={item.label} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                {item.badge ? (
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    state === "connected" ? "bg-success/15 text-success" :
                    state === "degraded" ? "bg-warning/15 text-warning" :
                    "bg-destructive/15 text-destructive"
                  }`}>
                    {state}
                  </span>
                ) : (
                  <span className="text-sm font-mono text-foreground">{item.value}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
