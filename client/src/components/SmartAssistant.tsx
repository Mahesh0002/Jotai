import { useState, useRef, useEffect } from "react";
import { BACKEND_API_URL, RUNNER_API_URL } from "@/lib/config";
import { X, Mic, MicOff, Send, Bot, Check, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

type ProposedAction = { type: string; payload: any; actionId?: string };
type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  proposedActions?: ProposedAction[];
  actionStatus?: "pending" | "accepted" | "declined";
};

export function SmartAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const sessionIdRef = useRef<string>(
    (() => {
      try {
        const existing = localStorage.getItem("jotai_session");
        if (existing) return existing;
        const created = crypto.randomUUID();
        localStorage.setItem("jotai_session", created);
        return created;
      } catch (e) {
        return `session-${Date.now()}`;
      }
    })(),
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem("jotai_chat");
      if (stored) setMessages(JSON.parse(stored));
    } catch (e) {}
  }, []);

  useEffect(() => {
    localStorage.setItem("jotai_chat", JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("open-ai-assistant", handleOpen);
    return () => window.removeEventListener("open-ai-assistant", handleOpen);
  }, []);

  const toggleChat = () => setOpen((prev) => !prev);
  const clearChat = () => setMessages([]);

  const handleAction = async (msgId: string, action: ProposedAction, accepted: boolean) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, actionStatus: accepted ? "accepted" : "declined" } : m,
      ),
    );
    if (accepted) {
      setLoading(true);
      try {
        const response = await fetch(`${RUNNER_API_URL}/runner/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionName: action.type,
            params: action.payload,
            actionId: action.actionId
          }),
        });

        const data = await response.json();
        if (data.data?.actionResult?.ui?.invalidate) {
          window.dispatchEvent(
            new CustomEvent("jotai-invalidate", { detail: data.data.actionResult.ui.invalidate })
          );
          // UI updates via TanStack Query invalidation — no page reload needed
        }
        
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            text: data.data?.reply || data.message || "Action executed.",
          },
        ]);
      } catch (e) {
        console.error("Action execution failed:", e);
      } finally {
        setLoading(false);
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", text: userMsg }]);

    try {
      const response = await fetch(`${RUNNER_API_URL}/runner/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: userMsg,
          sessionId: sessionIdRef.current
        }),
      });

      const data = await response.json();

      if (data.success || data.data) {
        const replyText =
          data.data?.reply ||
          data.data?.text ||
          data.reply ||
          (typeof data.data === "string"
            ? data.data
            : "I processed your request but received an empty response.");
            
        // Check for UI invalidations from standard ActionResult
        if (data.data?.actionResult?.ui?.invalidate) {
          window.dispatchEvent(
            new CustomEvent("jotai-invalidate", { detail: data.data.actionResult.ui.invalidate })
          );
          // UI updates via TanStack Query invalidation — no page reload needed
        }

        let proposedActions = data.data?.proposedActions || [];
        
        if (data.data?.actionResult?.confirmationRequired) {
          proposedActions = [{
             type: data.data.actionResult.actionName,
             payload: data.data.actionResult.params,
             actionId: data.data.actionResult.actionId
          }];
        }

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            text: replyText,
            proposedActions,
            actionStatus: proposedActions.length > 0 ? "pending" : undefined,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            text: data.message || "I encountered an error connecting to my core.",
          },
        ]);
      }
    } catch (error) {
      console.error("Chat API Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: "System offline. Please check the Runner connection on port 8000.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-xl border border-purple-400/25 bg-surface/95 shadow-panel backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 bg-surface">
              <div className="flex items-center gap-3">
                <span className="icon-badge icon-badge-purple">
                  <Bot className="size-4" />
                </span>
                <div>
                  <p className="section-eyebrow text-purple-300">JŌTAI AI</p>
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    Smart Assistant
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleChat}
                  className="h-7 w-7 text-muted-foreground"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Bot className="size-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    How can I assist your focus today?
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-purple-500/20 text-purple-100 rounded-br-sm"
                          : "bg-secondary text-foreground rounded-bl-sm border border-border/50"
                      }`}
                    >
                      {msg.text}
                    </div>
                    {/* Action Cards */}
                    {msg.proposedActions && msg.proposedActions.length > 0 && (
                      <div className="w-[85%] space-y-2 mt-1">
                        {msg.proposedActions.map((action, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3 text-sm"
                          >
                            <p className="font-medium text-purple-200 flex items-center gap-1.5 mb-2">
                              <Bot className="size-3.5" /> Proposed Action
                            </p>
                            <p className="text-muted-foreground text-xs mb-3">
                              {action.type === "task.delete"
                                ? `Permanently delete this task?`
                                : action.type === "COMPLETE_GOAL"
                                  ? `Mark quest "${action.payload.goalTitle || action.payload.goalId}" as complete.`
                                  : action.type === "START_TIMER"
                                    ? "Start the focus timer."
                                    : "Perform dashboard action."}
                            </p>
                            {msg.actionStatus === "pending" ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="h-7 bg-purple-600 hover:bg-purple-500 text-xs w-full"
                                  onClick={() => handleAction(msg.id, action, true)}
                                >
                                  <Check className="size-3 mr-1" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs w-full"
                                  onClick={() => handleAction(msg.id, action, false)}
                                >
                                  Decline
                                </Button>
                              </div>
                            ) : (
                              <div className="text-xs font-medium flex items-center gap-1.5 opacity-60">
                                {msg.actionStatus === "accepted" ? (
                                  <>
                                    <Check className="size-3.5 text-emerald-400" />{" "}
                                    <span className="text-emerald-400">Approved & Executed</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="size-3.5 text-red-400" />{" "}
                                    <span className="text-red-400">Declined</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3 border border-border/50 flex items-center gap-1">
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                    />
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                    />
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border/70 p-3 bg-surface/50">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background/50 p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded-md ${isListening ? "text-coral" : "text-muted-foreground"}`}
                  onClick={() => setIsListening(!isListening)}
                >
                  {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                </Button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-md bg-purple-500/20 text-purple-300 hover:bg-purple-500 hover:text-white"
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
