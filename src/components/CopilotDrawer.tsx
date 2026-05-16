import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCopilot } from "./copilot-context";
import { CopilotPanel } from "./CopilotPanel";

export function CopilotDrawer() {
  const { open, setOpen } = useCopilot();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-background/60 backdrop-blur-[2px] transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      />
      {/* Panel */}
      <aside
        aria-hidden={!open}
        className={cn(
          "fixed top-0 right-0 z-50 h-screen w-full sm:w-[480px] bg-surface/95 backdrop-blur-xl border-l border-border shadow-[0_0_60px_-10px_oklch(0.1_0_0_/_0.6)] flex flex-col transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* gradient edge */}
        <div className="absolute inset-y-0 left-0 w-px gradient-brand opacity-70 pointer-events-none" />

        <header className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold">Insights Copilot</div>
              <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">Ask your data</div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-full hover:bg-surface-2 text-muted-foreground hover:text-foreground transition"
            aria-label="Close Copilot"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 min-h-0 px-5 py-4">
          <CopilotPanel />
        </div>
      </aside>
    </>
  );
}
