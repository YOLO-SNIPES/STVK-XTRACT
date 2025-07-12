import { useState } from "react";
import AudioProcessor from "@/components/audio-processor";
import NavigationTabs from "@/components/navigation-tabs";
import InfoSections from "@/components/info-sections";
import { Play, Square, User } from "lucide-react";

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>("main");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // PWA Installation
  useState(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  });

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen text-white">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <h1 className="text-4xl md:text-6xl font-black mb-2 neon-text glitch-text text-[hsl(328,100%,50%)]">
            STAK-XTRACT
          </h1>
          <p className="text-lg md:text-xl font-bold mb-1 text-[hsl(141,100%,59%)]">
            by YOLO SNIPES
          </p>
          <p className="text-sm md:text-base text-[hsl(24,100%,50%)] neon-text font-mono">
            // AI-POWERED SAMPLE EXTRACTION PROTOCOL //
          </p>
          
          {/* Status Indicator */}
          <div className="flex justify-center items-center gap-2 mt-4">
            <div className="w-2 h-2 bg-[hsl(141,100%,59%)] rounded-full animate-pulse"></div>
            <span className="text-xs font-mono text-[hsl(141,100%,59%)]">SYSTEM_ONLINE</span>
            <div className="w-2 h-2 bg-[hsl(141,100%,59%)] rounded-full animate-pulse"></div>
          </div>
          
          {/* Navigation */}
          <NavigationTabs 
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
        <footer className="mt-12 text-center">
          <div className="cyber-card rounded-lg p-4 mb-4">
            <p className="text-sm font-mono text-gray-400">
              STAK-XTRACT v2.0.1 | PWA ENABLED | 
              <span className="text-[hsl(141,100%,59%)]"> OFFLINE READY</span> | 
              © 2024 YOLO SNIPES
            </p>
          </div>
          
          {/* PWA Status */}
          <div className="flex justify-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-[hsl(141,100%,59%)] rounded-full"></div>
              <span>SERVICE_WORKER_ACTIVE</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-[hsl(188,94%,43%)] rounded-full"></div>
              <span>CACHE_ENABLED</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-[hsl(24,100%,50%)] rounded-full"></div>
              <span>INSTALLABLE</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
