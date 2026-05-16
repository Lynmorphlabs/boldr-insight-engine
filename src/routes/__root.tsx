import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Boldr · 404</p>
        <h1 className="mt-3 text-4xl font-display text-foreground">Page not found.</h1>
        <p className="mt-2 text-sm text-muted-foreground">This route isn't part of the Customer Intelligence Engine.</p>
        <Link to="/inbox" className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90">
          Go to Inbox
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-display text-foreground">Something went wrong.</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Boldr · Customer Intelligence Engine" },
      { name: "description", content: "Internal BI dashboard for the Boldr CS + marketing team. Email Ops, self-improving KB, marketing intelligence, and external sentiment benchmarking." },
      { name: "author", content: "Boldr" },
      { property: "og:title", content: "Boldr · Customer Intelligence Engine" },
      { property: "og:description", content: "Internal BI dashboard for the Boldr CS + marketing team. Email Ops, self-improving KB, marketing intelligence, and external sentiment benchmarking." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Boldr · Customer Intelligence Engine" },
      { name: "twitter:description", content: "Internal BI dashboard for the Boldr CS + marketing team. Email Ops, self-improving KB, marketing intelligence, and external sentiment benchmarking." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/266db41f-f74f-4cc2-bd71-a3a8047ea6bd" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/266db41f-f74f-4cc2-bd71-a3a8047ea6bd" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster />
    </QueryClientProvider>
  );
}
