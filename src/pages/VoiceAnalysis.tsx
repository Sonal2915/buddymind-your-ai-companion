import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Activity, Brain, RefreshCw, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

type Emotion = {
  label: string;
  emoji: string;
  confidence: number;
  color: string;
};

const emotionMap: Record<string, { emoji: string; color: string }> = {
  Happy: { emoji: "😊", color: "from-green-500/20 to-emerald-500/20 border-green-500/30" },
  Calm: { emoji: "😌", color: "from-accent/20 to-blue-500/20 border-accent/30" },
  Sad: { emoji: "😢", color: "from-blue-500/20 to-indigo-500/20 border-blue-500/30" },
  Angry: { emoji: "😠", color: "from-red-500/20 to-orange-500/20 border-red-500/30" },
  Stressed: { emoji: "😰", color: "from-orange-500/20 to-yellow-500/20 border-orange-500/30" },
  Fearful: { emoji: "😨", color: "from-purple-500/20 to-violet-500/20 border-purple-500/30" },
  Surprised: { emoji: "😲", color: "from-yellow-500/20 to-amber-500/20 border-yellow-500/30" },
  Disgusted: { emoji: "🤢", color: "from-lime-500/20 to-green-500/20 border-lime-500/30" },
  Neutral: { emoji: "😐", color: "from-muted/40 to-secondary/40 border-border/50" },
};

const VOICE_EMOTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-emotion`;

const VoiceAnalysis = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<Emotion[] | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<string>("");
  const [duration, setDuration] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d")!;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(analyser.fftSize);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      analyser.getByteTimeDomainData(timeData);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "rgba(124, 58, 237, 0.05)");
      grad.addColorStop(0.5, "rgba(56, 189, 248, 0.08)");
      grad.addColorStop(1, "rgba(124, 58, 237, 0.05)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Frequency bars
      const barWidth = (w / bufferLength) * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * h * 0.8;
        const barGrad = ctx.createLinearGradient(0, h, 0, h - barHeight);
        barGrad.addColorStop(0, "rgba(124, 58, 237, 0.6)");
        barGrad.addColorStop(1, "rgba(56, 189, 248, 0.3)");
        ctx.fillStyle = barGrad;
        ctx.fillRect(x, h - barHeight, barWidth - 1, barHeight);
        x += barWidth;
        if (x > w) break;
      }

      // Waveform line
      ctx.beginPath();
      ctx.strokeStyle = "rgba(124, 58, 237, 0.8)";
      ctx.lineWidth = 2;
      const sliceWidth = w / timeData.length;
      let lx = 0;
      for (let i = 0; i < timeData.length; i++) {
        const v = timeData[i] / 128.0;
        const y = (v * h) / 2;
        if (i === 0) ctx.moveTo(lx, y);
        else ctx.lineTo(lx, y);
        lx += sliceWidth;
      }
      ctx.stroke();
    };

    draw();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Set up MediaRecorder for capturing audio
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.start(250); // collect chunks every 250ms
      mediaRecorderRef.current = mediaRecorder;

      setDuration(0);
      setResult(null);
      setAnalysisSummary("");
      setIsRecording(true);

      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      drawWaveform();
    } catch {
      toast.error("Microphone access is required for voice analysis.");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    cancelAnimationFrame(animFrameRef.current);
    clearInterval(timerRef.current);

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        sendForAnalysis(blob, recorder.mimeType);
      };
      recorder.stop();
    }

    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close();
  };

  const sendForAnalysis = async (audioBlob: Blob, mimeType: string) => {
    setIsAnalyzing(true);
    try {
      // Convert blob to base64
      const buffer = await audioBlob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      const resp = await fetch(VOICE_EMOTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ audio_base64: base64, mime_type: mimeType }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Analysis failed" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      const data = await resp.json();

      const emotions: Emotion[] = (data.emotions || [])
        .map((e: { label: string; confidence: number }) => ({
          label: e.label,
          emoji: emotionMap[e.label]?.emoji || "🔮",
          confidence: Math.round(e.confidence),
          color: emotionMap[e.label]?.color || "from-muted/40 to-secondary/40 border-border/50",
        }))
        .sort((a: Emotion, b: Emotion) => b.confidence - a.confidence);

      setResult(emotions);
      setAnalysisSummary(data.analysis_summary || "");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setAnalysisSummary("");
    setDuration(0);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      clearInterval(timerRef.current);
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioContextRef.current?.close();
    };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const dominant = result?.[0];

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <div className="pt-24 pb-12 px-4 container mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI Voice Analysis</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Voice Emotion Detection</h1>
          <p className="text-muted-foreground">
            Record your voice and AI will analyze pitch, energy, rhythm, and spectral features to detect your emotional state.
          </p>
        </motion.div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border mb-6 text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>This system is not a clinical diagnostic tool. Results are for informational purposes only.</span>
        </div>

        {/* Waveform */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 mb-8"
        >
          <div className="relative rounded-xl overflow-hidden bg-background/30 mb-6">
            <canvas ref={canvasRef} width={800} height={200} className="w-full h-48" />
            {!isRecording && !result && !isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Press record to start voice analysis</p>
              </div>
            )}
            {isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-primary animate-spin" />
                  <p className="text-foreground font-medium">AI analyzing your voice...</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {!isRecording ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startRecording}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold bg-primary text-primary-foreground glow-primary disabled:opacity-40"
              >
                <Mic className="w-5 h-5" />
                Record
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopRecording}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold bg-destructive text-destructive-foreground"
              >
                <MicOff className="w-5 h-5" />
                Stop ({formatTime(duration)})
              </motion.button>
            )}

            {result && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={reset}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-secondary text-secondary-foreground border border-border"
              >
                <RefreshCw className="w-4 h-4" />
                New Recording
              </motion.button>
            )}
          </div>

          {isRecording && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm text-destructive font-medium">Recording...</span>
            </div>
          )}
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Dominant emotion */}
              {dominant && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className={`glass-card p-8 mb-6 text-center bg-gradient-to-br ${dominant.color}`}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="text-6xl mb-4"
                  >
                    {dominant.emoji}
                  </motion.div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-1">{dominant.label}</h2>
                  <p className="text-muted-foreground text-sm">Detected with {dominant.confidence}% confidence</p>
                </motion.div>
              )}

              {/* Analysis summary */}
              {analysisSummary && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-card p-5 mb-6"
                >
                  <h3 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    AI Analysis
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{analysisSummary}</p>
                </motion.div>
              )}

              {/* All emotions breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {result.map((emotion, i) => (
                  <motion.div
                    key={emotion.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className={`glass-card p-4 text-center bg-gradient-to-br ${emotion.color}`}
                  >
                    <span className="text-2xl block mb-2">{emotion.emoji}</span>
                    <p className="font-semibold text-sm text-foreground">{emotion.label}</p>
                    <div className="mt-2 w-full bg-background/30 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${emotion.confidence}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + 0.1 * i }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{emotion.confidence}%</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VoiceAnalysis;
