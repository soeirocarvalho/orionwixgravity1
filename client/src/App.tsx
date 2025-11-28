import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import Welcome from "@/pages/Welcome";
import Projects from "@/pages/Projects";
import Scanning from "@/pages/Scanning";
import Analytics from "@/pages/Analytics";
import Reports from "@/pages/Reports";
import Chat from "@/pages/Chat";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { Sidebar } from "@/components/layout/Sidebar";
import { useEffect } from "react";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function Router() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect unauthenticated users trying to access protected routes
  useEffect(() => {
    const isProtectedRoute = location !== "/" && location !== "/login";
    if (!isLoading && !isAuthenticated && isProtectedRoute) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, location, setLocation]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Public routes accessible without authentication
  if (location === "/" || location === "/login") {
    return location === "/" ? <Welcome /> : <Login />;
  }

  // Protected routes - show welcome if not authenticated (redirect happens in useEffect)
  if (!isAuthenticated) {
    return <Welcome />;
  }

  // Main app routes - only accessible when authenticated
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Switch>
          <Route path="/projects" component={Projects} />
          <Route path="/scanning" component={Scanning} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/reports" component={Reports} />
          <Route path="/chat" component={Chat} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
