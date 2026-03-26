import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MessageCircle, Brain, BarChart3, Mic, Wind, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";

const features = [
  {
    icon: MessageCircle,
    title: "AI Therapy Chat",
    description: "Empathetic conversations with context-aware AI trained on mental health best practices.",
  },
  {
    icon: Mic,
    title: "Voice Emotion Analysis",
    description: "Record your voice and let AI detect your emotional state through tone and pitch analysis.",
  },
  {
    icon: BarChart3,
    title: "Mood Tracking",
    description: "Visualize your emotional journey with beautiful charts and daily mood entries.",
  },
  {
    icon: Wind,
    title: "Breathing Exercises",
    description: "Guided breathing animations to help you calm down and find your center.",
  },
  {
    icon: Brain,
    title: "Sentiment Analysis",
    description: "Real-time sentiment detection on every message to understand your emotional patterns.",
  },
  {
    icon: Sparkles,
    title: "Daily Motivation",
    description: "Personalized affirmations and motivational quotes to brighten your day.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const LandingPage = () => {
  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      <Navbar />

      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/10 blur-[100px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 rounded-full bg-primary/5 blur-[80px] animate-float" />
      </div>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Mental Wellness</span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
              <span className="text-foreground">Your AI</span>
              <br />
              <span className="gradient-text">Mental Health</span>
              <br />
              <span className="text-foreground">Companion</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              A safe, private space to talk, track your mood, and discover calm.
              BuddyMind uses empathetic AI to support your mental wellness journey.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/chat">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-3.5 rounded-xl font-semibold bg-primary text-primary-foreground glow-primary transition-all text-base"
                >
                  Start Chatting
                </motion.button>
              </Link>
              <Link to="/breathe">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-3.5 rounded-xl font-semibold bg-secondary text-secondary-foreground border border-border hover:border-primary/30 transition-all text-base"
                >
                  Try Breathing Exercise
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to <span className="gradient-text">Feel Better</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Powerful tools designed with empathy and backed by science.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={item} className="glass-card-hover p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-10"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-muted-foreground mb-8">
              Take the first step towards better mental health. It's free, private, and always available.
            </p>
            <Link to="/chat">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3.5 rounded-xl font-semibold bg-primary text-primary-foreground glow-primary"
              >
                Get Started Now
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          <p>© 2026 BuddyMind. Your mental health matters. 💜</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
