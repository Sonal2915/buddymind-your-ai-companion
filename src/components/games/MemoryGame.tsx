import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Trophy } from "lucide-react";

const ICONS = ["🌸", "🌿", "🌊", "🦋", "🌙", "☀️", "🍃", "💜"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Card = { id: number; icon: string; matched: boolean };

const MemoryGame = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const lockRef = useRef(false);

  const initGame = useCallback(() => {
    const pairs = shuffle([...ICONS, ...ICONS]).map((icon, i) => ({
      id: i,
      icon,
      matched: false,
    }));
    setCards(pairs);
    setFlipped([]);
    setMoves(0);
    setWon(false);
    lockRef.current = false;
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  const handleFlip = (id: number) => {
    if (lockRef.current) return;
    if (flipped.includes(id)) return;
    if (cards[id].matched) return;

    const next = [...flipped, id];
    setFlipped(next);

    if (next.length === 2) {
      setMoves((m) => m + 1);
      lockRef.current = true;

      if (cards[next[0]].icon === cards[next[1]].icon) {
        setTimeout(() => {
          setCards((prev) => {
            const updated = prev.map((c) =>
              c.id === next[0] || c.id === next[1] ? { ...c, matched: true } : c
            );
            if (updated.every((c) => c.matched)) setWon(true);
            return updated;
          });
          setFlipped([]);
          lockRef.current = false;
        }, 500);
      } else {
        setTimeout(() => {
          setFlipped([]);
          lockRef.current = false;
        }, 800);
      }
    }
  };

  const isFlipped = (id: number) => flipped.includes(id) || cards[id]?.matched;

  return (
    <div className="glass-card p-6 sm:p-8">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display text-lg font-bold text-foreground">Memory Match</h3>
        {moves > 0 && (
          <span className="text-xs text-muted-foreground font-medium">
            {moves} move{moves !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-5">Match pairs to train focus & memory</p>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-xs mx-auto mb-5">
        {cards.map((card) => (
          <motion.button
            key={card.id}
            onClick={() => handleFlip(card.id)}
            whileTap={{ scale: 0.92 }}
            className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all duration-300 border ${
              card.matched
                ? "bg-primary/10 border-primary/30"
                : isFlipped(card.id)
                ? "bg-secondary border-border"
                : "bg-muted/60 border-border/50 hover:border-primary/30 hover:bg-muted/80"
            }`}
          >
            <motion.span
              initial={false}
              animate={{
                rotateY: isFlipped(card.id) ? 0 : 180,
                opacity: isFlipped(card.id) ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
            >
              {isFlipped(card.id) ? card.icon : ""}
            </motion.span>
          </motion.button>
        ))}
      </div>

      {/* Won state */}
      {won && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-4 p-4 rounded-xl bg-primary/10 border border-primary/20"
        >
          <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="font-semibold text-foreground text-sm">Great job!</p>
          <p className="text-xs text-muted-foreground">
            Completed in {moves} move{moves !== 1 ? "s" : ""}
          </p>
        </motion.div>
      )}

      <div className="flex justify-center">
        <button
          onClick={initGame}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          New Game
        </button>
      </div>
    </div>
  );
};

export default MemoryGame;
