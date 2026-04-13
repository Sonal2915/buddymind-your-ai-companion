import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";

type Phase = "inhale" | "hold" | "exhale" | "rest";

const PHASES: { phase: Phase; label: string; duration: number }[] = [
  { phase: "inhale", label: "Breathe In", duration: 4 },
  { phase: "hold", label: "Hold", duration: 4 },
  { phase: "exhale", label: "Breathe Out", duration: 6 },
  { phase: "rest", label: "Rest", duration: 2 },
];

const phaseColors: Record<Phase, string> = {
  inhale: "hsl(200, 80%, 55%)",
  hold: "hsl(263, 70%, 55%)",
  exhale: "hsl(170, 60%, 45%)",
  rest: "hsl(220, 15%, 55%)",
};

const BreathingExercise = () => {
  const [active, setActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [countdown, setCountdown] = useState(PHASES[0].duration);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const current = PHASES[phaseIndex];

  const tick = useCallback(() => {
    setCountdown((prev) => {
      if (prev <= 1) {
        setPhaseIndex((pi) => {
          const next = (pi + 1) % PHASES.length;
          if (next === 0) setCycles((c) => c + 1);
          setCountdown(PHASES[next].duration);
          return next;
        });
        return 0;
      }
      return prev - 1;
    });
  }, []);

  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [active, tick]);

  const reset = () => {
    setActive(false);
    setPhaseIndex(0);
    setCountdown(PHASES[0].duration);
    setCycles(0);
  };

  const circleScale = current.phase === "inhale" ? 1.4 : current.phase === "exhale" ? 0.7 : current.phase === "hold" ? 1.4 : 0.85;

  return (
    <div className="glass-card p-6 sm:p-8 flex flex-col items-center">
      <h3 className="font-display text-lg font-bold text-foreground mb-1">Breathing Exercise</h3>
      <p className="text-sm text-muted-foreground mb-6">4-4-6 pattern · Inhale · Hold · Exhale</p>

      {/* Circle */}
      <div className="relative w-52 h-52 flex items-center justify-center mb-6">
        {/* Outer glow ring */}
        <motion.div
          animate={{
            scale: active ? circleScale : 1,
            opacity: active ? 0.15 : 0.08,
          }}
          transition={{ duration: current.duration, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: phaseColors[current.phase] }}
        />
        {/* Main circle */}
        <motion.div
          animate={{
            scale: active ? circleScale : 1,
            boxShadow: active
              ? `0 0 60px 10px ${phaseColors[current.phase]}40`
              : `0 0 20px 5px hsl(263,70%,55%,0.15)`,
          }}
          transition={{ duration: current.duration, ease: "easeInOut" }}
          className="absolute w-36 h-36 rounded-full border-2 flex items-center justify-center"
          style={{
            borderColor: phaseColors[current.phase],
            background: `radial-gradient(circle, ${phaseColors[current.phase]}20 0%, transparent 70%)`,
          }}
        >
          <div className="text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={current.phase}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-sm font-semibold text-foreground"
              >
                {active ? current.label : "Ready"}
              </motion.p>
            </AnimatePresence>
            <p className="text-2xl font-bold text-foreground mt-1">
              {active ? countdown : "—"}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Phase dots */}
      <div className="flex gap-2 mb-5">
        {PHASES.map((p, i) => (
          <div
            key={p.phase}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === phaseIndex && active ? "scale-125" : "opacity-40"
            }`}
            style={{ backgroundColor: phaseColors[p.phase] }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActive(!active)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {active ? "Pause" : "Start"}
        </button>
        {cycles > 0 && (
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>

      {cycles > 0 && (
        <p className="text-xs text-muted-foreground mt-4">
          {cycles} cycle{cycles !== 1 ? "s" : ""} completed
        </p>
      )}
    </div>
  );
};

export default BreathingExercise;
