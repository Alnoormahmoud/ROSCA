import { useEffect } from "react";
import {
  Switch,
  Route,
  Router as WouterRouter,
  useLocation,
} from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@workspace/replit-auth-web";
import {
  useGetMyProfile,
  getGetMyProfileQueryKey,
} from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import FundsList from "@/pages/funds-list";
import FundsNew from "@/pages/funds-new";
import FundDetail from "@/pages/fund-detail";
import ProfilePage from "@/pages/profile";
import { AppLayout } from "@/components/layout/AppLayout";
import { Mascot } from "@/components/Mascot";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function FullPageLoader() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="flex flex-col items-center gap-3">
        <Mascot size={120} />
        <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>
      </div>
    </div>
  );
}

function ProtectedShell({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: profileEnv, isLoading: profileLoading } = useGetMyProfile({
    query: {
      queryKey: getGetMyProfileQueryKey(),
      enabled: isAuthenticated,
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (
      isAuthenticated &&
      !profileLoading &&
      profileEnv &&
      !profileEnv.profile.onboardingComplete
    ) {
      setLocation("/onboarding");
    }
  }, [isAuthenticated, profileLoading, profileEnv, setLocation]);

  if (authLoading || (isAuthenticated && profileLoading)) {
    return <FullPageLoader />;
  }
  if (!isAuthenticated) return null;
  if (profileEnv && !profileEnv.profile.onboardingComplete) return null;

  return <AppLayout>{children}</AppLayout>;
}

function OnboardingGate() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: profileEnv, isLoading: profileLoading } = useGetMyProfile({
    query: {
      queryKey: getGetMyProfileQueryKey(),
      enabled: isAuthenticated,
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (
      isAuthenticated &&
      !profileLoading &&
      profileEnv?.profile.onboardingComplete
    ) {
      setLocation("/app");
    }
  }, [isAuthenticated, profileLoading, profileEnv, setLocation]);

  if (authLoading || (isAuthenticated && profileLoading)) {
    return <FullPageLoader />;
  }
  if (!isAuthenticated) return null;
  if (profileEnv?.profile.onboardingComplete) return null;

  return <Onboarding />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/onboarding" component={OnboardingGate} />
      <Route path="/app">
        <ProtectedShell>
          <Dashboard />
        </ProtectedShell>
      </Route>
      <Route path="/app/funds">
        <ProtectedShell>
          <FundsList />
        </ProtectedShell>
      </Route>
      <Route path="/app/funds/new">
        <ProtectedShell>
          <FundsNew />
        </ProtectedShell>
      </Route>
      <Route path="/app/funds/:fundId">
        <ProtectedShell>
          <FundDetail />
        </ProtectedShell>
      </Route>
      <Route path="/app/profile">
        <ProtectedShell>
          <ProfilePage />
        </ProtectedShell>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
        <SonnerToaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
