import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Play, Pause, Square } from "lucide-react";
import WaveformCanvas from "./waveform-canvas";
import SampleExtraction from "./sample-extraction";
import ArrangementTimeline from "./arrangement-timeline";
import ExportControls from "./export-controls";
import { useAudioContext } from "@/hooks/use-audio-context";
import { useToast } from "@/hooks/use-toast";

export default function AudioProcessor() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioInfo, setAudioInfo] = useState<{filename: string, duration: string, size: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [samples, setSamples] = useState<any[]>([]);
  const [arrangement, setArrangement] = useState<any[]>([]);
  
  const { audioContext, isPlaying, currentTime, duration, loadAudio, playAudio, pauseAudio, stopAudio } = useAudioContext();
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setAudioFile(file);
      setAudioInfo({
        filename: file.name,
        duration: "Loading...",
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
      });

      await loadAudio(file);
      
      // Update duration once loaded
      setAudioInfo(prev => prev ? {
        ...prev,
        duration: formatTime(duration)
      } : null);

      toast({
        title: "Audio Loaded",
        description: `Successfully loaded ${file.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load audio file",
        variant: "destructive"
      });
    }
  };

  const handleProcessAudio = async () => {
    if (!audioFile || !audioContext) return;

    setIsProcessing(true);
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock samples for demonstration
      const mockSamples = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        name: `SAMPLE_${String(i + 1).padStart(3, '0')}`,
        duration: `${(Math.random() * 2 + 0.5).toFixed(1)}s`,
        startTime: i * 5,
        endTime: i * 5 + 2,
        waveform: Array.from({ length: 50 }, () => Math.random())
      }));
      
      setSamples(mockSamples);
      
      toast({
        title: "Extraction Complete",
        description: `Extracted ${mockSamples.length} samples`,
      });
    } catch (error) {
      toast({
        title: "Processing Error",
        description: "Failed to process audio",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      {/* Audio Upload */}
      <Card className="cyber-card rounded-lg p-6">
        <h2 
          className="text-xl font-bold mb-6 text-[hsl(328,100%,50%)] neon-text glitch-word"
          data-text="AUDIO UPLOAD PROTOCOL"
        >
          <span className="glitch-word" data-text="AUDIO">AUDIO</span>{" "}
          <span className="glitch-word" data-text="UPLOAD">UPLOAD</span>{" "}
          <span className="glitch-word" data-text="PROTOCOL">PROTOCOL</span>
        </h2>
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <Input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
              id="audioFile"
            />
            <Label
              htmlFor="audioFile"
              className="cyber-button block text-center py-4 px-6 rounded-lg cursor-pointer transition-all animate-float"
            >
              <Upload className="inline-block mr-2 h-4 w-4" />
              <span className="glitch-word" data-text="SELECT AUDIO FILE">SELECT AUDIO FILE</span>
            </Label>
            <p className="text-xs text-gray-400 mt-3 font-mono">
              // <span className="glitch-word" data-text="SUPPORTED">SUPPORTED</span>: 
              <span className="text-[hsl(141,100%,59%)]">MP3, WAV, FLAC, OGG</span> //
            </p>
          </div>
          <div className="text-center lg:text-right">
            <Button
              onClick={handleProcessAudio}
              disabled={!audioFile || isProcessing}
              className="cyber-button px-6 py-3 rounded-lg disabled:opacity-50 animate-pulse-neon"
            >
              <span className="glitch-word" data-text={isProcessing ? "PROCESSING..." : "INITIALIZE EXTRACTION"}>
                {isProcessing ? "PROCESSING..." : "INITIALIZE EXTRACTION"}
              </span>
            </Button>
            <p className="text-xs text-[hsl(141,100%,59%)] mt-3 font-mono">
              <span className="glitch-word" data-text="STATUS">STATUS</span>: {" "}
              <span className="glitch-word" data-text={audioFile ? "READY" : "AWAITING_INPUT"}>
                {audioFile ? "READY" : "AWAITING_INPUT"}
              </span>
            </p>
          </div>
        </div>
        
        {/* Audio Info */}
        {audioInfo && (
          <div className="mt-4 p-4 bg-[hsl(0,0%,10%)] rounded border border-[hsl(141,100%,59%)]/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-mono">
              <div>
                <span className="text-[hsl(24,100%,50%)] glitch-word" data-text="FILENAME">FILENAME</span>:
                <span className="text-white ml-2 glitch-word" data-text={audioInfo.filename}>{audioInfo.filename}</span>
              </div>
              <div>
                <span className="text-[hsl(24,100%,50%)] glitch-word" data-text="DURATION">DURATION</span>:
                <span className="text-white ml-2 glitch-word" data-text={audioInfo.duration}>{audioInfo.duration}</span>
              </div>
              <div>
                <span className="text-[hsl(24,100%,50%)] glitch-word" data-text="SIZE">SIZE</span>:
                <span className="text-white ml-2 glitch-word" data-text={audioInfo.size}>{audioInfo.size}</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Waveform Visualization */}
      <Card className="cyber-card rounded-lg p-6">
        <h2 
          className="text-xl font-bold mb-6 text-[hsl(328,100%,50%)] neon-text glitch-word"
          data-text="WAVEFORM ANALYSIS"
        >
          <span className="glitch-word" data-text="WAVEFORM">WAVEFORM</span>{" "}
          <span className="glitch-word" data-text="ANALYSIS">ANALYSIS</span>
        </h2>
        <div className="waveform-container rounded-lg p-4 min-h-32">
          <WaveformCanvas audioFile={audioFile} samples={samples} />
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-3">
              <Button
                onClick={playAudio}
                disabled={!audioFile}
                className="cyber-button px-4 py-2 rounded text-sm animate-float"
              >
                <Play className="mr-1 h-4 w-4" /> 
                <span className="glitch-word" data-text="PLAY">PLAY</span>
              </Button>
              <Button
                onClick={pauseAudio}
                disabled={!audioFile}
                className="bg-[hsl(24,100%,50%)] hover:bg-orange-400 text-black px-4 py-2 rounded text-sm transition-all animate-float"
                style={{animationDelay: '0.2s'}}
              >
                <Pause className="mr-1 h-4 w-4" /> 
                <span className="glitch-word" data-text="PAUSE">PAUSE</span>
              </Button>
              <Button
                onClick={stopAudio}
                disabled={!audioFile}
                className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded text-sm transition-all animate-float"
                style={{animationDelay: '0.4s'}}
              >
                <Square className="mr-1 h-4 w-4" /> 
                <span className="glitch-word" data-text="STOP">STOP</span>
              </Button>
            </div>
            <div className="text-sm font-mono text-[hsl(141,100%,59%)] glitch-word" data-text={`${formatTime(currentTime)} / ${formatTime(duration)}`}>
              <span className="glitch-word" data-text={formatTime(currentTime)}>{formatTime(currentTime)}</span> / <span className="glitch-word" data-text={formatTime(duration)}>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Sample Extraction */}
      <SampleExtraction 
        samples={samples} 
        setSamples={setSamples}
        isProcessing={isProcessing}
      />

      {/* Arrangement Timeline */}
      <ArrangementTimeline 
        samples={samples}
        arrangement={arrangement}
        setArrangement={setArrangement}
      />

      {/* Export Controls */}
      <ExportControls 
        samples={samples}
        arrangement={arrangement}
      />

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-[hsl(0,0%,4%)]/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center animate-float">
            <div className="loading-spinner mx-auto mb-6"></div>
            <p 
              className="text-[hsl(328,100%,50%)] font-mono font-bold text-lg glitch-text mb-2"
              data-text="PROCESSING AUDIO..."
            >
              <span className="glitch-word" data-text="PROCESSING">PROCESSING</span>{" "}
              <span className="glitch-word" data-text="AUDIO">AUDIO</span>...
            </p>
            <p className="text-sm text-gray-400 font-mono glitch-word" data-text="// AI EXTRACTION IN PROGRESS //">
              // <span className="glitch-word" data-text="AI">AI</span>{" "}
              <span className="glitch-word" data-text="EXTRACTION">EXTRACTION</span>{" "}
              <span className="glitch-word" data-text="IN">IN</span>{" "}
              <span className="glitch-word" data-text="PROGRESS">PROGRESS</span> //
            </p>
            
            {/* Data streams */}
            <div className="absolute -top-10 left-0 w-full h-1 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-transparent via-[hsl(328,100%,50%)] to-transparent animate-data-flow"></div>
            </div>
            <div className="absolute -bottom-10 left-0 w-full h-1 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-transparent via-[hsl(141,100%,59%)] to-transparent animate-data-flow" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
