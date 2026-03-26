import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Plus, TrendingUp, Calendar, Smile, Frown, Meh, Angry, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";

const moodEmojis = [
  { label: "Happy", icon: Smile, color: "text-green-400", value: 5 },
  { label: "Calm", icon: Meh, color: "text-accent", value: 4 },
  { label: "Neutral", icon: Meh, color: "text-muted-foreground", value: 3 },
  { label: "Sad", icon: Frown, color: "text-yellow-400", value: 2 },
  { label: "Stressed", icon: AlertTriangle, color: "text-orange-400", value: 1 },
  { label: "Angry", icon: Angry, color: "text-destructive", value: 0 },
];

const weeklyData = [
  { day: "Mon", score: 4 },
  { day: "Tue", score: 3 },
  { day: "Wed", score: 5 },
  { day: "Thu", score: 2 },
  { day: "Fri", score: 4 },
  { day: "Sat", score: 5 },
  { day: "Sun", score: 4 },
];

const monthlyData = [
  { week: "W1", happy: 3, sad: 1, neutral: 2, stressed: 1 },
  { week: "W2", happy: 4, sad: 0, neutral: 2, stressed: 1 },
  { week: "W3", happy: 2, sad: 2, neutral: 1, stressed: 2 },
  { week: "W4", happy: 5, sad: 0, neutral: 1, stressed: 1 },
];

const MoodDashboard = () => {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [entries, setEntries] = useState(weeklyData);

  const handleAddMood = () => {
    if (selectedMood === null) return;
    const today = new Date().toLocaleDateString("en", { weekday: "short" });
    setEntries((prev) => [...prev.slice(-6), { day: today, score: selectedMood }]);
    setSelectedMood(null);
  };

  const avgMood = (entries.reduce((a, b) => a + b.score, 0) / entries.length).toFixed(1);

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <div className="pt-24 pb-12 px-4 container mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Mood Dashboard</h1>
          <p className="text-muted-foreground mb-8">Track and visualize your emotional wellness journey.</p>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Average Mood", value: `${avgMood}/5`, icon: TrendingUp },
            { label: "Entries This Week", value: entries.length.toString(), icon: Calendar },
            { label: "Best Day", value: entries.reduce((a, b) => (b.score > a.score ? b : a)).day, icon: Smile },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold font-display text-foreground">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly line chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <h3 className="font-display font-semibold text-foreground mb-4">Weekly Mood Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={entries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 25%, 20%)" />
                <XAxis dataKey="day" stroke="hsl(220, 15%, 55%)" fontSize={12} />
                <YAxis domain={[0, 5]} stroke="hsl(220, 15%, 55%)" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "hsl(230, 40%, 12%)", border: "1px solid hsl(230, 25%, 20%)", borderRadius: "12px", color: "hsl(220, 20%, 92%)" }}
                />
                <Line type="monotone" dataKey="score" stroke="hsl(263, 70%, 55%)" strokeWidth={2} dot={{ fill: "hsl(263, 70%, 55%)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Monthly bar chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <h3 className="font-display font-semibold text-foreground mb-4">Monthly Emotion Breakdown</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 25%, 20%)" />
                <XAxis dataKey="week" stroke="hsl(220, 15%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(220, 15%, 55%)" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "hsl(230, 40%, 12%)", border: "1px solid hsl(230, 25%, 20%)", borderRadius: "12px", color: "hsl(220, 20%, 92%)" }}
                />
                <Bar dataKey="happy" fill="hsl(142, 60%, 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sad" fill="hsl(48, 80%, 55%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="neutral" fill="hsl(220, 15%, 55%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="stressed" fill="hsl(25, 80%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Add mood */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="font-display font-semibold text-foreground mb-4">How are you feeling right now?</h3>
          <div className="flex flex-wrap gap-3 mb-6">
            {moodEmojis.map((mood) => (
              <motion.button
                key={mood.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedMood(mood.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                  selectedMood === mood.value
                    ? "bg-primary/15 border-primary/50 text-primary"
                    : "border-border/50 text-muted-foreground hover:border-border"
                }`}
              >
                <mood.icon className={`w-4 h-4 ${mood.color}`} />
                {mood.label}
              </motion.button>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddMood}
            disabled={selectedMood === null}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground glow-primary disabled:opacity-30 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Log Mood
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default MoodDashboard;
