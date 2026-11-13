import React, { useEffect, useMemo, useState } from "react";
import {
  Brain,
  Coffee,
  Laptop,
  Users,
  Plus,
  Play,
  Clock3,
  X,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Trash2,
  Edit,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { useFocusBlocks } from "@/hooks/useFocusBlocks";
import { FocusBlock, proposalsApi, Proposal } from "@/lib/api";
import { FocusBlockModal } from "./focus/FocusBlockModal";

interface FocusPlanProps {
  onStartFocus?: (block: FocusBlock) => void;
}

// 12 hours from 8AM to 8PM
const TIMELINE_START = 8 * 60;
const TIMELINE_END = 20 * 60;
const PIXELS_PER_MINUTE = 100 / 60; // 100px per hour

function dateToMinutes(dateStr: string): number {
  const d = new Date(dateStr);
  return d.getHours() * 60 + d.getMinutes();
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${suffix}`;
}

function calculateDuration(durationMinutes: number): string {
  if (durationMinutes <= 0) return "0m";
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function getBlockIcon(type: string) {
  switch (type) {
    case "deep_work":
      return Brain;
    case "break":
      return Coffee;
    case "study":
    case "reading":
      return Laptop;
    case "admin":
      return Users;
    default:
      return Clock3;
  }
}

function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function FocusPlan({ onStartFocus }: FocusPlanProps) {
  const { blocks, isLoading, deleteBlock } = useFocusBlocks();
  const [currentTime, setCurrentTime] = useState(getCurrentMinutes());
  const [selectedBlock, setSelectedBlock] = useState<FocusBlock | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<FocusBlock | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const data = await proposalsApi.getAll("pending");
        setProposals(data);
      } catch (err) {
        console.error("Failed to fetch proposals", err);
      }
    };
    fetchProposals();
    const interval = setInterval(() => setCurrentTime(getCurrentMinutes()), 60000);
    return () => clearInterval(interval);
  }, []);

  const [isAutoPlanning, setIsAutoPlanning] = useState(false);

  const handleAutoPlan = async () => {
    setIsAutoPlanning(true);
    try {
      await fetch("http://localhost:8000/api/runner/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "plan" })
      });
      // The proposals state will update automatically if we refetch, 
      // but let's just trigger a refetch of pending proposals manually here
      const data = await proposalsApi.getAll("pending");
      setProposals(data);
    } catch (err) {
      console.error("Auto plan failed", err);
    } finally {
      setIsAutoPlanning(false);
    }
  };

  const handleProposalAction = async (id: string, action: "accepted" | "rejected") => {
    try {
      await proposalsApi.updateStatus(id, action);
      setProposals(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error("Proposal action failed", err);
    }
  };

  const totalMinutes = useMemo(
    () => blocks.reduce((total, block) => total + block.durationMinutes, 0),
    [blocks],
  );

  // Calculate free time slots
  const freeSlots = useMemo(() => {
    const sorted = [...blocks].sort(
      (a, b) => dateToMinutes(a.startTime) - dateToMinutes(b.startTime),
    );
    const slots = [];
    let currentEnd = TIMELINE_START;

    for (const block of sorted) {
      const start = dateToMinutes(block.startTime);
      if (start > currentEnd) {
        slots.push({ start: currentEnd, end: start });
      }
      currentEnd = Math.max(currentEnd, dateToMinutes(block.endTime));
    }

    if (currentEnd < TIMELINE_END) {
      slots.push({ start: currentEnd, end: TIMELINE_END });
    }

    return slots;
  }, [blocks]);

  const getTop = (timeMinutes: number) => (timeMinutes - TIMELINE_START) * PIXELS_PER_MINUTE;
  const getHeight = (durationMinutes: number) => durationMinutes * PIXELS_PER_MINUTE;

  const renderBlock = (block: FocusBlock) => {
    const startMin = dateToMinutes(block.startTime);
    const endMin = dateToMinutes(block.endTime);

    const top = getTop(startMin);
    const height = getHeight(block.durationMinutes);

    const Icon = getBlockIcon(block.type);

    let state = "upcoming";
    if (block.status === "completed" || block.status === "skipped") {
      state = block.status;
    } else if (currentTime > endMin) {
      state = "missed";
    } else if (currentTime >= startMin && currentTime <= endMin) {
      state = "current";
    }

    const typeStyles: Record<string, string> = {
      deep_work: "bg-primary-light border-primary/30 text-primary",
      study: "bg-blue-500/10 border-blue-500/30 text-blue-400",
      creative: "bg-purple-500/10 border-purple-500/30 text-purple-400",
      admin: "bg-warning-light border-warning/30 text-warning",
      reading: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
      break: "bg-success-light border-success/30 text-success",
      custom: "bg-border border-border text-text-primary",
    };

    const style: string = typeStyles[block.type] || "bg-border border-border text-text-primary";

    return (
      <div
        key={block._id}
        onClick={() => setSelectedBlock(block)}
        className={clsx(
          "absolute left-[80px] right-4 rounded-xl border flex flex-col p-4 cursor-pointer transition-all hover:scale-[1.01] overflow-hidden",
          style.split(" text-")[0], // Get bg and border classes
          state === "completed" && "opacity-60",
          state === "missed" && "opacity-50 grayscale border-dashed",
          state === "current" && "shadow-glow-strong z-10 scale-[1.02]",
        )}
        style={{ top: `${top}px`, height: `${height}px` }}
      >
        <div className="flex items-center gap-2 mb-1">
          {state === "completed" ? (
            <CheckCircle2 className={clsx("h-4 w-4", style.match(/text-\S+/)?.[0])} />
          ) : state === "missed" ? (
            <AlertCircle className={clsx("h-4 w-4 text-error")} />
          ) : (
            <Icon className={clsx("h-4 w-4", style.match(/text-\S+/)?.[0])} />
          )}
          <span
            className={clsx(
              "text-xs font-bold uppercase tracking-wider",
              style.match(/text-\S+/)?.[0],
            )}
          >
            {block.type.replace("_", " ")}
          </span>
        </div>

        <h3 className="text-lg font-bold text-text-primary truncate">
          {block.taskId?.title || block.title || "Untitled Block"}
        </h3>

        <div className="mt-auto flex items-center justify-between">
          <div className="text-[11px] font-medium text-text-secondary">
            {formatTime(block.startTime)} &ndash; {formatTime(block.endTime)}
          </div>
          {state === "missed" && <Badge variant="danger">Missed</Badge>}
          {state === "current" && (
            <Badge variant="primary" className="animate-pulse">
              In Progress
            </Badge>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="p-6 text-text-muted">Loading focus plan...</div>;
  }

  return (
    <>
      <Card className="h-full flex flex-col p-0 overflow-hidden relative">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-6 bg-surface z-20 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-text-muted uppercase mb-1">
              <span className="h-2 w-2 rounded-full bg-primary shadow-glow animate-pulse" />
              Focus Plan
            </div>
            <p className="text-xs text-text-secondary">Your planned focus blocks for today</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="font-medium text-text-primary">
              {Math.floor(totalMinutes / 60)}h{" "}
              {totalMinutes % 60 > 0 ? `${totalMinutes % 60}m` : ""} planned
            </div>
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Block
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleAutoPlan} 
              disabled={isAutoPlanning}
            >
              {isAutoPlanning ? "✦ Planning..." : "✦ Auto Plan"}
            </Button>
          </div>
        </div>

        {/* Proposals Banner */}
        {proposals.length > 0 && (
          <div className="bg-primary/10 border-b border-primary/20 p-4 shrink-0 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <Brain className="w-4 h-4" /> Suggestions from Jötai Runner
            </h3>
            {proposals.map(p => (
              <div key={p._id} className="bg-surface border border-primary/20 rounded-lg p-3 text-sm flex justify-between items-center">
                <div>
                  <div className="font-semibold">{p.type === 'schedule_proposal' ? 'Schedule Optimization' : 'Habit Insight'}</div>
                  <div className="text-text-secondary text-xs mt-1">
                    {p.type === 'schedule_proposal' ? `${p.data?.blocks?.length || 0} blocks proposed.` : p.data?.title}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleProposalAction(p._id, 'rejected')}>Reject</Button>
                  <Button size="sm" variant="primary" onClick={() => handleProposalAction(p._id, 'accepted')}>Accept</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Timeline Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-background">
          <div
            className="relative w-full"
            style={{ height: `${(TIMELINE_END - TIMELINE_START) * PIXELS_PER_MINUTE}px` }}
          >
            {/* Hour Markers (08:00 to 20:00) */}
            {Array.from({ length: 13 }).map((_, i) => {
              const hourMinutes = TIMELINE_START + i * 60;
              const top = getTop(hourMinutes);
              const displayHour = 8 + i;
              const suffix = displayHour >= 12 ? "PM" : "AM";
              const hour12 = displayHour > 12 ? displayHour - 12 : displayHour;

              return (
                <div
                  key={i}
                  className="absolute left-0 right-0 flex items-center pointer-events-none"
                  style={{ top: `${top}px` }}
                >
                  <div className="w-[80px] text-right pr-4 text-[10px] font-medium text-text-muted">
                    {hour12.toString().padStart(2, "0")} {suffix}
                  </div>
                  <div className="flex-1 border-b border-border border-dashed opacity-50" />
                </div>
              );
            })}

            {/* Free Slots */}
            {freeSlots.map((slot, idx) => {
              const top = getTop(slot.start);
              const height = (slot.end - slot.start) * PIXELS_PER_MINUTE;
              if (height < 30) return null; // Too small to interact
              return (
                <div
                  key={`free-${idx}`}
                  onClick={() => {
                    // Open modal with this time pre-filled
                    setIsModalOpen(true);
                  }}
                  className="absolute left-[80px] right-4 flex items-center justify-center border border-border border-dashed bg-surface-elevated/20 text-[10px] font-bold tracking-widest text-text-muted hover:bg-surface-elevated/50 transition-colors cursor-pointer rounded-xl"
                  style={{ top: `${top}px`, height: `${height}px` }}
                >
                  + AVAILABLE TIME
                </div>
              );
            })}

            {/* Render Blocks */}
            {blocks.map(renderBlock)}

            {/* Current Time Indicator (NOW) */}
            {currentTime >= TIMELINE_START && currentTime <= TIMELINE_END && (
              <div
                className="absolute left-0 right-0 z-30 pointer-events-none flex items-center transition-all duration-1000"
                style={{ top: `${getTop(currentTime)}px` }}
              >
                <div className="w-[80px] flex justify-end pr-2">
                  <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-glow-strong">
                    Now
                  </span>
                </div>
                <div className="flex-1 h-[2px] bg-primary shadow-glow relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Block Detail Panel (Modal over Timeline) */}
        {selectedBlock && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setSelectedBlock(null)}
          >
            <Card
              className="w-full max-w-[360px] p-6 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <Badge variant="outline" className="mb-3 uppercase tracking-widest">
                    {selectedBlock.type.replace("_", " ")}
                  </Badge>
                  <h2 className="text-xl font-bold text-text-primary">
                    {selectedBlock.taskId?.title || selectedBlock.title || "Untitled Block"}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedBlock(null)}
                  className="text-text-muted hover:text-text-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-surface-elevated border border-border rounded-lg p-3 mb-6">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-text-primary">{formatTime(selectedBlock.startTime)}</span>
                  <ChevronRight className="h-4 w-4 text-text-muted" />
                  <span className="text-text-primary">{formatTime(selectedBlock.endTime)}</span>
                </div>
                <div className="mt-2 text-xs text-text-secondary flex justify-between">
                  <span>Duration: {calculateDuration(selectedBlock.durationMinutes)}</span>
                  {selectedBlock.status === "completed" && (
                    <span className="text-success">Completed</span>
                  )}
                </div>
              </div>

              {selectedBlock.taskId && (
                <div className="mb-6">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                    Attached Task
                  </h3>
                  <p className="text-sm font-medium text-text-secondary flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> {selectedBlock.taskId.title}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    onStartFocus?.(selectedBlock);
                    setSelectedBlock(null);
                  }}
                >
                  <Play className="h-4 w-4 mr-2 fill-current" /> Start Focus
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => {
                    setEditingBlock(selectedBlock);
                    setSelectedBlock(null);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="danger"
                  size="icon"
                  onClick={() => {
                    deleteBlock.mutate(selectedBlock._id);
                    setSelectedBlock(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        )}
      </Card>

      <FocusBlockModal
        isOpen={isModalOpen || !!editingBlock}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBlock(null);
        }}
        existingBlock={editingBlock}
      />
    </>
  );
}
