import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Flame, Footprints, HeartPulse, Search, Trophy } from "lucide-react";
import { HabitTrackerWidget, StatsWidget, AnalyticsWidget, type Habit } from "@/components/jotai-widgets";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress · Jōtai" },
      { name: "description", content: "Track your habits and performance." },
    ],
  }),
  component: ProgressLayout,
});

type WidgetId = "habits" | "stats" | "analytics";
type LayoutItem = { id: WidgetId; x: number; y: number; w: number; h: number };

const initialLayout: LayoutItem[] = [
  { id: "habits", x: 0, y: 0, w: 4, h: 4 }, 
  { id: "stats", x: 4, y: 0, w: 8, h: 4 }, 
  { id: "analytics", x: 0, y: 4, w: 12, h: 4 },
];

const initialHabits: Habit[] = [
  { id: "h1", name: "Morning pages", streak: 12, progress: 86, color: "purple" }, 
  { id: "h2", name: "Move your body", streak: 8, progress: 64, color: "emerald" }, 
  { id: "h3", name: "No phone in bed", streak: 5, progress: 43, color: "yellow" }
];

function ProgressLayout() {
  const [layout, setLayout] = useState(initialLayout);
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [analyticsTab, setAnalyticsTab] = useState("Overview");
  const [draggedId, setDraggedId] = useState<WidgetId | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Fetch Habits from Backend
  useEffect(() => {
    fetch("http://localhost:5000/api/v1/habits")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          const mapped = data.data.map((h: any, i: number) => ({
            id: h._id,
            name: h.title,
            streak: h.streak || 0,
            progress: (h.streak || 1) * 10,
            color: ["purple", "emerald", "yellow"][i % 3] as "purple" | "emerald" | "yellow"
          }));
          setHabits(mapped);
        }
      })
      .catch(console.error);
  }, []);

  const checkInHabit = (id: string) => {
    fetch(`http://localhost:5000/api/v1/habits/${id}/check-in`, { method: "POST" }).catch(console.error);
    setHabits((current) => current.map((habit) => habit.id === id ? { ...habit, progress: Math.min(100, habit.progress + 12), streak: habit.streak + 1 } : habit));
  };

  const moveWidget = (targetId: WidgetId) => {
    if (!draggedId || draggedId === targetId) return;
    setLayout((current) => {
      const source = current.find((item) => item.id === draggedId);
      const target = current.find((item) => item.id === targetId);
      if (!source || !target) return current;
      return current.map((item) => item.id === source.id ? { ...item, x: target.x, y: target.y } : item.id === target.id ? { ...item, x: source.x, y: source.y } : item);
    });
    setDraggedId(null);
  };

  const resizeWidget = (id: WidgetId, event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const item = layout.find((entry) => entry.id === id);
    const grid = gridRef.current;
    if (!item || !grid) return;
    const columnWidth = (grid.clientWidth - 11 * 14) / 12;
    const rowHeight = 118;
    const onMove = (moveEvent: PointerEvent) => {
      const deltaW = Math.round((moveEvent.clientX - startX) / (columnWidth + 14));
      const deltaH = Math.round((moveEvent.clientY - startY) / (rowHeight + 14));
      setLayout((current) => current.map((entry) => entry.id === id ? { ...entry, w: Math.max(2, Math.min(12 - entry.x, item.w + deltaW)), h: Math.max(2, item.h + deltaH) } : entry));
    };
    const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
    window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);
  };

  const widgetMap: Record<WidgetId, React.ReactNode> = {
    stats: <StatsWidget stats={[
      { label: "Focus time", value: "18h 42m", target: "24h", percent: 78, icon: <HeartPulse className="size-4" />, accent: "stat-purple" }, 
      { label: "Calories burnt", value: "1,840", target: "2,200", percent: 84, icon: <Flame className="size-4" />, accent: "stat-coral" }, 
      { label: "Steps", value: "7,842", target: "10,000", percent: 72, icon: <Footprints className="size-4" />, accent: "stat-cyan" }, 
      { label: "Quests", value: "04", target: "07", percent: 57, icon: <Trophy className="size-4" />, accent: "stat-yellow" }
    ]} />,
    habits: <HabitTrackerWidget habits={habits} onCheckIn={checkInHabit} />,
    analytics: <AnalyticsWidget activeTab={analyticsTab} onTabChange={setAnalyticsTab} />,
  };

  return (
    <>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="section-eyebrow text-emerald-300">PROGRESS METRICS</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Your Progress<span className="text-emerald-400">.</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">Monitor your habits and review performance trends.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs text-muted-foreground sm:flex">
            <Search className="size-3.5" />
            <span>Search history</span>
            <kbd className="ml-4 rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">⌘ K</kbd>
          </div>
        </div>
      </div>
      
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="status-dot emerald" />
          <span className="text-xs text-muted-foreground">Tracking active</span>
        </div>
        <div className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:flex">
          <span>Grid arrangement</span>
          <span className="rounded border border-border px-2 py-1 font-mono normal-case tracking-normal text-foreground">drag to reorder / resize</span>
        </div>
      </div>
      
      <div ref={gridRef} className="dashboard-grid mt-3">
        {layout.map((item) => (
          <div 
            key={item.id} 
            className={`grid-widget ${draggedId === item.id ? "grid-widget-dragging" : ""}`} 
            style={{ gridColumn: `${item.x + 1} / span ${item.w}`, gridRow: `${item.y + 1} / span ${item.h}` }} 
            draggable 
            onDragStart={() => setDraggedId(item.id)} 
            onDragOver={(event) => event.preventDefault()} 
            onDrop={() => moveWidget(item.id)} 
            onDragEnd={() => setDraggedId(null)}
          >
            {widgetMap[item.id]}
            <button className="resize-handle" onPointerDown={(event) => resizeWidget(item.id, event)} aria-label={`Resize ${item.id}`} />
          </div>
        ))}
      </div>
    </>
  );
}
