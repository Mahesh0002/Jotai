import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Suggestion = {
  _id: string;
  type: string;
  priority: "low" | "medium" | "high";
  title: string;
  message: string;
  targetModule: string;
  actions: string[];
  status: string;
};

export function ProactiveSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    fetchSuggestions();
    
    // Poll for new suggestions every 10 seconds for Phase 1B
    const interval = setInterval(fetchSuggestions, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchSuggestions = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/v1/assistant/suggestions");
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch proactive suggestions:", e);
    }
  };

  const handleAction = async (id: string, action: "accept" | "dismiss") => {
    try {
      // Optimistically remove from UI
      setSuggestions((prev) => prev.filter((s) => s._id !== id));
      
      await fetch(`http://localhost:5000/api/v1/assistant/suggestions/${id}/${action}`, {
        method: "POST"
      });
      
      // If we accepted an action, we might want to refresh the UI
      if (action === "accept") {
        window.location.reload();
      }
    } catch (e) {
      console.error(`Failed to ${action} suggestion:`, e);
      // Revert optimistic update (could be added here)
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-40 w-[320px] flex flex-col gap-3">
      <AnimatePresence>
        {suggestions.map((suggestion) => (
          <motion.div
            key={suggestion._id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className={`overflow-hidden rounded-xl border bg-surface/95 p-4 shadow-panel backdrop-blur-xl ${
              suggestion.priority === "high" 
                ? "border-red-500/30" 
                : "border-purple-500/30"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className={`size-4 ${suggestion.priority === "high" ? "text-red-400" : "text-purple-400"}`} />
                <h3 className="text-sm font-semibold text-foreground">
                  {suggestion.title}
                </h3>
              </div>
              <button 
                onClick={() => handleAction(suggestion._id, "dismiss")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              {suggestion.message}
            </p>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className={`h-8 w-full text-xs ${
                  suggestion.priority === "high" 
                    ? "bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white" 
                    : "bg-purple-500/20 text-purple-300 hover:bg-purple-500 hover:text-white"
                }`}
                onClick={() => handleAction(suggestion._id, "accept")}
              >
                <CheckCircle2 className="size-3.5 mr-1.5" />
                Review Plan
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
