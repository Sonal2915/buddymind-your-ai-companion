import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Download, FileText, TrendingUp, Heart, Brain, Sparkles, Calendar, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";

// --- Mock data (would come from DB in production) ---
const weeklyMoodData = [
  { day: "Mon", score: 3.5 }, { day: "Tue", score: 4 }, { day: "Wed", score: 2.5 },
  { day: "Thu", score: 4.5 }, { day: "Fri", score: 3 }, { day: "Sat", score: 5 }, { day: "Sun", score: 4 },
];

const emotionBreakdown = [
  { name: "Happy", value: 35, color: "hsl(142, 60%, 50%)" },
  { name: "Calm", value: 25, color: "hsl(200, 80%, 55%)" },
  { name: "Neutral", value: 20, color: "hsl(220, 15%, 55%)" },
  { name: "Sad", value: 10, color: "hsl(48, 80%, 55%)" },
  { name: "Stressed", value: 10, color: "hsl(25, 80%, 55%)" },
];

const radarData = [
  { metric: "Mood", value: 78 }, { metric: "Sleep", value: 65 },
  { metric: "Stress Mgmt", value: 70 }, { metric: "Social", value: 55 },
  { metric: "Activity", value: 60 }, { metric: "Mindfulness", value: 82 },
];

const chatSentimentData = [
  { day: "Mon", positive: 4, negative: 1, neutral: 2 },
  { day: "Tue", positive: 5, negative: 0, neutral: 3 },
  { day: "Wed", positive: 2, negative: 3, neutral: 1 },
  { day: "Thu", positive: 6, negative: 0, neutral: 2 },
  { day: "Fri", positive: 3, negative: 2, neutral: 2 },
  { day: "Sat", positive: 5, negative: 0, neutral: 1 },
  { day: "Sun", positive: 4, negative: 1, neutral: 3 },
];

const insights = [
  { icon: TrendingUp, title: "Mood Improving", text: "Your average mood increased by 12% compared to last week. Keep it up!" },
  { icon: Heart, title: "Breathing Sessions", text: "You completed 5 breathing exercises this week — 2 more than last week." },
  { icon: Brain, title: "Chat Engagement", text: "You had 23 conversations with BuddyMind. Most discussions were positive." },
  { icon: Shield, title: "Stress Patterns", text: "Stress peaks on Wednesday afternoons. Consider scheduling a break." },
];

const recommendations = [
  "Try a 10-minute morning meditation to start your day positively.",
  "Journaling before bed can help process daily emotions.",
  "Your social score is lowest — consider reaching out to a friend this week.",
  "Wednesday seems challenging — schedule a breathing exercise around 3 PM.",
];

const tooltipStyle = {
  background: "hsl(230, 40%, 12%)",
  border: "1px solid hsl(230, 25%, 20%)",
  borderRadius: "12px",
  color: "hsl(220, 20%, 92%)",
};

const ReportPage = () => {
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const avgMood = (weeklyMoodData.reduce((a, b) => a + b.score, 0) / weeklyMoodData.length).toFixed(1);
  const bestDay = weeklyMoodData.reduce((a, b) => (b.score > a.score ? b : a)).day;
  const totalChats = chatSentimentData.reduce((a, b) => a + b.positive + b.negative + b.neutral, 0);

  const handleDownloadPDF = async () => {
    setGenerating(true);
    // Dynamically import html2canvas + jspdf
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, {
      backgroundColor: "#0d1026",
      scale: 2,
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
    pdf.save("BuddyMind_Weekly_Report.pdf");
    setGenerating(false);
  };

  const SectionCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`glass-card p-6 ${className}`}
    >
      {children}
    </motion.div>
  );

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <div className="pt-24 pb-12 px-4 container mx-auto max-w-5xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Weekly Report</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">Mental Health Report</h1>
            <p className="text-muted-foreground mt-1">
              <Calendar className="w-4 h-4 inline mr-1 -mt-0.5" />
              March 20 – March 26, 2026
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleDownloadPDF}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground glow-primary disabled:opacity-50 transition-opacity"
          >
            <Download className="w-4 h-4" />
            {generating ? "Generating…" : "Export PDF"}
          </motion.button>
        </motion.div>

        {/* ===== REPORT CONTENT (captured for PDF) ===== */}
        <div ref={reportRef} className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Avg Mood", value: `${avgMood}/5`, icon: TrendingUp },
              { label: "Best Day", value: bestDay, icon: Sparkles },
              { label: "Total Chats", value: totalChats.toString(), icon: Brain },
              { label: "Sessions", value: "5", icon: Heart },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold font-display text-foreground">{s.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mood trend + Emotion pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard delay={0.1}>
              <h3 className="font-display font-semibold text-foreground mb-4">Weekly Mood Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyMoodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 25%, 20%)" />
                  <XAxis dataKey="day" stroke="hsl(220, 15%, 55%)" fontSize={12} />
                  <YAxis domain={[0, 5]} stroke="hsl(220, 15%, 55%)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="score" stroke="hsl(263, 70%, 55%)" strokeWidth={2} dot={{ fill: "hsl(263, 70%, 55%)", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard delay={0.15}>
              <h3 className="font-display font-semibold text-foreground mb-4">Emotion Breakdown</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={emotionBreakdown} cx="50%" cy="50%" outerRadius={75} innerRadius={40} dataKey="value" paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {emotionBreakdown.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </SectionCard>
          </div>

          {/* Sentiment stacked bar + Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard delay={0.2}>
              <h3 className="font-display font-semibold text-foreground mb-4">Chat Sentiment Analysis</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chatSentimentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 25%, 20%)" />
                  <XAxis dataKey="day" stroke="hsl(220, 15%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(220, 15%, 55%)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="positive" stackId="a" fill="hsl(142, 60%, 50%)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="neutral" stackId="a" fill="hsl(220, 15%, 55%)" />
                  <Bar dataKey="negative" stackId="a" fill="hsl(0, 65%, 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard delay={0.25}>
              <h3 className="font-display font-semibold text-foreground mb-4">Wellness Radar</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData} outerRadius={70}>
                  <PolarGrid stroke="hsl(230, 25%, 20%)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(220, 15%, 55%)", fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="hsl(263, 70%, 55%)" fill="hsl(263, 70%, 55%)" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </SectionCard>
          </div>

          {/* Insights */}
          <SectionCard delay={0.3}>
            <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Key Insights
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {insights.map((ins, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <ins.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{ins.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{ins.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Recommendations */}
          <SectionCard delay={0.35}>
            <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <Heart className="w-4 h-4 text-accent" /> Personalized Recommendations
            </h3>
            <ul className="space-y-3">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex gap-3 items-start text-sm">
                  <span className="w-6 h-6 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground leading-relaxed">{rec}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
