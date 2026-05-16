import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Inbox,
  BookOpen,
  Sparkles,
  Telescope,
  Command,
  Watch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InsightsCopilot } from "./InsightsCopilot";

const NAV = [
  { to: "/inbox", label: "Email Ops", icon: Inbox, hint: "Triage · draft · send" },
  { to: "/knowledge", label: "Knowledge Base", icon: BookOpen, hint: "Self-improving KB" },
  { to: "/intelligence", label: "Marketing Intelligence", icon: Sparkles, hint: "Themes · monthly brief" },
  { to: "/benchmark", label: "External Sentiment", icon: Telescope, hint: "Internal vs market" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [copilotOpen, setCopilotOpen] = useState(false);
  const { location } = useRouterState();
  const pathname = location.pathname;
  const current = NAV.find((n) => pathname.startsWith(n.to)) ?? NAV[0];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex w-[244px] flex-col border-r border-border bg-surface">
        <div className="px-5 pt-6 pb-5 border-b border-border">
          <Link to="/inbox" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Watch className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-[17px] tracking-tight">Boldr</div>
              <div className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">CI Engine</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => {
            const Active = pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors",
                  Active
                    ? "bg-card hairline text-foreground"
                    : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] mt-0.5 shrink-0", Active && "text-ember")} />
                <div className="leading-tight">
                  <div className="text-[13.5px] font-medium">{item.label}</div>
                  <div className="text-[11px] text-muted-foreground/80 mt-0.5">{item.hint}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-border">
          <div className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">Engine status</div>
          <div className="mt-2 flex items-center gap-2 text-[12px]">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            <span>n8n · Postgres · OpenAI</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">70 tickets · 39 KB entries · 3 sources</div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/85 backdrop-blur px-5 md:px-8 h-14">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground hidden sm:inline">Boldr · CI Engine /</span>
            <h1 className="font-display text-[18px] truncate">{current.label}</h1>
          </div>
          <button
            onClick={() => setCopilotOpen(true)}
            className="inline-flex items-center gap-2 rounded-md hairline-strong bg-card px-3 py-1.5 text-[12.5px] hover:bg-ember-soft transition-colors"
          >
            <Command className="h-3.5 w-3.5 text-ember" />
            <span>Ask your data</span>
            <kbd className="ml-1 hidden sm:inline rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted-foreground border border-border">⌘ K</kbd>
          </button>
        </header>

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      <InsightsCopilot open={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  );
}
