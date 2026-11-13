import React, { useState, useEffect } from "react";
import { X, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useFocusBlocks } from "@/hooks/useFocusBlocks";
import { useTasks } from "@/hooks/useTasks";
import { FocusBlock, Task } from "@/lib/api";

interface FocusBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingBlock?: FocusBlock | null;
}

export function FocusBlockModal({ isOpen, onClose, existingBlock }: FocusBlockModalProps) {
  const { createBlock, updateBlock } = useFocusBlocks();
  const { tasks } = useTasks({ date: "today" });

  const [taskId, setTaskId] = useState("");
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("60");
  const [type, setType] = useState<FocusBlock["type"]>("deep_work");

  useEffect(() => {
    if (isOpen) {
      if (existingBlock) {
        setTaskId(existingBlock.taskId?._id || "");
        setTitle(existingBlock.title || "");

        const d = new Date(existingBlock.startTime);
        setStartTime(
          `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`,
        );
        setDuration(existingBlock.durationMinutes.toString());
        setType(existingBlock.type);
      } else {
        setTaskId("");
        setTitle("");
        // Predict next available block time? For now default 09:00
        setStartTime("09:00");
        setDuration("60");
        setType("deep_work");
      }
    }
  }, [isOpen, existingBlock]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Construct real Date objects for start and end time
    const today = new Date();
    const [hours, minutes] = startTime.split(":").map(Number);
    const start = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      hours,
      minutes,
      0,
      0,
    );
    const end = new Date(start.getTime() + parseInt(duration) * 60000);

    const payload: Partial<FocusBlock> = {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      durationMinutes: parseInt(duration),
      type,
    };

    if (taskId) {
      payload.taskId = taskId as any;
    } else {
      payload.title = title || "Custom Focus Session";
    }

    if (existingBlock) {
      updateBlock.mutate({ id: existingBlock._id, data: payload }, { onSuccess: onClose });
    } else {
      createBlock.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-[420px] p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary">
            {existingBlock ? "Edit Focus Block" : "Add Focus Block"}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Task (Optional)
            </label>
            <select
              value={taskId}
              onChange={(e) => {
                setTaskId(e.target.value);
                if (e.target.value) setTitle("");
              }}
              className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer appearance-none"
            >
              <option value="">-- None (Custom Session) --</option>
              {tasks
                .filter((t) => t.status !== "completed")
                .map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title}
                  </option>
                ))}
            </select>
          </div>

          {!taskId && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Session Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Read emails"
                className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Start Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface-elevated pl-9 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Duration (min)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Session Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer appearance-none"
            >
              <option value="deep_work">Deep Work</option>
              <option value="study">Study</option>
              <option value="creative">Creative</option>
              <option value="admin">Admin</option>
              <option value="reading">Reading</option>
              <option value="break">Break</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!taskId && !title.trim()}>
            {existingBlock ? "Save Changes" : "Add Block"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
