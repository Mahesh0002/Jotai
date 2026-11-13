import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useHabits } from "@/hooks/useHabits";
import { Habit } from "@/lib/api";

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingHabit?: Habit | null;
}

export function HabitModal({ isOpen, onClose, existingHabit }: HabitModalProps) {
  const { createHabit, updateHabit } = useHabits(new Date().toLocaleDateString("en-CA"));

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("✦");
  const [category, setCategory] = useState("Productivity");
  const [frequencyType, setFrequencyType] = useState<Habit["frequencyType"]>("every_day");
  const [time, setTime] = useState("");
  const [targetDurationMinutes, setTargetDurationMinutes] = useState("10");
  const [xpReward, setXpReward] = useState("10");

  useEffect(() => {
    if (isOpen) {
      if (existingHabit) {
        setName(existingHabit.name);
        setDescription(existingHabit.description || "");
        setIcon(existingHabit.icon);
        setCategory(existingHabit.category);
        setFrequencyType(existingHabit.frequencyType);
        setTime(existingHabit.time || "");
        setTargetDurationMinutes(existingHabit.targetDurationMinutes?.toString() || "10");
        setXpReward(existingHabit.xpReward.toString());
      } else {
        setName("");
        setDescription("");
        setIcon("✦");
        setCategory("Productivity");
        setFrequencyType("every_day");
        setTime("09:00");
        setTargetDurationMinutes("10");
        setXpReward("10");
      }
    }
  }, [isOpen, existingHabit]);

  if (!isOpen) return null;

  const handleSave = () => {
    const payload: Partial<Habit> = {
      name,
      description,
      icon,
      category,
      frequencyType,
      time,
      targetDurationMinutes: parseInt(targetDurationMinutes),
      xpReward: parseInt(xpReward),
    };

    if (existingHabit) {
      updateHabit.mutate({ id: existingHabit._id, data: payload }, { onSuccess: onClose });
    } else {
      createHabit.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-[420px] p-6 animate-in zoom-in-95 duration-200 shadow-2xl border-zinc-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {existingHabit ? "Edit Habit" : "Create Habit"}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-16">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Icon
              </label>
              <input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={2}
                className="w-full text-center rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 text-lg text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Habit Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Morning Planning"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Description (Optional)
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Plan tomorrow's priorities..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none cursor-pointer"
              >
                <option value="Productivity">Productivity</option>
                <option value="Health">Health</option>
                <option value="Learning">Learning</option>
                <option value="Mindset">Mindset</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Frequency
              </label>
              <select
                value={frequencyType}
                onChange={(e) => setFrequencyType(e.target.value as any)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none cursor-pointer"
              >
                <option value="every_day">Every day</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekends">Weekends</option>
                <option value="custom">Custom...</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Duration
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={targetDurationMinutes}
                  onChange={(e) => setTargetDurationMinutes(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 pl-3 pr-8 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                  m
                </span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                XP Reward
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={xpReward}
                  onChange={(e) => setXpReward(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 pl-3 pr-8 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-500 font-bold">
                  XP
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!name.trim()}>
            {existingHabit ? "Save Changes" : "Create Habit"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
