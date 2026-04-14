import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Play, Pause, RotateCcw, Quote } from "lucide-react";

const quotes = [
  "You are enough, just as you are.",
  "Breathe in peace, breathe out stress.",
  "This moment is all you need.",
  "Be gentle with yourself. You're doing the best you can.",
  "Every storm runs out of rain.",
  "You don't have to control your thoughts. You just have to stop letting them control you.",
  "Healing is not linear, but it is always possible.",
  "Take it one breath at a time.",
];

const phases = [
  { label: "Breathe In", duration: 4 },
  { label: "Hold", duration: 4 },
  { label: "Breathe Out", duration: 6 },
  { label: "Hold", duration: 2 },
];

const BreathePage = () => {
  const [isActive, setIsActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [countdown, setCountdown] = useState(phases[0].duration);
  const [cycles, setCycles] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    if (countdown <= 0) {
      const next = (phaseIndex + 1) % phases.length;
      setPhaseIndex(next);
      setCountdown(phases[next].duration);
      if (next === 0) setCycles((c) => c + 1);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [isActive, countdown, phaseIndex]);

  useEffect(() => {
    const interval = setInterval(() => setQuoteIndex((i) => (i + 1) % quotes.length), 8000);
    return () => clearInterval(interval);
  }, []);

  const reset = () => {
    setIsActive(false);
    setPhaseIndex(0);
    setCountdown(phases[0].duration);
    setCycles(0);
  };

  const phase = phases[phaseIndex];
  const scale = phase.label === "Breathe In" ? 1.4 : phase.label === "Breathe Out" ? 1 : phaseIndex === 1 ? 1.4 : 1;

  return (
    <div className="p-6 container mx-auto max-w-3xl flex flex-col items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <Wind className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Guided Breathing</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Find Your Calm</h1>
          <p className="text-muted-foreground">4-4-6-2 breathing technique to reduce anxiety and stress.</p>
        </motion.div>

        {/* Breathing circle */}
        <div className="relative w-72 h-72 flex items-center justify-center mb-10">
          {/* Outer glow rings */}
          <motion.div
            animate={{ scale: isActive ? scale : 1, opacity: isActive ? 0.15 : 0.05 }}
            transition={{ duration: phase.duration, ease: "easeInOut" }}
            className="absolute w-72 h-72 rounded-full bg-primary"
          />
          <motion.div
            animate={{ scale: isActive ? scale * 0.85 : 0.85, opacity: isActive ? 0.25 : 0.1 }}
            transition={{ duration: phase.duration, ease: "easeInOut" }}
            className="absolute w-56 h-56 rounded-full bg-accent"
          />
          {/* Inner circle */}
          <motion.div
            animate={{ scale: isActive ? scale * 0.7 : 0.7 }}
            transition={{ duration: phase.duration, ease: "easeInOut" }}
            className="absolute w-44 h-44 rounded-full bg-primary/30 backdrop-blur-xl border border-primary/20 flex items-center justify-center glow-primary"
          >
            <div className="text-center">
              <p className="font-display font-bold text-2xl text-foreground">{countdown}</p>
              <p className="text-sm text-primary font-medium">{isActive ? phase.label : "Ready"}</p>
            </div>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsActive(!isActive)}
            className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold bg-primary text-primary-foreground glow-primary"
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isActive ? "Pause" : "Start"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-secondary text-secondary-foreground border border-border"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </motion.button>
        </div>

        <p className="text-sm text-muted-foreground mb-12">Cycles completed: {cycles}</p>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-6 max-w-md text-center"
        >
          <Quote className="w-5 h-5 text-primary mx-auto mb-3" />
          <AnimatePresence mode="wait">
            <motion.p
              key={quoteIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-foreground italic leading-relaxed"
            >
              "{quotes[quoteIndex]}"
            </motion.p>
          </AnimatePresence>
        </motion.div>
    </div>
  );
};

export default BreathePage;
