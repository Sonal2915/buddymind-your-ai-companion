import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import { ClipboardList, ArrowRight, ArrowLeft, BarChart3, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";

const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it's hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen",
];

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead or of hurting yourself in some way",
];

const ANSWER_OPTIONS = [
  { value: "0", label: "Not at all", score: 0 },
  { value: "1", label: "Several days", score: 1 },
  { value: "2", label: "More than half the days", score: 2 },
  { value: "3", label: "Nearly every day", score: 3 },
];

type AssessmentType = "gad7" | "phq9";

interface AssessmentResult {
  type: AssessmentType;
  score: number;
  level: string;
  color: string;
  interpretation: string;
}

const getAnxietyLevel = (score: number): Omit<AssessmentResult, "type" | "score"> => {
  if (score <= 4) return { level: "Minimal", color: "text-green-400", interpretation: "Your responses suggest minimal anxiety. Continue maintaining your well-being practices." };
  if (score <= 9) return { level: "Mild", color: "text-yellow-400", interpretation: "Your responses indicate mild anxiety levels. Consider incorporating relaxation techniques into your routine." };
  if (score <= 14) return { level: "Moderate", color: "text-orange-400", interpretation: "Your responses indicate moderate anxiety levels. It may be beneficial to speak with a mental health professional." };
  return { level: "Severe", color: "text-red-400", interpretation: "Your responses indicate severe anxiety levels. We strongly recommend consulting a mental health professional for support." };
};

const getDepressionLevel = (score: number): Omit<AssessmentResult, "type" | "score"> => {
  if (score <= 4) return { level: "Minimal", color: "text-green-400", interpretation: "Your responses suggest minimal depression. Keep up your positive habits and self-care routines." };
  if (score <= 9) return { level: "Mild", color: "text-yellow-400", interpretation: "Your responses indicate mild depression. Consider activities that bring you joy and connecting with loved ones." };
  if (score <= 14) return { level: "Moderate", color: "text-orange-400", interpretation: "Your responses indicate moderate depression levels. Speaking with a counselor or therapist could be very helpful." };
  if (score <= 19) return { level: "Moderately Severe", color: "text-orange-500", interpretation: "Your responses indicate moderately severe depression. We recommend seeking professional mental health support." };
  return { level: "Severe", color: "text-red-400", interpretation: "Your responses indicate severe depression levels. Please reach out to a mental health professional or crisis helpline for support." };
};

