import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { X, AlertTriangle, Brain } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Link } from "react-router-dom";

const DISCLAIMER_KEY = "buddymind_disclaimer_dismissed";

const AppLayout = () => {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISCLAIMER_KEY);
    if (!dismissed) setShowDisclaimer(true);
  }, []);

  const dismissDisclaimer = () => {
    localStorage.setItem(DISCLAIMER_KEY, "true");
    setShowDisclaimer(false);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full gradient-bg">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-14 flex items-center border-b border-border/30 px-4 shrink-0 bg-background/50 backdrop-blur-sm">
            <SidebarTrigger className="mr-3" />
            <Link to="/chat" className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <span className="font-display font-bold text-foreground">BuddyMind</span>
            </Link>
          </header>

          {/* Disclaimer */}
          {showDisclaimer && (
            <div className="bg-muted/60 border-b border-border px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground flex-1">
                <strong>Disclaimer:</strong> This application is not a clinical diagnostic tool. It is for informational and self-reflection purposes only. If you're in crisis, please contact a mental health professional.
              </p>
              <button onClick={dismissDisclaimer} className="text-muted-foreground hover:text-foreground shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
