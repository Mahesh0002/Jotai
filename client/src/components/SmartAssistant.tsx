import { useCallback, useEffect, useRef, useState } from "react";
import { RUNNER_API_URL } from "@/lib/config";
import { X, Mic, MicOff, Send, Bot, Check, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { conversationsApi, type ConversationMessage } from "@/lib/api";

type ProposedAction = { type: string; payload: any; actionId?: string };
type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  proposedActions?: ProposedAction[] | undefined;
  actionStatus?: "pending" | "accepted" | "declined" | undefined;
};

/** Minimal local typings for the browser SpeechRecognition API. */
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;
}

function sessionKey() {
  try {
    const existing = localStorage.getItem("jotai_session");
    if (existing) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem("jotai_session", created);
    return created;
  } catch {
    return `session-${Date.now()}`;
  }
}

export function SmartAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const sessionIdRef = useRef<string>(sessionKey());
  const sendRef = useRef<(text: string) => Promise<void>>(async () => {});
  const loadedRef = useRef(false);

  const loadConversation = useCallback(async () => {
    try {
      const conversation = await conversationsApi.get(sessionIdRef.current);
      const persisted = (conversation.messages ?? [])
        .filter((m: ConversationMessage) => m.role === "user" || m.role === "assistant")
        .map((m: ConversationMessage) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          text: m.content,
        }));
      // A prompt from the rail can arrive while the conversation is loading.
      setMessages((prev) => (prev.length > 0 ? prev : persisted));
    } catch {
      // Backend may be starting up; keep the chat usable.
    }
  }, []);

  useEffect(() => {
    if (open && !loadedRef.current) {
      loadedRef.current = true;
      void loadConversation();
    }
  }, [open, loadConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const userText = text.trim();
      if (!userText || loading) return;

      setLoading(true);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: userText }]);

      try {
        const response = await fetch(`${RUNNER_API_URL}/runner/trigger`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent: userText, sessionId: sessionIdRef.current }),
        });
        const data = await response.json();

        const reply =
          data?.data?.reply ??
          data?.reply ??
          (typeof data?.data === "string" ? data.data : null) ??
          "I processed your request but received an empty response.";

        const invalidations: string[] =
          data?.data?.ui?.invalidate ?? data?.data?.actionResult?.ui?.invalidate ?? [];
        if (Array.isArray(invalidations) && invalidations.length > 0) {
          window.dispatchEvent(new CustomEvent("jotai-invalidate", { detail: invalidations }));
        }

        const proposedActions: ProposedAction[] =
          data?.data?.proposedActions ??
          (data?.data?.actionResult?.confirmationRequired
            ? [
                {
                  type: data.data.actionResult.actionName,
                  payload: data.data.actionResult.params,
                  actionId: data.data.actionResult.actionId,
                },
              ]
            : []);

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: reply,
            proposedActions,
            actionStatus: proposedActions.length > 0 ? "pending" : undefined,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: "Local assistant is offline. Check that the runner is running on port 8000.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  sendRef.current = sendMessage;

  useEffect(() => {
    const handleOpen = (event: Event) => {
      setOpen(true);
      const prompt = (event as CustomEvent<string>).detail;
      if (typeof prompt === "string" && prompt.trim()) {
        void sendRef.current(prompt);
      }
    };
    window.addEventListener("open-ai-assistant", handleOpen);
    return () => window.removeEventListener("open-ai-assistant", handleOpen);
  }, []);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Voice input is not available in this browser. You can type your request instead.",
        },
      ]);
      return;
    }
    const recognition = new Recognition();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript;
      if (typeof transcript === "string") setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const clearChat = async () => {
    const previousId = sessionIdRef.current;
    sessionIdRef.current = crypto.randomUUID();
    try {
      localStorage.setItem("jotai_session", sessionIdRef.current);
    } catch {
      // Ignore storage failures; the in-memory session still works.
    }
    setMessages([]);
    loadedRef.current = true;
    try {
      await conversationsApi.remove(previousId);
    } catch {
      // Nothing to delete if the conversation was never created.
    }
  };

  const handleAction = async (msgId: string, action: ProposedAction, accepted: boolean) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, actionStatus: accepted ? "accepted" : "declined" } : m,
      ),
    );
    if (!accepted) return;

    setLoading(true);
    try {
      const response = await fetch(`${RUNNER_API_URL}/runner/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionName: action.type,
          params: action.payload,
          actionId: action.actionId,
        }),
      });
      const data = await response.json();
      const invalidations: string[] =
        data?.data?.actionResult?.ui?.invalidate ?? data?.data?.ui?.invalidate ?? [];
      if (Array.isArray(invalidations) && invalidations.length > 0) {
        window.dispatchEvent(new CustomEvent("jotai-invalidate", { detail: invalidations }));
      }
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data?.data?.reply ?? "Action executed.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: "That action could not be executed." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-xl border border-purple-400/25 bg-surface/95 shadow-panel backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-border/70 bg-surface px-4 py-3">
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
                onClick={() => void clearChat()}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-7 w-7 text-muted-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Bot className="mb-3 size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">How can I assist your focus today?</p>
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
                        ? "rounded-br-sm bg-purple-500/20 text-purple-100"
                        : "rounded-bl-sm border border-border/50 bg-secondary text-foreground"
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.proposedActions && msg.proposedActions.length > 0 && (
                    <div className="mt-1 w-[85%] space-y-2">
                      {msg.proposedActions.map((action, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3 text-sm"
                        >
                          <p className="mb-2 flex items-center gap-1.5 font-medium text-purple-200">
                            <Bot className="size-3.5" /> Proposed Action
                          </p>
                          <p className="mb-3 text-xs text-muted-foreground">{action.type}</p>
                          {msg.actionStatus === "pending" ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="h-7 w-full bg-purple-600 text-xs hover:bg-purple-500"
                                onClick={() => void handleAction(msg.id, action, true)}
                              >
                                <Check className="mr-1 size-3" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 w-full text-xs"
                                onClick={() => void handleAction(msg.id, action, false)}
                              >
                                Decline
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs font-medium opacity-60">
                              {msg.actionStatus === "accepted" ? (
                                <span className="text-emerald-400">Approved &amp; executed</span>
                              ) : (
                                <span className="flex items-center gap-1 text-red-400">
                                  <XCircle className="size-3.5" /> Declined
                                </span>
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
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-border/50 bg-secondary px-4 py-3">
                  {[0, 0.2, 0.4].map((delay) => (
                    <motion.div
                      key={delay}
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay }}
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border/70 bg-surface/50 p-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background/50 p-1">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-md ${isListening ? "text-coral" : "text-muted-foreground"}`}
                onClick={toggleListening}
                aria-label={isListening ? "Stop voice input" : "Start voice input"}
              >
                {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </Button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void sendMessage(input);
                    setInput("");
                  }
                }}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <Button
                size="icon"
                className="h-8 w-8 rounded-md bg-purple-500/20 text-purple-300 hover:bg-purple-500 hover:text-white"
                onClick={() => {
                  void sendMessage(input);
                  setInput("");
                }}
                disabled={loading || !input.trim()}
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
