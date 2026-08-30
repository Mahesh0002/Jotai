import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsWidget, MarketWidget, WeatherWidget } from "@/components/jotai-widgets";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights · Jōtai" },
      { name: "description", content: "External signals and intelligence." },
    ],
  }),
  component: InsightsLayout,
});

type WidgetId = "news" | "market" | "weather";
type LayoutItem = { id: WidgetId; x: number; y: number; w: number; h: number };

const initialLayout: LayoutItem[] = [
  { id: "news", x: 0, y: 0, w: 4, h: 4 }, 
  { id: "market", x: 4, y: 0, w: 4, h: 4 }, 
  { id: "weather", x: 8, y: 0, w: 4, h: 4 },
];

function InsightsLayout() {
  const [layout, setLayout] = useState(initialLayout);
  const [draggedId, setDraggedId] = useState<WidgetId | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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
    news: <NewsWidget />,
    market: <MarketWidget />,
    weather: <WeatherWidget />,
  };

  return (
    <>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="section-eyebrow text-cyan-300">EXTERNAL SIGNALS</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">News & Insights<span className="text-cyan-400">.</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">Keep an eye on the world while protecting your peace.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs text-muted-foreground sm:flex">
            <Search className="size-3.5" />
            <span>Search intelligence</span>
            <kbd className="ml-4 rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">⌘ K</kbd>
          </div>
        </div>
      </div>
      
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="status-dot cyan" />
          <span className="text-xs text-muted-foreground">Live data feeds connected</span>
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
