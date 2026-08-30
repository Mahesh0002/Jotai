import { createFileRoute } from "@tanstack/react-router";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
import { useState } from "react";
import { Conversation, ConversationContent } from "../components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "../components/ai-elements/message";
import { PromptInput } from "../components/ai-elements/prompt-input";
import type { UIMessage } from "ai";

function Index() {
  const [messages, setMessages] = useState<UIMessage[]>([
    { id: "1", role: "assistant", parts: [{ type: "text", text: "Hello! I am your updated Smart Assistant. How can I help you today?" }] }
  ]);

  return (
    <div className="flex h-screen w-full flex-col bg-background p-4 sm:p-8">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden rounded-xl border border-border shadow-sm">
        
        {/* Header */}
        <div className="flex items-center border-b border-border bg-muted/20 px-6 py-4">
          <h2 className="font-semibold text-foreground">Smart Assistant Preview</h2>
        </div>

        {/* Chat Area */}
        <Conversation className="bg-surface">
          <ConversationContent>
            {messages.map((msg) => (
              <Message key={msg.id} from={msg.role}>
                <MessageContent>
                  <MessageResponse>{msg.parts.map(p => p.type === 'text' ? p.text : '').join('')}</MessageResponse>
                </MessageContent>
              </Message>
            ))}
          </ConversationContent>
        </Conversation>

        {/* Input Area */}
        <div className="border-t border-border bg-surface p-4">
          <PromptInput
            onSubmit={(msg) => {
              setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", parts: [{ type: "text", text: msg.text }] }]);
            }}
          />
        </div>
      </div>
    </div>
  );
}
