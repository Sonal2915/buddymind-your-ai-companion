import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Activity, Brain, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";

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
  Neutral: { emoji: "😐", color: "from-muted/40 to-secondary/40 border-border/50" },
};

const VoiceAnalysis = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<Emotion[] | null>(null);
  const [duration, setDuration] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Audio feature accumulators
  const rmsHistoryRef = useRef<number[]>([]);
  const pitchHistoryRef = useRef<number[]>([]);
  const zcHistoryRef = useRef<number[]>([]);

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

      // Compute RMS
      let sumSq = 0;
      let zeroCrossings = 0;
      for (let i = 0; i < timeData.length; i++) {
        const v = (timeData[i] - 128) / 128;
        sumSq += v * v;
        if (i > 0) {
          const prev = (timeData[i - 1] - 128) / 128;
          if ((v >= 0 && prev < 0) || (v < 0 && prev >= 0)) zeroCrossings++;
        }
      }
      const rms = Math.sqrt(sumSq / timeData.length);
      rmsHistoryRef.current.push(rms);
      zcHistoryRef.current.push(zeroCrossings);

      // Estimate pitch from dominant frequency bin
      let maxVal = 0;
      let maxIndex = 0;
      for (let i = 0; i < bufferLength; i++) {
        if (dataArray[i] > maxVal) {
          maxVal = dataArray[i];
          maxIndex = i;
        }
      }
      const sampleRate = audioContextRef.current?.sampleRate || 44100;
      const dominantFreq = (maxIndex * sampleRate) / (analyser.fftSize);
      if (dominantFreq > 50 && dominantFreq < 1000) {
        pitchHistoryRef.current.push(dominantFreq);
      }

      // Draw
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

      rmsHistoryRef.current = [];
      pitchHistoryRef.current = [];
      zcHistoryRef.current = [];
      setDuration(0);
      setResult(null);
      setIsRecording(true);

      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      drawWaveform();
    } catch {
      alert("Microphone access is required for voice analysis.");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    cancelAnimationFrame(animFrameRef.current);
    clearInterval(timerRef.current);

    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close();

    analyzeEmotion();
  };

  const analyzeEmotion = () => {
    setIsAnalyzing(true);

    setTimeout(() => {
      const rmsArr = rmsHistoryRef.current;
      const pitchArr = pitchHistoryRef.current;
      const zcArr = zcHistoryRef.current;

      // Compute features
      const avgRms = rmsArr.length ? rmsArr.reduce((a, b) => a + b, 0) / rmsArr.length : 0;
      const rmsVariance = rmsArr.length
        ? rmsArr.reduce((a, b) => a + (b - avgRms) ** 2, 0) / rmsArr.length
        : 0;
      const avgPitch = pitchArr.length ? pitchArr.reduce((a, b) => a + b, 0) / pitchArr.length : 200;
      const pitchVariance = pitchArr.length
        ? pitchArr.reduce((a, b) => a + (b - avgPitch) ** 2, 0) / pitchArr.length
        : 0;
      const avgZc = zcArr.length ? zcArr.reduce((a, b) => a + b, 0) / zcArr.length : 0;

      // Rule-based classification using audio features
      const scores: Record<string, number> = {
        Happy: 0,
        Calm: 0,
        Sad: 0,
        Angry: 0,
        Stressed: 0,
        Neutral: 0,
      };

      // High energy + high pitch variance → Happy or Angry
      if (avgRms > 0.15) {
        scores.Angry += 25;
        scores.Happy += 15;
        scores.Stressed += 10;
      }
      if (avgRms > 0.25) {
        scores.Angry += 20;
      }

      // Low energy → Sad or Calm
      if (avgRms < 0.08) {
        scores.Sad += 25;
        scores.Calm += 20;
      }

      // High pitch → Happy, Stressed
      if (avgPitch > 250) {
        scores.Happy += 20;
        scores.Stressed += 15;
      }

      // Low pitch → Sad, Calm
      if (avgPitch < 180) {
        scores.Sad += 15;
        scores.Calm += 15;
      }

      // High pitch variance → Stressed, Happy
      if (pitchVariance > 3000) {
        scores.Stressed += 20;
        scores.Happy += 10;
      }

      // Low pitch variance → Calm, Neutral
      if (pitchVariance < 1000) {
        scores.Calm += 15;
        scores.Neutral += 20;
      }

      // High RMS variance → Angry, Stressed
      if (rmsVariance > 0.01) {
        scores.Angry += 15;
        scores.Stressed += 15;
      }

      // Low RMS variance → Calm
      if (rmsVariance < 0.003) {
        scores.Calm += 15;
      }

      // Zero crossing rate
      if (avgZc > 50) {
        scores.Stressed += 10;
        scores.Angry += 10;
      }
      if (avgZc < 20) {
        scores.Calm += 10;
        scores.Neutral += 10;
      }

      // Neutral baseline
      scores.Neutral += 10;

      // Normalize to percentages
      const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
      const emotions: Emotion[] = Object.entries(scores)
        .map(([label, score]) => ({
          label,
          emoji: emotionMap[label].emoji,
          confidence: Math.round((score / total) * 100),
          color: emotionMap[label].color,
        }))
        .sort((a, b) => b.confidence - a.confidence);

      setResult(emotions);
      setIsAnalyzing(false);
    }, 2000);
  };

  const reset = () => {
    setResult(null);
    setDuration(0);
    // Clear canvas
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
            <span className="text-sm font-medium text-primary">Voice Analysis</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Voice Emotion Detection</h1>
          <p className="text-muted-foreground">Record your voice and let AI analyze your emotional state through tone, pitch, and energy.</p>
        </motion.div>

        {/* Waveform */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 mb-8"
        >
          <div className="relative rounded-xl overflow-hidden bg-background/30 mb-6">
            <canvas
              ref={canvasRef}
              width={800}
              height={200}
              className="w-full h-48"
            />
            {!isRecording && !result && !isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Press record to start voice analysis</p>
              </div>
            )}
            {isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-primary animate-spin" />
                  <p className="text-foreground font-medium">Analyzing emotions...</p>
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
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
