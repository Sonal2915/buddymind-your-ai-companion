import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Play, Square, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Emotion = "Happy" | "Sad" | "Angry" | "Neutral" | "Fear" | "Surprise" | "Disgust" | "No Face";

interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DetectionResult {
  emotion: Emotion;
  confidence: number;
  face_box: FaceBox;
  secondary_emotions?: { emotion: string; confidence: number }[];
}

const EMOTION_COLORS: Record<string, string> = {
  Happy: "#facc15",
  Sad: "#3b82f6",
  Angry: "#ef4444",
  Neutral: "#9ca3af",
  Fear: "#a855f7",
  Surprise: "#f97316",
  Disgust: "#22c55e",
  "No Face": "#6b7280",
};

const EMOTION_EMOJIS: Record<string, string> = {
  Happy: "😊",
  Sad: "😢",
  Angry: "😠",
  Neutral: "😐",
  Fear: "😨",
  Surprise: "😲",
  Disgust: "🤢",
  "No Face": "👤",
};

const EmotionDetectionPage = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
    setDetecting(false);
    setResult(null);
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setError("Camera access denied. Please allow camera permissions.");
    }
  };

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused) return null;

    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, 320, 240);
    return canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
  }, []);

  const analyzeFrame = useCallback(async () => {
    if (processing) return;
    const base64 = captureFrame();
    if (!base64) return;

    setProcessing(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("face-emotion", {
        body: { image_base64: base64 },
      });

      if (fnError) {
        console.error("Edge function error:", fnError);
        return;
      }

      if (data?.error) {
        if (data.error.includes("Rate limit")) {
          toast.error("Rate limit reached. Slowing down...");
        }
        return;
      }

      setResult(data as DetectionResult);
    } catch (err) {
      console.error("Analysis error:", err);
    } finally {
      setProcessing(false);
    }
  }, [captureFrame, processing]);

  const startDetection = () => {
    setDetecting(true);
    setResult(null);
    // Analyze every 2 seconds to avoid rate limits
    intervalRef.current = setInterval(() => {
      analyzeFrame();
    }, 2000);
    // Run immediately
    analyzeFrame();
  };

  const stopDetection = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setDetecting(false);
  };

  // Draw overlay (bounding box + label) on the overlay canvas
  useEffect(() => {
    const overlay = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!overlay || !video) return;

    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      overlay.width = video.videoWidth || 640;
      overlay.height = video.videoHeight || 480;
      ctx.clearRect(0, 0, overlay.width, overlay.height);

      if (result && result.emotion !== "No Face") {
        const box = result.face_box;
        const x = (box.x / 100) * overlay.width;
        const y = (box.y / 100) * overlay.height;
        const w = (box.width / 100) * overlay.width;
        const h = (box.height / 100) * overlay.height;

        const color = EMOTION_COLORS[result.emotion] || "#ffffff";

        // Draw bounding box
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);

        // Corner accents
        const cornerLen = Math.min(w, h) * 0.2;
        ctx.lineWidth = 4;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(x, y + cornerLen);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cornerLen, y);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(x + w - cornerLen, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + cornerLen);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(x, y + h - cornerLen);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + cornerLen, y + h);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(x + w - cornerLen, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w, y + h - cornerLen);
        ctx.stroke();

        // Label background
        const emoji = EMOTION_EMOJIS[result.emotion] || "";
        const label = `${emoji} ${result.emotion} ${Math.round(result.confidence)}%`;
        ctx.font = "bold 16px sans-serif";
        const textMetrics = ctx.measureText(label);
        const labelH = 28;
        const labelW = textMetrics.width + 16;
        const labelX = x;
        const labelY = y - labelH - 4;

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.roundRect(labelX, labelY, labelW, labelH, 6);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Label text
        ctx.fillStyle = "#000000";
        ctx.fillText(label, labelX + 8, labelY + 19);
      }
    };

    draw();
  }, [result]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="p-6 container mx-auto max-w-3xl">
      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 rounded-xl border border-border bg-muted/40 flex items-start gap-3"
      >
        <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          AI-powered facial analysis using vision models. Camera data is sent securely for processing and is <strong>not stored</strong>. This is <strong>not a clinical tool</strong>.
        </p>
      </motion.div>

      <div className="text-center mb-8 space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Face Emotion Detection</h1>
        <p className="text-muted-foreground">Real-time AI-powered facial expression analysis</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm text-center">
          {error}
        </div>
      )}

      {/* Video with overlay */}
      <div className="space-y-4">
        <div
          ref={containerRef}
          className="relative aspect-video bg-muted/30 rounded-xl overflow-hidden border border-border"
        >
          <video
            ref={videoRef}
            className="w-full h-full object-cover mirror"
            playsInline
            muted
            style={{ transform: "scaleX(-1)" }}
          />
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ transform: "scaleX(-1)" }}
          />
          <canvas ref={canvasRef} className="hidden" />

          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted/60">
              <Camera className="w-12 h-12 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">Camera is off</p>
            </div>
          )}

          {detecting && (
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400 font-medium">Analyzing</span>
            </div>
          )}

          {detecting && processing && (
            <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-black/50 text-xs text-white">
              Processing frame...
            </div>
          )}

          {/* Secondary emotions display */}
          {detecting && result && result.secondary_emotions && result.secondary_emotions.length > 0 && (
            <div className="absolute bottom-4 left-4 space-y-1">
              {result.secondary_emotions.slice(0, 3).map((se, i) => (
                <div
                  key={i}
                  className="px-2 py-1 rounded bg-black/50 text-xs text-white flex items-center gap-1.5"
                >
                  <span>{EMOTION_EMOJIS[se.emotion] || "•"}</span>
                  <span>{se.emotion}</span>
                  <span className="text-white/60">{Math.round(se.confidence)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
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
              {!detecting ? (
                <Button onClick={startDetection}>
                  <Play className="w-4 h-4 mr-2" /> Start Detection
                </Button>
              ) : (
                <Button variant="outline" onClick={stopDetection}>
                  <Square className="w-4 h-4 mr-2" /> Stop Detection
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmotionDetectionPage;
