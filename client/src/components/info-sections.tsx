import { Card } from "@/components/ui/card";

interface InfoSectionsProps {
  activeSection: string;
}

export default function InfoSections({ activeSection }: InfoSectionsProps) {
  if (activeSection === "guide") {
    return (
      <Card className="cyber-card rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-[hsl(328,100%,50%)] neon-text">USER GUIDE</h2>
        <div className="prose prose-invert max-w-none font-mono text-sm">
          <h3 className="text-[hsl(24,100%,50%)]">QUICK START PROTOCOL</h3>
          <ol className="space-y-2 text-gray-300">
            <li><strong className="text-[hsl(141,100%,59%)]">STEP 1:</strong> Upload audio file using SELECT AUDIO FILE button</li>
            <li><strong className="text-[hsl(141,100%,59%)]">STEP 2:</strong> Adjust AI processing parameters in SAMPLE EXTRACTION MATRIX</li>
            <li><strong className="text-[hsl(141,100%,59%)]">STEP 3:</strong> Click INITIALIZE EXTRACTION to analyze audio</li>
            <li><strong className="text-[hsl(141,100%,59%)]">STEP 4:</strong> Review extracted samples and arrange on timeline</li>
            <li><strong className="text-[hsl(141,100%,59%)]">STEP 5:</strong> Export your samples using GENERATE DOWNLOAD PACKAGE</li>
          </ol>
          
          <h3 className="text-[hsl(24,100%,50%)] mt-6">ADVANCED FEATURES</h3>
          <ul className="space-y-2 text-gray-300">
            <li><strong className="text-[hsl(141,100%,59%)]">WAVEFORM ANALYSIS:</strong> Interactive visualization with click-to-navigate</li>
            <li><strong className="text-[hsl(141,100%,59%)]">AI EXTRACTION:</strong> Multiple detection modes for different sample types</li>
            <li><strong className="text-[hsl(141,100%,59%)]">TIMELINE SEQUENCER:</strong> Drag-and-drop arrangement system</li>
            <li><strong className="text-[hsl(141,100%,59%)]">PWA SUPPORT:</strong> Install as desktop/mobile app for offline use</li>
          </ul>
        </div>
      </Card>
    );
  }

  if (activeSection === "faq") {
    return (
      <Card className="cyber-card rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-[hsl(328,100%,50%)] neon-text">FREQUENTLY ASKED QUESTIONS</h2>
        <div className="space-y-4 font-mono text-sm">
          <div className="border-l-2 border-[hsl(24,100%,50%)] pl-4">
            <h3 className="text-[hsl(24,100%,50%)] font-bold">Q: What audio formats are supported?</h3>
            <p className="text-gray-300">A: MP3, WAV, FLAC, and OGG formats are fully supported.</p>
          </div>
          <div className="border-l-2 border-[hsl(24,100%,50%)] pl-4">
            <h3 className="text-[hsl(24,100%,50%)] font-bold">Q: How does the AI extraction work?</h3>
            <p className="text-gray-300">A: Our algorithm analyzes audio patterns to identify distinct samples and loops automatically.</p>
          </div>
          <div className="border-l-2 border-[hsl(24,100%,50%)] pl-4">
            <h3 className="text-[hsl(24,100%,50%)] font-bold">Q: Can I use this offline?</h3>
            <p className="text-gray-300">A: Yes! Install as a PWA for full offline functionality.</p>
          </div>
          <div className="border-l-2 border-[hsl(24,100%,50%)] pl-4">
            <h3 className="text-[hsl(24,100%,50%)] font-bold">Q: What is the maximum file size?</h3>
            <p className="text-gray-300">A: Files up to 100MB are supported for optimal performance.</p>
          </div>
        </div>
      </Card>
    );
  }

  if (activeSection === "privacy") {
    return (
      <Card className="cyber-card rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-[hsl(24,100%,50%)] neon-text">PRIVACY PROTOCOL</h2>
        <div className="space-y-4 font-mono text-sm text-gray-300">
          <p>At YOLO SNIPES, your privacy is paramount. This protocol outlines how STAK-XTRACT handles your data:</p>
          
          <div>
            <h3 className="text-[hsl(24,100%,50%)] font-bold mb-2">Data Processing:</h3>
            <p>All audio processing and sample extraction occurs directly within your browser using Web Audio API. Your audio files are never uploaded to external servers for analysis. This ensures your sensitive audio data remains private and secure on your device.</p>
          </div>
          
          <div>
            <h3 className="text-[hsl(24,100%,50%)] font-bold mb-2">No Personal Data Collection:</h3>
            <p>STAK-XTRACT does not collect any personal identifying information (PII) about you or your usage patterns. We do not use cookies for tracking, nor do we store any user data.</p>
          </div>
          
          <div>
            <h3 className="text-[hsl(24,100%,50%)] font-bold mb-2">Local Storage:</h3>
            <p>Any temporary data (like loaded audio buffers or extracted sample metadata) is stored only in your browser's memory for the duration of your session and is cleared when you close the tab.</p>
          </div>
          
          <p>By using STAK-XTRACT, you agree to this privacy protocol. We are committed to transparency and protecting your digital privacy.</p>
        </div>
      </Card>
    );
  }

  if (activeSection === "terms") {
    return (
      <Card className="cyber-card rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-[hsl(251,91%,64%)] neon-text">TERMS OF SERVICE</h2>
        <div className="space-y-4 font-mono text-sm text-gray-300">
          <p>Welcome to STAK-XTRACT. By accessing or using this application, you agree to be bound by these Terms of Service.</p>
          
          <div>
            <h3 className="text-[hsl(24,100%,50%)] font-bold mb-2">1. Acceptance of Terms:</h3>
            <p>By using STAK-XTRACT, you confirm your acceptance of these Terms and agree to comply with them.</p>
          </div>
          
          <div>
            <h3 className="text-[hsl(24,100%,50%)] font-bold mb-2">2. Use of Service:</h3>
            <p>STAK-XTRACT is provided for your personal, non-commercial use to extract and arrange audio samples. You agree not to use the application for any unlawful purpose.</p>
          </div>
          
          <div>
            <h3 className="text-[hsl(24,100%,50%)] font-bold mb-2">3. Intellectual Property:</h3>
            <p>All intellectual property rights in the application and its content (excluding user-uploaded audio) are owned by YOLO SNIPES.</p>
          </div>
          
          <div>
            <h3 className="text-[hsl(24,100%,50%)] font-bold mb-2">4. User-Uploaded Content:</h3>
            <p>You retain all rights to the audio files you upload to STAK-XTRACT. Processing occurs client-side and audio files are not stored on our servers.</p>
          </div>
          
          <p>For any questions regarding these terms, please contact SYSTEM_ADMIN@YOLOSNIPES.DEV</p>
        </div>
      </Card>
    );
  }

  if (activeSection === "disclaimer") {
    return (
      <Card className="cyber-card rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-[hsl(328,100%,50%)] neon-text">DISCLAIMER</h2>
        <div className="space-y-4 font-mono text-sm text-gray-300">
          <p>STAK-XTRACT is a demonstration and educational tool. Please read the following disclaimers carefully:</p>
          
          <div>
            <h3 className="text-[hsl(24,100%,50%)] font-bold mb-2">AI Functionality:</h3>
            <p>The "AI Analysis" features use signal processing algorithms for audio analysis. While these provide real analysis, they operate within browser limitations and are not a substitute for professional-grade Digital Audio Workstations (DAWs).</p>
          </div>
          
          <div>
            <h3 className="text-[hsl(24,100%,50%)] font-bold mb-2">Audio Quality & Accuracy:</h3>
            <p>Sample extraction accuracy depends on audio quality and complexity. Results may vary based on source material and browser capabilities.</p>
          </div>
          
          <div>
            <h3 className="text-[hsl(24,100%,50%)] font-bold mb-2">Browser Compatibility:</h3>
            <p>This application requires modern browsers with Web Audio API support. Some features may not work on older browsers or mobile devices.</p>
          </div>
          
          <p className="text-[hsl(328,100%,50%)]">USE AT YOUR OWN RISK. YOLO SNIPES IS NOT RESPONSIBLE FOR ANY DATA LOSS OR AUDIO PROCESSING ISSUES.</p>
        </div>
      </Card>
    );
  }

  return null;
}
