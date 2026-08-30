import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalyticsWidget, DailyQuestWidget, FocusTimerWidget, NotepadWidget, UserProfileWidget, type Goal } from "./jotai-widgets";

type WidgetId = "quests" | "focus" | "analytics" | "notepad" | "profile";
type LayoutItem = { id: WidgetId; x: number; y: number; w: number; h: number };

const initialLayout: LayoutItem[] = [
  { id: "profile", x: 0, y: 0, w: 12, h: 2 },
  { id: "quests", x: 0, y: 2, w: 6, h: 4 }, 
  { id: "focus", x: 6, y: 2, w: 6, h: 4 }, 
  { id: "notepad", x: 0, y: 6, w: 6, h: 4 },
  { id: "analytics", x: 6, y: 6, w: 6, h: 4 }
];

const initialGoals: Goal[] = [
  { id: "g1", title: "Ship the product brief", detail: "Write the first draft and share for review", tag: "WORK", complete: true },
  { id: "g2", title: "25 min deep work sprint", detail: "Complete one uninterrupted focus session", tag: "FOCUS", complete: true },
  { id: "g3", title: "Move for 30 minutes", detail: "Walk, stretch, or train before lunch", tag: "HEALTH", complete: false },
  { id: "g4", title: "Read 10 pages", detail: "Continue The Creative Act", tag: "LEARN", complete: false },
  { id: "g5", title: "Clear the inbox", detail: "Archive, delegate, or answer priority threads", tag: "ADMIN", complete: false },
];

export default function DashboardLayout() {
  const [layout, setLayout] = useState(initialLayout);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  
  // Focus Timer State
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(4);

  // Analytics Tab State
  const [analyticsTab, setAnalyticsTab] = useState("Overview");

  // Drag and Drop State
  const [draggedId, setDraggedId] = useState<WidgetId | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Fetch Goals from Backend
  useEffect(() => {
    fetch("http://localhost:5000/api/v1/goals")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          const mapped = data.data.map((g: any) => ({
            id: g._id,
            title: g.title,
            detail: g.description || "Goal detail",
            tag: g.category || "WORK",
            complete: g.status === "completed"
          }));
          setGoals(mapped);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => setSeconds((value) => {
      if (value <= 1) { setRunning(false); setSessions((count) => count + 1); return 25 * 60; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(interval);
  }, [running]);

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

  const toggleGoal = (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    const newStatus = goal.complete ? "pending" : "completed";
    fetch(`http://localhost:5000/api/v1/goals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    }).catch(console.error);
    setGoals((current) => current.map((g) => g.id === id ? { ...g, complete: !g.complete } : g));
  };
  
  const deleteGoal = (id: string) => {
    fetch(`http://localhost:5000/api/v1/goals/${id}`, { method: "DELETE" }).catch(console.error);
    setGoals((current) => current.filter((goal) => goal.id !== id));
  };
  
  const addGoal = () => {
    const title = prompt("Enter quest objective:") || "New quest objective";
    fetch("http://localhost:5000/api/v1/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: "Define the next small action", category: "NEW", status: "pending" })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setGoals((current) => [...current, { id: data.data._id, title: data.data.title, detail: data.data.description, tag: data.data.category, complete: false }]);
      }
    })
    .catch(console.error);
  };
  


  const widgetMap: Record<WidgetId, React.ReactNode> = {
    profile: <UserProfileWidget xp={2847} maxXp={3000} streak={12} />,
    quests: <DailyQuestWidget goals={goals} onToggle={toggleGoal} onDelete={deleteGoal} onAdd={addGoal} />,
    focus: <FocusTimerWidget seconds={seconds} running={running} sessions={sessions} onToggle={() => setRunning((value) => !value)} onReset={() => { setRunning(false); setSeconds(25 * 60); }} />,
    notepad: <NotepadWidget />,
    analytics: <AnalyticsWidget activeTab={analyticsTab} onTabChange={setAnalyticsTab} />,
  };

  return <><div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="section-eyebrow text-purple-300">TUESDAY / 08 OCTOBER 2024</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Good morning, Jōtai<span className="text-purple-400">.</span></h1><p className="mt-2 text-sm text-muted-foreground">Your attention is your most valuable resource. Spend it well.</p></div><div className="flex items-center gap-2"><div className="hidden items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs text-muted-foreground sm:flex"><Search className="size-3.5" /><span>Search workspace</span><kbd className="ml-4 rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">⌘ K</kbd></div><Button variant="outline" size="icon" className="h-9 w-9 border-border bg-transparent sm:hidden" aria-label="Search"><Search className="size-4" /></Button></div></div><div className="mt-5 flex items-center justify-between"><div className="flex items-center gap-2"><span className="status-dot emerald" /><span className="text-xs text-muted-foreground">All systems operational</span></div><div className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:flex"><span>Workspace layout</span><span className="rounded border border-border px-2 py-1 font-mono normal-case tracking-normal text-foreground">drag to reorder / resize</span></div></div><div ref={gridRef} className="dashboard-grid mt-3">{layout.map((item) => <div key={item.id} className={`grid-widget ${draggedId === item.id ? "grid-widget-dragging" : ""}`} style={{ gridColumn: `${item.x + 1} / span ${item.w}`, gridRow: `${item.y + 1} / span ${item.h}` }} draggable onDragStart={() => setDraggedId(item.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveWidget(item.id)} onDragEnd={() => setDraggedId(null)}>{widgetMap[item.id]}<button className="resize-handle" onPointerDown={(event) => resizeWidget(item.id, event)} aria-label={`Resize ${item.id}`} /></div>)}</div></>;
}
