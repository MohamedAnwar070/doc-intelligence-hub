import { useState, type ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar collapsed={collapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-200 ${collapsed ? "ml-16" : "ml-60"}`}>
        <Topbar title={title} onToggleSidebar={() => setCollapsed(!collapsed)} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
