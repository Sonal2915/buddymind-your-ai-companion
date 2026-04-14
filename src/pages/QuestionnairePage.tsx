import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ClipboardList, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const QUESTIONS = [
  "How often do you feel nervous, anxious, or on edge?",
  "How often do you feel down, depressed, or hopeless?",
  "How well have you been sleeping over the past two weeks?",
  "How often do you feel tired or have little energy?",
  "How often do you have trouble concentrating on things?",
  "How often do you feel overwhelmed or stressed by daily tasks?",
  "How connected do you feel to the people around you?",
  "How often do you engage in activities you enjoy?",
];

const ANSWER_OPTIONS = [
  { value: "0", label: "Not at all", score: 0 },
  { value: "1", label: "Several days", score: 1 },
  { value: "2", label: "More than half the days", score: 2 },
  { value: "3", label: "Nearly every day", score: 3 },
];

const getEmotionalState = (score: number): string => {
  if (score <= 5) return "happy";
  if (score <= 10) return "calm";
  if (score <= 14) return "neutral";
  if (score <= 18) return "stressed";
  if (score <= 22) return "anxious";
  return "depressed";
};

const emotionLabels: Record<string, { label: string; emoji: string; color: string; message: string }> = {
  happy: { label: "Happy & Well", emoji: "😊", color: "text-green-400", message: "You seem to be doing well! Let's keep that positive energy going." },
  calm: { label: "Calm", emoji: "😌", color: "text-blue-400", message: "You're in a balanced state. A great foundation for growth." },
  neutral: { label: "Neutral", emoji: "😐", color: "text-muted-foreground", message: "You're doing okay. Let's explore how to enhance your wellbeing." },
  stressed: { label: "Stressed", emoji: "😰", color: "text-orange-400", message: "You may be experiencing some stress. Let's work through it together." },
  anxious: { label: "Anxious", emoji: "😟", color: "text-yellow-400", message: "You might be feeling anxious. I'm here to help you find calm." },
  depressed: { label: "Low Mood", emoji: "😞", color: "text-red-400", message: "It seems like things have been tough. Remember, seeking support is a sign of strength." },
};

const QuestionnairePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      calculateAndSave();
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) setCurrentQuestion((prev) => prev - 1);
  };

  const calculateAndSave = async () => {
    setSaving(true);
    const totalScore = Object.values(answers).reduce((sum, val) => sum + parseInt(val), 0);
    const emotionalState = getEmotionalState(totalScore);
    setResult(emotionalState);

    if (user) {
      try {
        const { error } = await supabase.from("questionnaire_results").insert({
          user_id: user.id,
          answers: answers as unknown as Record<string, unknown>,
          emotional_state: emotionalState,
          total_score: totalScore,
        });
        if (error) throw error;
        localStorage.setItem("buddymind_emotional_state", emotionalState);
        localStorage.setItem("buddymind_questionnaire_done", "true");
      } catch (err) {
        console.error(err);
        toast.error("Failed to save results");
      }
    }
    setSaving(false);
  };

  const goToChat = () => {
    navigate("/chat");
  };

  const info = result ? emotionLabels[result] : null;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key={`q-${currentQuestion}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2 mb-8">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center">
                <ClipboardList className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground font-display">Mental Health Check-in</h1>
              <p className="text-sm text-muted-foreground">Answer honestly — there are no right or wrong answers.</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="font-medium text-primary">Question {currentQuestion + 1} of {QUESTIONS.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <Card className="bg-card/60 border-border">
              <CardHeader>
                <CardDescription className="text-xs uppercase tracking-wider text-muted-foreground">
                  Over the last 2 weeks
                </CardDescription>
                <CardTitle className="text-lg text-foreground leading-relaxed">
                  {QUESTIONS[currentQuestion]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={answers[currentQuestion] ?? ""}
                  onValueChange={handleAnswer}
                  className="space-y-3"
                >
                  {ANSWER_OPTIONS.map((opt) => (
                    <Label
                      key={opt.value}
                      htmlFor={`opt-${currentQuestion}-${opt.value}`}
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        answers[currentQuestion] === opt.value
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted/30 hover:border-muted-foreground/30"
                      }`}
                    >
                      <RadioGroupItem value={opt.value} id={`opt-${currentQuestion}-${opt.value}`} />
                      <span className="text-foreground font-medium">{opt.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrev} disabled={currentQuestion === 0}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={handleNext} disabled={answers[currentQuestion] === undefined || saving}>
                {currentQuestion === QUESTIONS.length - 1 ? "Submit" : "Next"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center"
          >
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-400" />
            <h2 className="text-2xl font-bold text-foreground font-display">Assessment Complete</h2>

            {info && (
              <Card className="bg-card/60 border-border max-w-sm mx-auto">
                <CardContent className="pt-6 text-center space-y-3">
                  <span className="text-5xl block">{info.emoji}</span>
                  <p className={`text-xl font-bold ${info.color}`}>{info.label}</p>
                  <p className="text-sm text-muted-foreground">{info.message}</p>
                </CardContent>
              </Card>
            )}

            <Button onClick={goToChat} size="lg" className="glow-primary">
              Continue to Chat <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuestionnairePage;
