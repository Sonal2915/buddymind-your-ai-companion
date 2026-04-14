import { motion } from "framer-motion";
import { Gamepad2 } from "lucide-react";
import BreathingExercise from "@/components/games/BreathingExercise";
import MemoryGame from "@/components/games/MemoryGame";

const GamesPage = () => {
  return (
    <div className="p-6 container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Gamepad2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Wellness Games</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Mindful Games
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Simple exercises to calm your mind, sharpen focus, and practice mindfulness.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <BreathingExercise />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <MemoryGame />
          </motion.div>
        </div>
    </div>
  );
};

export default GamesPage;
