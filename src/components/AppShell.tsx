import { type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Inbox,
  BookOpen,
  Sparkles,
  Telescope,
  Watch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CopilotProvider, useCopilot } from "./copilot-context";
import { CopilotDrawer } from "./CopilotDrawer";

const NAV = [
  { to: "/inbox", label: "Email Ops", icon: Inbox, hint: "Triage · draft · send" },
  { to: "/knowledge", label: "Knowledge Base", icon: BookOpen, hint: "Self-improving KB" },
  { to: "/intelligence", label: "Marketing Intelligence", icon: Sparkles, hint: "Themes · monthly brief" },
  { to: "/benchmark", label: "External Sentiment", icon: Telescope, hint: "Internal vs market" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <CopilotProvider>
      <AppShellInner>{children}</AppShellInner>
      <CopilotDrawer />
    </CopilotProvider>
  );
}

function AppShellInner({ children }: { children: ReactNode }) {
  const { setOpen } = useCopilot();
  const { location } = useRouterState();
  const pathname = location.pathname;
  const current = NAV.find((n) => pathname.startsWith(n.to)) ?? NAV[0];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
          <Link to="/inbox" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl gradient-brand text-primary-foreground flex items-center justify-center shadow-[0_8px_24px_-8px_oklch(0.78_0.13_295_/_0.6)]">
              <Watch className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-[17px] tracking-tight">
                Boldr <span className="text-muted-foreground font-normal">CI</span>
              </div>
              <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">Intelligence Engine</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const Active = pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all",
                  Active
                    ? "bg-surface-2 hairline-strong text-foreground"
                    : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
                )}
              >
                {Active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full gradient-brand" />
                )}
                <Icon className={cn("h-[18px] w-[18px] mt-0.5 shrink-0 transition-colors", Active && "text-primary")} />
                <div className="leading-tight">
                  <div className="text-[13.5px] font-medium">{item.label}</div>
                  <div className="text-[11px] text-muted-foreground/80 mt-0.5">{item.hint}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-border">
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">Engine status</div>
          <div className="mt-2 flex items-center gap-2 text-[12px]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span>All systems operational</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">70 tickets · 39 KB entries · 3 sources</div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/70 backdrop-blur-xl px-5 md:px-8 h-16">
          <div className="flex items-center gap-3 min-w-0">
            <span className="chip hidden sm:inline-flex">
              <Sparkles className="h-3 w-3 text-primary" /> Boldr CI
            </span>
            <h1 className="font-display text-[20px] truncate gradient-text">{current.label}</h1>
          </div>
          <button
            onClick={openCopilot}
            className="group inline-flex items-center gap-2 rounded-full bg-surface-2 hairline-strong px-4 py-2 text-[12.5px] hover:bg-surface-2/70 transition-all hover:-translate-y-[1px]"
          >
            <span className="h-2 w-2 rounded-full gradient-brand" />
            <span className="text-foreground/90">{onBenchmark ? "Jump to Copilot" : "Ask your data"}</span>
            <span className="ml-1 hidden sm:inline text-[10.5px] text-muted-foreground">→ Benchmark</span>
          </button>
        </header>

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
