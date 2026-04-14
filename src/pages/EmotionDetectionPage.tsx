import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Play, Square, AlertTriangle, BarChart3, RefreshCw } from "lucide-react";

const EMOTIONS = ["Happy", "Sad", "Angry", "Neutral", "Fear", "Surprise"] as const;
type Emotion = (typeof EMOTIONS)[number];

const EMOTION_COLORS: Record<Emotion, string> = {
  Happy: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Sad: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Angry: "bg-red-500/20 text-red-400 border-red-500/30",
  Neutral: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  Fear: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Surprise: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const EMOTION_EMOJIS: Record<Emotion, string> = {
  Happy: "😊", Sad: "😢", Angry: "😠", Neutral: "😐", Fear: "😨", Surprise: "😲",
};

const BAR_COLORS: Record<Emotion, string> = {
  Happy: "bg-yellow-400", Sad: "bg-blue-400", Angry: "bg-red-400",
  Neutral: "bg-gray-400", Fear: "bg-purple-400", Surprise: "bg-orange-400",
};

/**
 * Client-side emotion estimation using facial brightness, motion, and color analysis.
 * This is a heuristic approach — not a real ML model — for demonstration purposes.
 */
const analyzeFrame = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  prevData: Uint8ClampedArray | null
): { emotion: Emotion; confidence: number; imageData: Uint8ClampedArray } => {
  canvas.width = 160;
  canvas.height = 120;
  ctx.drawImage(video, 0, 0, 160, 120);
  const frame = ctx.getImageData(0, 0, 160, 120);
  const data = frame.data;

  // Compute average brightness and color channels
  let totalR = 0, totalG = 0, totalB = 0, totalBright = 0;
  const pixelCount = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
    totalBright += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  const avgBright = totalBright / pixelCount;
  const avgR = totalR / pixelCount;
  const avgG = totalG / pixelCount;

  // Compute motion (frame difference)
  let motion = 0;
  if (prevData) {
    for (let i = 0; i < data.length; i += 4) {
      motion += Math.abs(data[i] - prevData[i]);
    }
    motion = motion / pixelCount;
  }

  // Heuristic classification with some randomness for variety
  const rand = Math.random();
  let emotion: Emotion;
  let confidence: number;

  if (motion > 12) {
    emotion = rand > 0.5 ? "Surprise" : "Fear";
    confidence = 0.55 + Math.random() * 0.25;
  } else if (avgBright > 140 && avgR > avgG) {
    emotion = rand > 0.4 ? "Happy" : "Surprise";
    confidence = 0.5 + Math.random() * 0.3;
  } else if (avgBright < 90) {
    emotion = rand > 0.5 ? "Sad" : "Fear";
    confidence = 0.45 + Math.random() * 0.3;
  } else if (avgR > 130 && avgG < 100) {
    emotion = "Angry";
    confidence = 0.4 + Math.random() * 0.3;
  } else {
    emotion = "Neutral";
    confidence = 0.6 + Math.random() * 0.2;
  }

  return { emotion, confidence, imageData: new Uint8ClampedArray(data) };
};

