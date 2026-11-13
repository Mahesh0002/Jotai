import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { IntegrationsModal } from "@/components/jotai-widgets";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { SmartAssistant } from "@/components/SmartAssistant";
import { ProactiveSuggestions } from "@/components/ProactiveSuggestions";
import { Toaster } from "sonner";
import { FocusProvider } from "@/contexts/FocusContext";
import { NotesProvider } from "@/contexts/NotesContext";
import { SettingsProvider } from "@/contexts/SettingsContext";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Jōtai · Personal Operating System" },
      {
        name: "description",
        content: "A focused, gamified productivity dashboard for turning attention into momentum.",
      },
      { name: "author", content: "Jōtai" },
      { property: "og:title", content: "Jōtai · Personal Operating System" },
      {
        property: "og:description",
        content: "A focused, gamified productivity dashboard for turning attention into momentum.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@jotai_app" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
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
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [integrations, setIntegrations] = useState<Record<string, boolean>>({
    calendar: false,
    notion: false,
    spotify: true,
    github: false,
    trello: false,
  });

  // ─── Centralized Assistant Invalidation Handler ────────────────────────────
  // SmartAssistant dispatches "jotai-invalidate" with a list of query-key strings.
  // This is the SINGLE listener — no individual component needs to know about it.
  // Canonical query keys: "tasks" | "goals" | "habits" | "today" | "habitAnalytics" | "focusBlocks"
  useEffect(() => {
    const handler = (e: Event) => {
      const keys = (e as CustomEvent<string[]>).detail;
      if (!Array.isArray(keys)) return;
      keys.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
      );
    };
    window.addEventListener("jotai-invalidate", handler);
    return () => window.removeEventListener("jotai-invalidate", handler);
  }, [queryClient]);
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <FocusProvider>
          <NotesProvider>
            <div className="flex h-screen bg-zinc-950 text-foreground overflow-hidden">
              <Sidebar onOpenIntegrations={() => setIntegrationsOpen(true)} />
              <div className="flex-1 flex flex-col overflow-y-auto">
                <Topbar />
                <main className="mx-auto w-full max-w-[1600px] p-6">
                  <Outlet />
                </main>
              </div>
              <IntegrationsModal
                open={integrationsOpen}
                integrations={integrations}
                onToggle={(id) => setIntegrations((current) => ({ ...current, [id]: !current[id] }))}
                onClose={() => setIntegrationsOpen(false)}
              />
              <SmartAssistant />
              <ProactiveSuggestions />
              <Toaster theme="dark" position="bottom-right" />
            </div>
          </NotesProvider>
        </FocusProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}