const QuestionnairePage = () => {
  const [stage, setStage] = useState<"select" | "questions" | "results">("select");
  const [currentType, setCurrentType] = useState<AssessmentType>("gad7");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<AssessmentResult[]>([]);

  const questions = currentType === "gad7" ? GAD7_QUESTIONS : PHQ9_QUESTIONS;
  const totalQuestions = questions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      calculateResults();
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) setCurrentQuestion((prev) => prev - 1);
  };

  const calculateResults = () => {
    const score = Object.values(answers).reduce((sum, val) => sum + parseInt(val), 0);
    const levelData = currentType === "gad7" ? getAnxietyLevel(score) : getDepressionLevel(score);
    const result: AssessmentResult = { type: currentType, score, ...levelData };
    setResults((prev) => [...prev, result]);

    // If GAD-7 done, auto-start PHQ-9
    if (currentType === "gad7") {
      setCurrentType("phq9");
      setCurrentQuestion(0);
      setAnswers({});
    } else {
      setStage("results");
    }
  };

  const startAssessment = (type: AssessmentType) => {
    setCurrentType(type);
    setCurrentQuestion(0);
    setAnswers({});
    setResults([]);
    setStage("questions");
  };

  const startFullAssessment = () => {
    setCurrentType("gad7");
    setCurrentQuestion(0);
    setAnswers({});
    setResults([]);
    setStage("questions");
  };

  const restart = () => {
    setStage("select");
    setCurrentType("gad7");
    setCurrentQuestion(0);
    setAnswers({});
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl border border-border bg-muted/40 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            This assessment is for informational purposes only and is <strong>not a clinical diagnostic tool</strong>. If you are in crisis, please contact a mental health professional or crisis helpline immediately.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* SELECTION STAGE */}
          {stage === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center">
                  <ClipboardList className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground font-display">Mental Health Assessment</h1>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  Take standardized assessments to understand your anxiety and depression levels. Your responses are private and secure.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="bg-card/60 border-border hover:border-primary/40 transition-colors cursor-pointer group" onClick={() => startAssessment("gad7")}>
                  <CardHeader>
                    <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors">GAD-7 — Anxiety</CardTitle>
                    <CardDescription>7 questions · ~2 min</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Generalized Anxiety Disorder screener used worldwide to assess anxiety severity.</p>
                  </CardContent>
                </Card>

                <Card className="bg-card/60 border-border hover:border-accent/40 transition-colors cursor-pointer group" onClick={() => startAssessment("phq9")}>
                  <CardHeader>
                    <CardTitle className="text-lg text-foreground group-hover:text-accent transition-colors">PHQ-9 — Depression</CardTitle>
                    <CardDescription>9 questions · ~3 min</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Patient Health Questionnaire for screening and measuring depression severity.</p>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <Button onClick={startFullAssessment} size="lg" className="glow-primary">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Take Both Assessments
                </Button>
              </div>
            </motion.div>
          )}

          {/* QUESTIONS STAGE */}
          {stage === "questions" && (
            <motion.div
              key={`q-${currentType}-${currentQuestion}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">
                    {currentType === "gad7" ? "GAD-7 — Anxiety" : "PHQ-9 — Depression"}
                  </span>
                  <span>Question {currentQuestion + 1} of {totalQuestions}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <Card className="bg-card/60 border-border">
                <CardHeader>
                  <CardDescription className="text-xs uppercase tracking-wider text-muted-foreground">
                    Over the last 2 weeks, how often have you been bothered by:
                  </CardDescription>
                  <CardTitle className="text-xl text-foreground leading-relaxed">
                    {questions[currentQuestion]}
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
                        htmlFor={`opt-${opt.value}`}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                          answers[currentQuestion] === opt.value
                            ? "border-primary bg-primary/10"
                            : "border-border bg-muted/30 hover:border-muted-foreground/30"
                        }`}
                      >
                        <RadioGroupItem value={opt.value} id={`opt-${opt.value}`} />
                        <div>
                          <span className="text-foreground font-medium">{opt.label}</span>
                          <span className="ml-2 text-xs text-muted-foreground">({opt.score})</span>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrev} disabled={currentQuestion === 0}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button onClick={handleNext} disabled={answers[currentQuestion] === undefined}>
                  {currentQuestion === totalQuestions - 1 ? "Finish" : "Next"} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* RESULTS STAGE */}
          {stage === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 mx-auto text-green-400" />
                <h2 className="text-2xl font-bold text-foreground">Your Assessment Results</h2>
                <p className="text-muted-foreground">Here's a summary of your mental health screening.</p>
              </div>

              <div className="grid gap-4">
                {results.map((r) => (
                  <Card key={r.type} className="bg-card/60 border-border">
                    <CardHeader>
                      <CardTitle className="text-lg text-foreground">
                        {r.type === "gad7" ? "Anxiety (GAD-7)" : "Depression (PHQ-9)"}
                      </CardTitle>
                      <CardDescription>
                        Score: <span className="font-bold text-foreground">{r.score}</span> / {r.type === "gad7" ? 21 : 27}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Severity:</span>
                        <span className={`font-semibold ${r.color}`}>{r.level}</span>
                      </div>
                      <Progress value={(r.score / (r.type === "gad7" ? 21 : 27)) * 100} className="h-2" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{r.interpretation}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center">
                <Button onClick={restart} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" /> Retake Assessment
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuestionnairePage;
