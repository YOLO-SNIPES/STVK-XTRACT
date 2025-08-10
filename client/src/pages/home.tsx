import { useState, useEffect } from "react";
import AudioProcessor from "@/components/audio-processor";
import MainMenu from "@/components/main-menu";
import InfoSections from "@/components/info-sections";
import { Play, Square, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>("main");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { user, logout, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // PWA Installation
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [isLoading, user, setLocation]);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 relative">
          <div className="absolute top-0 right-0 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[hsl(141,100%,59%)]" />
              <span className="font-mono text-sm">{user.username}</span>
            </div>
            <Button onClick={handleLogout} variant="ghost" size="sm" className="cyber-button">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          <h1 
            className="text-4xl md:text-6xl font-black mb-4 neon-text glitch-title text-[hsl(328,100%,50%)]"
            data-text="STAK-XTRACT"
          >
            STAK-XTRACT
          </h1>
          <p 
            className="text-lg md:text-xl font-bold mb-3 text-[hsl(141,100%,59%)] glitch-word"
            data-text="by YOLO SNIPES"
          >
            <span className="glitch-word" data-text="by">by</span>{" "}
            <span className="glitch-word" data-text="YOLO">YOLO</span>{" "}
            <span className="glitch-word" data-text="SNIPES">SNIPES</span>
          </p>
          <p 
            className="text-sm md:text-base text-[hsl(24,100%,50%)] neon-text font-mono glitch-text mb-6"
            data-text="// AI-POWERED SAMPLE EXTRACTION PROTOCOL //"
          >
            // <span className="glitch-word" data-text="AI-POWERED">AI-POWERED</span>{" "}
            <span className="glitch-word" data-text="SAMPLE">SAMPLE</span>{" "}
            <span className="glitch-word" data-text="EXTRACTION">EXTRACTION</span>{" "}
            <span className="glitch-word" data-text="PROTOCOL">PROTOCOL</span> //
          </p>
          
          {/* Status Indicator */}
          <div className="flex justify-center items-center gap-3 mb-8 animate-float">
            <div className="w-3 h-3 bg-[hsl(141,100%,59%)] rounded-full animate-pulse shadow-lg shadow-[hsl(141,100%,59%)]/50"></div>
            <span 
              className="text-sm font-mono text-[hsl(141,100%,59%)] glitch-word"
              data-text="SYSTEM_ONLINE"
            >
              <span className="glitch-word" data-text="SYSTEM">SYSTEM</span>_<span className="glitch-word" data-text="ONLINE">ONLINE</span>
            </span>
            <div className="w-3 h-3 bg-[hsl(141,100%,59%)] rounded-full animate-pulse shadow-lg shadow-[hsl(141,100%,59%)]/50"></div>
          </div>
          
          {/* Data Flow Effect */}
          <div className="absolute top-0 left-0 w-full h-1 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-[hsl(328,100%,50%)] to-transparent animate-data-flow"></div>
          </div>
          
          {/* Navigation */}
          <MainMenu
            activeSection={activeSection} 
            setActiveSection={setActiveSection}
            onInstallPWA={handleInstallPWA}
            showInstall={!!deferredPrompt}
          />
        </div>

        {/* Main Content */}
        {activeSection === "main" && <AudioProcessor />}
        {activeSection !== "main" && (
          <InfoSections activeSection={activeSection} />
        )}

        {/* Footer */}
        <footer className="mt-16 text-center">
          <div className="cyber-card rounded-lg p-6 mb-6">
            <p className="text-sm font-mono text-gray-400">
              <span className="glitch-word" data-text="STAK-XTRACT">STAK-XTRACT</span> v2.0.1 | 
              <span className="glitch-word" data-text="PWA">PWA</span> ENABLED | 
              <span className="text-[hsl(141,100%,59%)] glitch-word" data-text="OFFLINE READY"> OFFLINE READY</span> | 
              © 2024 <span className="glitch-word" data-text="YOLO SNIPES">YOLO SNIPES</span>
            </p>
          </div>
          
          {/* PWA Status */}
          <div className="flex justify-center gap-6 text-xs font-mono">
            <div className="flex items-center gap-2 animate-float">
              <div className="w-2 h-2 bg-[hsl(141,100%,59%)] rounded-full animate-pulse"></div>
              <span className="glitch-word" data-text="SERVICE_WORKER_ACTIVE">SERVICE_WORKER_ACTIVE</span>
            </div>
            <div className="flex items-center gap-2 animate-float" style={{animationDelay: '0.5s'}}>
              <div className="w-2 h-2 bg-[hsl(188,94%,43%)] rounded-full animate-pulse"></div>
              <span className="glitch-word" data-text="CACHE_ENABLED">CACHE_ENABLED</span>
            </div>
            <div className="flex items-center gap-2 animate-float" style={{animationDelay: '1s'}}>
              <div className="w-2 h-2 bg-[hsl(24,100%,50%)] rounded-full animate-pulse"></div>
              <span className="glitch-word" data-text="INSTALLABLE">INSTALLABLE</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
