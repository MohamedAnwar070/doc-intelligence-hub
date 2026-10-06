import { Upload, List, Settings, FileText, Sparkles, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const adminNavItems = [
  { title: "Home View", url: "/", icon: FileText },
  { title: "Upload", url: "/admin", icon: Upload },
  { title: "Jobs", url: "/jobs", icon: List },
];

const secondaryNavItems = [
  { title: "AI Chat", url: "/assistant", icon: Sparkles },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar({ collapsed }: { collapsed: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Filter items based on role
  const mainItems = adminNavItems.filter(item => {
    if (item.url === "/") return true; // Everyone sees Home
    return isAdmin; // Others only for Admin
  });

  const secondaryItems = isAdmin ? secondaryNavItems : [];

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-30 flex flex-col border-r border-border bg-sidebar transition-all duration-200 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-border">
        <div className="w-6 h-6 bg-primary rounded flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold tracking-tight text-foreground">
            AI<span className="text-primary">DOC</span>
          </span>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-3 px-2 space-y-1">
        {mainItems.map((item) => {
          const isActive = location.pathname === item.url || (item.url !== "/" && location.pathname.startsWith(item.url));
          return (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/"}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150 group ${
                isActive
                  ? "bg-sidebar-accent text-primary font-medium border-l-2 border-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
              activeClassName=""
            >
              <item.icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          );
        })}

        {/* Divider - only show if there are secondary items or after main items */}
        {secondaryItems.length > 0 && <div className="h-px bg-border/70 my-3" />}

        {secondaryItems.map((item) => {
          const isActive = location.pathname.startsWith(item.url);
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150 group ${
                isActive
                  ? "bg-sidebar-accent text-primary font-medium border-l-2 border-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
              activeClassName=""
            >
              <item.icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer – user info + logout */}
      <div className="border-t border-border p-3">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user?.username}</p>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide mt-0.5 ${
                isAdmin ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"
              }`}>
                {user?.role ?? "user"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="ml-2 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            title="Logout"
            className="w-full flex justify-center p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
