import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { preferencesApi } from "@/lib/api";

export function CalendarFeedCard() {
  const queryClient = useQueryClient();
  const { data: preference } = useQuery({
    queryKey: ["preferences"],
    queryFn: () => preferencesApi.get(),
    staleTime: 60_000,
  });
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (preference?.calendarIcsUrl) setUrl(preference.calendarIcsUrl);
  }, [preference?.calendarIcsUrl]);

  const save = async () => {
    try {
      await preferencesApi.update({ calendarIcsUrl: url.trim() });
      await queryClient.invalidateQueries({ queryKey: ["preferences"] });
      toast.success("Calendar feed saved");
    } catch (error) {
      toast.error(`Could not save calendar feed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
          <CalendarDays className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Calendar feed</h2>
          <p className="text-[11px] text-zinc-400">Subscribe to an .ics URL for real events.</p>
        </div>
      </div>
      <Input
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://…/calendar.ics"
        aria-label="Calendar ICS URL"
        className="h-9 border-zinc-800 bg-zinc-950 text-xs text-zinc-200"
      />
      <Button
        onClick={() => void save()}
        size="sm"
        className="mt-3 h-8 self-start bg-purple-600 text-xs text-white hover:bg-purple-500"
      >
        <Save className="mr-1.5 size-3.5" />
        Save feed
      </Button>
      <p className="mt-4 text-[10px] leading-relaxed text-zinc-600">
        Works with Google, Outlook, and Apple Calendar subscription links. If empty, the server
        falls back to CALENDAR_ICS_URL and then returns no events.
      </p>
    </div>
  );
}
