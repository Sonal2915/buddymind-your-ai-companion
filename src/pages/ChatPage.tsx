import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  sentiment?: string;
};

const sentimentColors: Record<string, string> = {
  positive: "bg-green-500/20 text-green-400",
  negative: "bg-red-500/20 text-red-400",
  neutral: "bg-muted text-muted-foreground",
  stressed: "bg-orange-500/20 text-orange-400",
  anxious: "bg-yellow-500/20 text-yellow-400",
};

const aiResponses = [
  { text: "I hear you, and I want you to know that your feelings are completely valid. It's okay to feel this way. Would you like to try a quick breathing exercise together?", sentiment: "positive" },
  { text: "That sounds really challenging. Remember, it's a sign of strength to talk about how you feel. What's one small thing that brought you comfort today?", sentiment: "positive" },
  { text: "I'm here for you. Sometimes just expressing what we feel can be a powerful step. Would you like to explore some coping strategies?", sentiment: "positive" },
  { text: "Thank you for sharing that with me. Your mental health journey is unique, and every step forward counts — even the small ones. 💜", sentiment: "positive" },
  { text: "It sounds like you're carrying a lot right now. Let's take it one moment at a time. Have you tried journaling your thoughts? It can help process emotions.", sentiment: "neutral" },
];

const detectSentiment = (text: string): string => {
  const lower = text.toLowerCase();
  if (/sad|depress|cry|hurt|pain|lonely|hopeless|anxious|worry|scared/.test(lower)) return "stressed";
  if (/angry|mad|frustrated|hate|annoyed/.test(lower)) return "negative";
  if (/happy|great|good|love|joy|excit|thank|wonderful/.test(lower)) return "positive";
  if (/stress|overwhelm|pressure|tired|exhaust/.test(lower)) return "anxious";
  return "neutral";
};

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      content: "Hi there! 💜 I'm BuddyMind, your AI mental health companion. I'm here to listen, support, and help you feel better. How are you feeling today?",
      sentiment: "positive",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userSentiment = detectSentiment(input);
    const userMsg: Message = { id: Date.now(), role: "user", content: input, sentiment: userSentiment };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const resp = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: resp.text, sentiment: resp.sentiment },
      ]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col pt-16 max-w-3xl mx-auto w-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "assistant" ? "bg-primary/20" : "bg-accent/20"
                }`}>
                  {msg.role === "assistant" ? <Bot className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-accent" />}
                </div>
                <div className={`max-w-[75%] ${msg.role === "user" ? "text-right" : ""}`}>
                  <div className={`glass-card p-4 text-sm leading-relaxed ${
                    msg.role === "user" ? "bg-primary/15 border-primary/20" : ""
                  }`}>
                    {msg.content}
                  </div>
                  {msg.sentiment && (
                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${sentimentColors[msg.sentiment] || sentimentColors.neutral}`}>
                      {msg.sentiment}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="glass-card p-4 flex gap-1">
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border/30">
          <div className="glass-card flex items-center gap-2 p-2 pl-4">
            <Sparkles className="w-4 h-4 text-primary/50 shrink-0" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="How are you feeling today?"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
