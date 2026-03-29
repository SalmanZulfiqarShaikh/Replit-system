import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@workspace/replit-auth-web";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Timer, 
  TrendingUp, 
  Map, 
  FileText,
  Terminal,
  LogIn,
  LogOut,
  User
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/checkin", label: "Check-in", icon: CheckSquare },
  { href: "/pomodoro", label: "Pomodoro", icon: Timer },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/report", label: "Weekly Report", icon: FileText },
];

function LoginScreen() {
  const { login } = useAuth();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Terminal className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-mono font-bold text-3xl text-white tracking-tight">
            SYSTEM.<span className="text-primary">INIT</span>
          </h1>
          <p className="text-muted-foreground font-mono text-sm tracking-widest uppercase">
            AI Roadmap Accountability
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-white font-semibold">10-Month AI Engineering Roadmap</p>
            <p className="text-muted-foreground text-sm">
              Track your progress. Stay accountable. Ship the startup.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Daily Check-ins", emoji: "📋" },
              { label: "Pomodoro Timer", emoji: "🍅" },
              { label: "AI Coaching", emoji: "🤖" },
            ].map((f) => (
              <div key={f.label} className="space-y-1">
                <div className="text-2xl">{f.emoji}</div>
                <p className="text-xs text-muted-foreground font-mono">{f.label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-black font-bold py-3 px-6 rounded-lg transition-all duration-200 font-mono text-sm tracking-wide"
          >
            <LogIn className="w-5 h-5" />
            LOG IN TO ACCESS SYSTEM
          </button>
        </div>

        <p className="text-muted-foreground text-xs font-mono">
          PHASE 1 ACTIVE — BACKEND + VOICE AI FOUNDATIONS
        </p>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Terminal className="w-8 h-8 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground font-mono text-sm">LOADING SYSTEM...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground font-sans">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 border-b border-border/50">
          <Terminal className="w-8 h-8 text-primary" />
          <div>
            <h1 className="font-mono font-bold text-lg leading-tight text-white tracking-tight">SYSTEM.<span className="text-primary">INIT</span></h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_-3px_rgba(29,185,84,0.15)]" 
                    : "text-muted-foreground hover:bg-secondary hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary drop-shadow-[0_0_8px_rgba(29,185,84,0.8)]" : "")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border/50 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/50 border border-border">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 overflow-hidden">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-primary" />
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.firstName || user?.username || "Developer"}</p>
              <p className="text-xs text-primary font-mono truncate">Phase 1 Active</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-white text-xs font-mono py-2 px-4 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <LogOut className="w-3 h-3" />
            LOGOUT
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-sidebar">
          <div className="flex items-center gap-2">
            <Terminal className="w-6 h-6 text-primary" />
            <h1 className="font-mono font-bold text-base text-white">SYSTEM.<span className="text-primary">INIT</span></h1>
          </div>
          <button onClick={logout} className="text-muted-foreground">
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Mobile Nav (Bottom Bar) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-sidebar z-50 flex items-center justify-around p-2 pb-safe">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
