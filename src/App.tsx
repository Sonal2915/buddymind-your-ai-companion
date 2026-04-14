import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import QuestionnairePage from "./pages/QuestionnairePage";
import GamesPage from "./pages/GamesPage";
import HistoryPage from "./pages/HistoryPage";
import VoiceAnalysis from "./pages/VoiceAnalysis";
import EmotionDetectionPage from "./pages/EmotionDetectionPage";
import BreathePage from "./pages/BreathePage";
import MoodDashboard from "./pages/MoodDashboard";
import ReportPage from "./pages/ReportPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes with sidebar layout */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/questionnaire" element={<QuestionnairePage />} />
              <Route path="/games" element={<GamesPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/voice" element={<VoiceAnalysis />} />
              <Route path="/emotion" element={<EmotionDetectionPage />} />
              <Route path="/breathe" element={<BreathePage />} />
              <Route path="/mood" element={<MoodDashboard />} />
              <Route path="/report" element={<ReportPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