const EmotionDetectionPage = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [emotionLog, setEmotionLog] = useState<Emotion[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevDataRef = useRef<Uint8ClampedArray | null>(null);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
    setRecording(false);
    setCurrentEmotion(null);
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setError("Camera access denied. Please allow camera permissions and try again.");
    }
  };

  const startRecording = () => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setRecording(true);
    setEmotionLog([]);
    setShowResults(false);
    prevDataRef.current = null;

    intervalRef.current = setInterval(() => {
      if (!videoRef.current || videoRef.current.paused) return;
      const { emotion, confidence: conf, imageData } = analyzeFrame(canvas, ctx, videoRef.current, prevDataRef.current);
      prevDataRef.current = imageData;
      setCurrentEmotion(emotion);
      setConfidence(conf);
      setEmotionLog((prev) => [...prev, emotion]);
    }, 800);
  };

  const stopRecording = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRecording(false);
    setShowResults(true);
  };

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  // Compute distribution
  const distribution = EMOTIONS.map((e) => ({
    emotion: e,
    count: emotionLog.filter((l) => l === e).length,
    pct: emotionLog.length ? Math.round((emotionLog.filter((l) => l === e).length / emotionLog.length) * 100) : 0,
  }));
  const dominant = distribution.reduce((a, b) => (b.count > a.count ? b : a), distribution[0]);

  const restart = () => {
    setShowResults(false);
    setEmotionLog([]);
    setCurrentEmotion(null);
  };

  return (
    <div className="p-6 container mx-auto max-w-4xl">
        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl border border-border bg-muted/40 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            This is a <strong>demonstration tool</strong> using heuristic analysis and is <strong>not a clinical diagnostic system</strong>. Camera data is processed locally and never uploaded.
          </p>
        </motion.div>

        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-foreground font-display">Face Emotion Detection</h1>
          <p className="text-muted-foreground">Use your webcam to analyze facial expressions in real time.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Video panel */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="bg-card/60 border-border overflow-hidden">
              <div className="relative aspect-video bg-muted/30 flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <canvas ref={canvasRef} className="hidden" />

                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted/60">
                    <Camera className="w-12 h-12 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">Camera is off</p>
                  </div>
                )}

                {/* Live emotion badge */}
                {recording && currentEmotion && (
                  <motion.div
                    key={currentEmotion}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`absolute top-4 right-4 px-4 py-2 rounded-xl border text-sm font-semibold ${EMOTION_COLORS[currentEmotion]}`}
                  >
                    {EMOTION_EMOJIS[currentEmotion]} {currentEmotion} — {Math.round(confidence * 100)}%
                  </motion.div>
                )}

                {recording && (
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-red-400 font-medium">Recording</span>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex gap-3 justify-center flex-wrap">
              {!cameraActive ? (
                <Button onClick={startCamera}>
                  <Camera className="w-4 h-4 mr-2" /> Start Camera
                </Button>
              ) : (
                <>
                  <Button variant="destructive" onClick={stopCamera}>
                    <CameraOff className="w-4 h-4 mr-2" /> Stop Camera
                  </Button>
                  {!recording ? (
                    <Button onClick={startRecording} className="glow-primary">
                      <Play className="w-4 h-4 mr-2" /> Start Detection
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={stopRecording}>
                      <Square className="w-4 h-4 mr-2" /> Stop & See Results
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Side panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Live emotion list */}
            {recording && (
              <Card className="bg-card/60 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Live Detections</CardTitle>
                </CardHeader>
                <CardContent className="max-h-48 overflow-y-auto space-y-1">
                  {emotionLog.slice(-12).reverse().map((e, i) => (
                    <div key={i} className={`text-xs px-3 py-1.5 rounded-lg border ${EMOTION_COLORS[e]}`}>
                      {EMOTION_EMOJIS[e]} {e}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Results */}
            <AnimatePresence>
              {showResults && emotionLog.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <Card className="bg-card/60 border-border">
                    <CardHeader>
                      <CardTitle className="text-lg text-foreground flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" /> Session Summary
                      </CardTitle>
                      <CardDescription>{emotionLog.length} readings captured</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Dominant emotion */}
                      <div className="text-center p-4 rounded-xl bg-muted/30 border border-border">
                        <p className="text-sm text-muted-foreground mb-1">Dominant Emotion</p>
                        <p className="text-2xl font-bold text-foreground">
                          {EMOTION_EMOJIS[dominant.emotion]} {dominant.emotion}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{dominant.pct}% of session</p>
                      </div>

                      {/* Distribution bars */}
                      <div className="space-y-2">
                        {distribution
                          .filter((d) => d.count > 0)
                          .sort((a, b) => b.count - a.count)
                          .map((d) => (
                            <div key={d.emotion} className="space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{EMOTION_EMOJIS[d.emotion]} {d.emotion}</span>
                                <span>{d.pct}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${d.pct}%` }}
                                  transition={{ duration: 0.6 }}
                                  className={`h-full rounded-full ${BAR_COLORS[d.emotion]}`}
                                />
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Interpretation */}
                      <p className="text-sm text-muted-foreground italic border-t border-border pt-3">
                        "You appeared mostly <strong className="text-foreground">{dominant.emotion.toLowerCase()}</strong> during this session."
                      </p>
                    </CardContent>
                  </Card>

                  <div className="text-center">
                    <Button variant="outline" onClick={restart}>
                      <RefreshCw className="w-4 h-4 mr-2" /> New Session
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
    </div>
  );
};

export default EmotionDetectionPage;
