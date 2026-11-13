import {
  User,
  Palette,
  Bell,
  Sparkles,
  SlidersHorizontal,
  Zap,
  CheckSquare,
  Target,
  RefreshCcw,
  Calendar,
  Puzzle,
  ShieldCheck,
  Download,
  Keyboard,
  Info,
  TriangleAlert,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { Link } from "@tanstack/react-router";

export function SettingsSidebar() {
  const { activeCategory, setActiveCategory } = useSettings();

  const sections = [
    {
      title: "PERSONAL",
      items: [
        { name: "Profile", icon: User },
        { name: "Appearance", icon: Palette },
        { name: "Notifications", icon: Bell },
      ],
    },
    {
      title: "AI & AUTOMATION",
      items: [
        { name: "AI Assistant", icon: Sparkles },
        { name: "AI Preferences", icon: SlidersHorizontal },
        { name: "Automation", icon: Zap },
      ],
    },
    {
      title: "PRODUCTIVITY",
      items: [
        { name: "Tasks", icon: CheckSquare },
        { name: "Focus", icon: Target },
        { name: "Habits", icon: RefreshCcw },
        { name: "Calendar", icon: Calendar },
      ],
    },
    {
      title: "DATA & PRIVACY",
      items: [
        { name: "Integrations", icon: Puzzle },
        { name: "Privacy & Security", icon: ShieldCheck },
        { name: "Data & Export", icon: Download },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { name: "Keyboard Shortcuts", icon: Keyboard },
        { name: "About Jōtai", icon: Info },
      ],
    },
  ];

  return (
    <div className="flex flex-col w-56 shrink-0 h-full overflow-y-auto custom-scrollbar border-r border-zinc-800 bg-zinc-950 px-4 py-6">
      {/* Brand */}
      <Link
        to="/"
        className="flex items-center gap-2 mb-8 px-2 hover:opacity-80 transition-opacity"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded bg-purple-600">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">Jōtai</span>
      </Link>

      <div className="flex flex-col gap-6 flex-1">
        {sections.map((section, idx) => (
          <div key={idx}>
            <h3 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-purple-400">
              {section.title}
            </h3>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item, i) => {
                const isActive = activeCategory === item.name;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveCategory(item.name)}
                    className={`flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors text-left ${
                      isActive
                        ? "bg-purple-900/30 text-purple-300"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                    }`}
                  >
                    <item.icon
                      className={`h-4 w-4 ${isActive ? "text-purple-400" : "text-zinc-500"}`}
                    />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-col gap-2">
        {/* AI Assistant shortcut */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-ai-assistant"))}
          className="flex w-full items-center gap-3 rounded-xl border border-purple-500/20 bg-purple-500/10 px-3 py-2.5 text-sm font-medium text-purple-300 transition-colors hover:bg-purple-500/20 mb-2"
        >
          <Sparkles className="h-4 w-4" />
          AI Assistant
        </button>

        <button
          onClick={() => setActiveCategory("Danger Zone")}
          className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors text-left ${
            activeCategory === "Danger Zone"
              ? "bg-red-950/40 text-red-400"
              : "text-red-400/70 hover:bg-red-950/20 hover:text-red-400"
          }`}
        >
          <TriangleAlert className="h-4 w-4" />
          Danger Zone
        </button>
      </div>
    </div>
  );
}
