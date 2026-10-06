import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  FileCheck, 
  Sparkles, 
  LogOut, 
  LayoutDashboard, 
  Search, 
  ShieldCheck, 
  Sun,
  Moon,
  LogIn
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isSearchActive = location.pathname === "/search";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border h-16 flex items-center px-6 justify-between animate-in fade-in duration-500">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2 group transition-transform hover:scale-[1.02]">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
            <FileCheck className="text-primary-foreground h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">AI<span className="text-primary">DOC</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link to="/">
            <Button variant="ghost" size="sm" className={`rounded-full px-4 ${location.pathname === '/' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
              Browse
            </Button>
          </Link>
          {/* <Link to="/search">
            <Button variant="ghost" size="sm" className={`rounded-full px-4 ${isSearchActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
              AI Search
            </Button>
          </Link> */}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* AI Search Quick Shortcut (Desktop/Mobile) */}
        {!isSearchActive && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-primary/10 hover:text-primary transition-all relative group h-9 w-9"
            onClick={() => navigate("/search")}
          >
            <Sparkles className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          </Button>
        )}

        {/* Theme Toggle */}
        <button
          id="theme-toggle"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="relative h-9 w-9 rounded-full flex items-center justify-center border border-border bg-background hover:bg-primary/10 hover:border-primary/40 hover:text-primary text-foreground transition-all duration-200 shadow-sm"
        >
          {/* Sun — visible in dark mode (click → go light) */}
          <Sun
            className="absolute h-[18px] w-[18px] transition-all duration-300"
            style={{
              opacity: isDark ? 1 : 0,
              transform: isDark ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.5)",
            }}
          />
          {/* Moon — visible in light mode (click → go dark) */}
          <Moon
            className="absolute h-[18px] w-[18px] transition-all duration-300"
            style={{
              opacity: isDark ? 0 : 1,
              transform: isDark ? "rotate(90deg) scale(0.5)" : "rotate(0deg) scale(1)",
            }}
          />
        </button>

        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-offset-background transition-all hover:ring-2 hover:ring-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                <Avatar className="h-9 w-9 border border-border/50">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} alt={user?.username} />
                  <AvatarFallback className={isAdmin ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"}>
                    {user?.username?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isAdmin && (
                  <div className="absolute -bottom-0.5 -right-0.5 bg-amber-500 border-2 border-background rounded-full p-0.5 shadow-sm">
                    <ShieldCheck className="h-2 w-2 text-white" />
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium leading-none">{user?.username}</p>
                    {isAdmin && (
                      <Badge variant="outline" className="text-[10px] py-0 h-4 bg-amber-50 text-amber-700 border-amber-200">
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/")} className="cursor-pointer">
                <Search className="mr-2 h-4 w-4" />
                <span>Browse Documents</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/search")} className="cursor-pointer">
                <Sparkles className="mr-2 h-4 w-4" />
                <span>AI Deep Search</span>
              </DropdownMenuItem>
              
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer text-primary font-medium">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => logout()} 
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
             <Button 
               variant="ghost" 
               size="sm" 
               className="rounded-full text-muted-foreground hover:text-foreground hidden sm:flex"
               onClick={() => navigate("/login")}
             >
               Sign In
             </Button>
             <Button 
               size="sm" 
               className="rounded-full px-5 shadow-lg shadow-primary/20"
               onClick={() => navigate("/login")}
             >
               <LogIn className="mr-2 h-4 w-4" />
               Get Started
             </Button>
          </div>
        )}
      </div>
    </header>
  );
}
