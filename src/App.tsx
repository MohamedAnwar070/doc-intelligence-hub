import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { JobsProvider } from "@/contexts/JobsContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Jobs from "./pages/Jobs";
import Result from "./pages/Result";
import SettingsPage from "./pages/SettingsPage";
import AssistantPage from "./pages/AssistantPage";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import UserSearchPage from "./pages/UserSearchPage";
import HomePage from "./pages/HomePage";

const queryClient = new QueryClient();

function RoleHomeRedirect() {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to="/" replace />;
}

/** Redirect to /login if not authenticated; if role mismatch, redirect to correct home */
function PrivateRoute({ children, adminOnly, userOnly }: { children: React.ReactNode; adminOnly?: boolean; userOnly?: boolean }) {
  const { isAuthenticated, isAdmin, user } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  // If specifically admin-only and user is not admin
  if (adminOnly && !isAdmin) {
    console.warn("Access denied: Admin only route.");
    return <Navigate to="/" replace />;
  }
  
  // If specifically user-only and user is admin (optional, usually admins can see user pages)
  if (userOnly && isAdmin) {
    // Admins are allowed to see user search, so we don't strictly block them unless path-specific
    // But if the user explicitly wants separation:
    // return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

/** Redirect authenticated users away from login to their home */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin" : "/"} replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      
      {/* HomePage is now PUBLIC as the default landing page */}
      <Route path="/" element={<HomePage />} />
      
      {/* Protected Routes (Require Login) */}
      <Route path="/search" element={<PrivateRoute><UserSearchPage /></PrivateRoute>} />
      <Route path="/result/:jobId" element={<PrivateRoute><Result /></PrivateRoute>} />

      {/* Role-aware home redirect helper */}
      <Route path="/home" element={<RoleHomeRedirect />} />

      {/* Admin-only routes */}
      <Route path="/admin" element={<PrivateRoute adminOnly><Index /></PrivateRoute>} />
      <Route path="/jobs" element={<PrivateRoute adminOnly><Jobs /></PrivateRoute>} />
      <Route path="/jobs/:jobId/result" element={<PrivateRoute adminOnly><Result /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute adminOnly><SettingsPage /></PrivateRoute>} />
      <Route path="/assistant" element={<PrivateRoute adminOnly><AssistantPage /></PrivateRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <JobsProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </JobsProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
