import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Brain } from "lucide-react";
import { Link } from "react-router-dom";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder — will connect to Lovable Cloud auth
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full bg-primary/10 blur-[100px] animate-pulse-slow" />
      <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-accent/8 blur-[80px] animate-pulse-slow" style={{ animationDelay: "2s" }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 w-full max-w-md relative z-10"
      >
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow-primary">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">BuddyMind</span>
        </Link>

        <div className="flex gap-1 p-1 rounded-xl bg-secondary/50 mb-8">
          {["Login", "Sign Up"].map((tab, i) => (
            <button
              key={tab}
              onClick={() => setIsLogin(i === 0)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                (i === 0 ? isLogin : !isLogin)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Full Name</label>
              <div className="flex items-center gap-3 glass-card px-4 py-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
            </motion.div>
          )}

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
            <div className="flex items-center gap-3 glass-card px-4 py-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Password</label>
            <div className="flex items-center gap-3 glass-card px-4 py-3">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold bg-primary text-primary-foreground glow-primary mt-6"
          >
            {isLogin ? "Sign In" : "Create Account"}
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Your data is private and encrypted. We care about your wellbeing. 💜
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
