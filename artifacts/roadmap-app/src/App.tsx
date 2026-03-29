import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/layout";
import { PomodoroProvider } from "@/components/pomodoro-context";
import Dashboard from "@/pages/dashboard";
import Checkin from "@/pages/checkin";
import Pomodoro from "@/pages/pomodoro";
import Progress from "@/pages/progress";
import Roadmap from "@/pages/roadmap";
import WeeklyReport from "@/pages/weekly-report";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  }
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/checkin" component={Checkin} />
        <Route path="/pomodoro" component={Pomodoro} />
        <Route path="/progress" component={Progress} />
        <Route path="/roadmap" component={Roadmap} />
        <Route path="/report" component={WeeklyReport} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <PomodoroProvider>
            <Router />
          </PomodoroProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
