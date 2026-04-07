import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/Sidebar";
import OverviewPage from "@/pages/Overview";
import ClientsPage from "@/pages/Clients";
import SocialPage from "@/pages/Social";
import AdsPage from "@/pages/Ads";
import LeadsPage from "@/pages/Leads";
import LoginPage from "@/pages/Login";
import NotFound from "@/pages/not-found";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="space-y-4 w-64">
        <div className="flex items-center gap-3 justify-center">
          <div className="w-10 h-10">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full animate-pulse" aria-label="Loading">
              <circle cx="18" cy="18" r="15" stroke="hsl(218,72%,28%)" strokeWidth="3" className="dark:stroke-[hsl(215,80%,60%)]" fill="none" />
              <path d="M10 22 L10 28 L26 28 L26 22 L18 15 Z" fill="hsl(218,72%,28%)" className="dark:fill-[hsl(215,80%,60%)]" />
              <path d="M8 23 L18 13 L28 23" stroke="hsl(33,95%,50%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
        </div>
        <Skeleton className="h-2 w-full" />
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="dashboard-grid">
      <Sidebar />
      <main className="main-scroll bg-background">
        <Router hook={useHashLocation}>
          <Switch>
            <Route path="/" component={OverviewPage} />
            <Route path="/clients" component={ClientsPage} />
            <Route path="/social" component={SocialPage} />
            <Route path="/ads" component={AdsPage} />
            <Route path="/leads" component={LeadsPage} />
            <Route component={NotFound} />
          </Switch>
        </Router>
      </main>
    </div>
  );
}

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <Toaster />
    </QueryClientProvider>
  );
}
