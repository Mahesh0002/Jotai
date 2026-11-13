import { createFileRoute } from "@tanstack/react-router";
import { FocusProvider } from "@/contexts/FocusContext";
import { FocusHeader } from "@/components/focus/FocusHeader";
import { DeepWorkTimer } from "@/components/focus/DeepWorkTimer";
import { CurrentTaskCard } from "@/components/focus/CurrentTaskCard";
import { SessionNotesCard } from "@/components/focus/SessionNotesCard";
import { FocusEnvironmentCard } from "@/components/focus/FocusEnvironmentCard";
import { DistractionTracker } from "@/components/focus/DistractionTracker";
import { SessionCompletion } from "@/components/focus/SessionCompletion";

export const Route = createFileRoute("/focus")({
  component: Focus,
});

function FocusContent() {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
      <FocusHeader />

      <div className="flex flex-col gap-6 max-w-6xl mx-auto mt-6">
        {/* Main Grid: Timer (Left) & Supporting Tools (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column (Timer) spans 7 cols */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full">
            <DeepWorkTimer />
          </div>

          {/* Right Column (Task, Notes, Distractions) spans 5 cols */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6 h-full">
            <CurrentTaskCard />
            <DistractionTracker />
            <SessionNotesCard />
          </div>
        </div>

        {/* Bottom Area: Audio / Environment */}
        <div className="w-full mt-2">
          <FocusEnvironmentCard />
        </div>
      </div>

      <SessionCompletion />
    </div>
  );
}

function Focus() {
  return (
    <FocusProvider>
      <FocusContent />
    </FocusProvider>
  );
}
