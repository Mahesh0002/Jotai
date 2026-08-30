import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Mic, MicOff, Send, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

type Message = { id: string; role: "user" | "assistant"; text: string };

export function SmartAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);

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

  const toggleChat = () => setOpen((prev) => !prev);
  const clearChat = () => setMessages([]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", text: userMsg }]);

    try {
      const response = await fetch("http://localhost:5000/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Backend expects 'prompt', not 'message'
        body: JSON.stringify({ prompt: userMsg, context: "Be a helpful focus and productivity assistant." }),
      });
      
      const data = await response.json();
      
      if (data.success || data.data) {
        // Handle both standard ApiResponse { success: true, data: { reply } } and raw data
        const replyText = data.data?.reply || data.data?.text || data.reply || (typeof data.data === 'string' ? data.data : "I processed your request but received an empty response.");
        setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", text: replyText }]);
      } else {
        setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", text: data.message || "I encountered an error connecting to my core." }]);
      }
    } catch (error) {
      console.error("Chat API Error:", error);
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", text: "System offline. Please check your backend connection on port 5000." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={toggleChat}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-purple-500 text-primary-foreground shadow-glow hover:bg-purple-400"
      >
        <Bot className="size-6" />
      </motion.button>

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
                <span className="icon-badge icon-badge-purple"><Bot className="size-4" /></span>
                <div>
                  <p className="section-eyebrow text-purple-300">JŌTAI AI</p>
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">Smart Assistant</h2>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={clearChat} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">Clear</Button>
                <Button variant="ghost" size="icon" onClick={toggleChat} className="h-7 w-7 text-muted-foreground"><X className="size-4" /></Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Bot className="size-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">How can I assist your focus today?</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                      msg.role === "user" 
                        ? "bg-purple-500/20 text-purple-100 rounded-br-sm" 
                        : "bg-secondary text-foreground rounded-bl-sm border border-border/50"
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3 border border-border/50 flex items-center gap-1">
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
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
                  className={`h-8 w-8 rounded-md ${isListening ? 'text-coral' : 'text-muted-foreground'}`}
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
