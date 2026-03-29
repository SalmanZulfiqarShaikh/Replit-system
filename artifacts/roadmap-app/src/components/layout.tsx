import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Timer, 
  TrendingUp, 
  Map, 
  FileText,
  User,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/checkin", label: "Check-in", icon: CheckSquare },
  { href: "/pomodoro", label: "Pomodoro", icon: Timer },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/report", label: "Weekly Report", icon: FileText },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground font-sans">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 border-b border-border/50">
          <div>
            <h1 className="font-mono font-bold text-base leading-tight text-white tracking-widest">SALMAN'S SYSTEM</h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">AI Roadmap</p>
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
                    ? "bg-white/10 text-white border border-white/20" 
                    : "text-muted-foreground hover:bg-secondary hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/50 border border-border">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.firstName || "Salman"}</p>
              <p className="text-xs text-muted-foreground font-mono truncate">Phase 1 Active</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-sidebar">
          <span className="font-mono font-bold text-sm text-white tracking-widest">SALMAN'S SYSTEM</span>
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
                  isActive ? "text-white" : "text-muted-foreground"
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
