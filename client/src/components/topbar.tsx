import { Search, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useSettings } from "@/contexts/SettingsContext";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Topbar() {
  const { settings } = useSettings();
  const initials = getInitials(settings.displayName || "JR");

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800/50 px-6">
      <div className="flex flex-1 items-center gap-4">
        {/* Placeholder for future breadcrumbs or page title if needed */}
      </div>

      <div className="flex items-center gap-4">
        {/* Global Search */}
        <div className="hidden items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs text-muted-foreground sm:flex">
          <Search className="size-4" />
          <span className="mr-6">Search or press</span>
          <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-300">
            ⌘ K
          </kbd>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-zinc-800 bg-transparent sm:hidden"
          aria-label="Search"
        >
          <Search className="size-4" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-foreground">
          <Bell className="size-4" />
        </Button>

        {/* Settings link */}
        <Link to="/settings">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-foreground" aria-label="Settings">
            <Settings className="size-4" />
          </Button>
        </Link>

        {/* User Profile — dynamic initials */}
        <Link to="/settings" title={settings.displayName}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 text-xs font-semibold text-purple-300 ring-1 ring-purple-500/30 hover:bg-purple-500/30 transition-colors cursor-pointer">
            {initials}
          </div>
        </Link>
      </div>
    </header>
  );
}
