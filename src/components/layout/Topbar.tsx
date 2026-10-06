import { Menu } from "lucide-react";
import { useHealth } from "@/hooks/useHealth";

interface TopbarProps {
  title: string;
  onToggleSidebar: () => void;
}

const healthColors = {
  connected: "bg-success",
  degraded: "bg-warning",
  offline: "bg-destructive",
};

const healthLabels = {
  connected: "Connected",
  degraded: "Degraded",
  offline: "Offline",
};

export function Topbar({ title, onToggleSidebar }: TopbarProps) {
  const { state } = useHealth();

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md hover:bg-muted transition-colors duration-150"
        >
          <Menu className="h-4 w-4 text-muted-foreground" />
        </button>
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className={`h-2 w-2 rounded-full ${healthColors[state]} ${state === "connected" ? "" : "animate-pulse-slow"}`} />
        <span className="text-muted-foreground">{healthLabels[state]}</span>
      </div>
    </header>
  );
}
