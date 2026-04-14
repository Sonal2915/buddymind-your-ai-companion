import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { History, ClipboardList, MessageCircle, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type QuestionnaireResult = {
  id: string;
  emotional_state: string;
  total_score: number;
  created_at: string;
};

type ChatSession = {
  session_id: string;
  message_count: number;
  last_message: string;
  created_at: string;
};

const emotionEmoji: Record<string, string> = {
  happy: "😊",
  calm: "😌",
  neutral: "😐",
  stressed: "😰",
  anxious: "😟",
  sad: "😢",
  depressed: "😞",
};

const HistoryPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"assessments" | "chats">("assessments");
  const [results, setResults] = useState<QuestionnaireResult[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const [qRes, cRes] = await Promise.all([
        supabase
          .from("questionnaire_results")
          .select("id, emotional_state, total_score, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("chat_messages")
          .select("session_id, content, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      setResults((qRes.data as QuestionnaireResult[]) || []);

      // Group chat messages by session
      const sessionMap = new Map<string, { count: number; last: string; date: string }>();
      for (const msg of (cRes.data || []) as { session_id: string; content: string; created_at: string }[]) {
        const existing = sessionMap.get(msg.session_id);
        if (!existing) {
          sessionMap.set(msg.session_id, { count: 1, last: msg.content, date: msg.created_at });
        } else {
          existing.count++;
        }
      }
      setSessions(
        Array.from(sessionMap.entries()).map(([sid, v]) => ({
          session_id: sid,
          message_count: v.count,
          last_message: v.last,
          created_at: v.date,
        }))
      );
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <History className="w-6 h-6 text-primary" />
        <h1 className="font-display text-2xl font-bold text-foreground">History</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/50 mb-6 max-w-xs">
        {[
          { key: "assessments" as const, label: "Assessments", icon: ClipboardList },
          { key: "chats" as const, label: "Chats", icon: MessageCircle },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === "assessments" ? (
        results.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No assessments yet. Take your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 flex items-center gap-4"
              >
                <span className="text-3xl">{emotionEmoji[r.emotional_state] || "🔮"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground capitalize">{r.emotional_state}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(r.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">Score: {r.total_score}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No chat sessions yet. Start a conversation!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s, i) => (
            <motion.div
              key={s.session_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(s.created_at)}
                </p>
                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                  {s.message_count} messages
                </span>
              </div>
              <p className="text-sm text-foreground truncate">{s.last_message}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
