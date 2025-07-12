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
    <div className="space-y-6">
      {/* Audio Upload */}
      <Card className="cyber-card rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-[hsl(328,100%,50%)] neon-text">
          AUDIO UPLOAD PROTOCOL
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
              className="cyber-button block text-center py-4 px-6 rounded-lg cursor-pointer transition-all"
            >
              <Upload className="inline-block mr-2 h-4 w-4" />
              SELECT AUDIO FILE
            </Label>
            <p className="text-xs text-gray-400 mt-2 font-mono">
              // SUPPORTED: MP3, WAV, FLAC, OGG //
            </p>
          </div>
          <div className="text-center lg:text-right">
            <Button
              onClick={handleProcessAudio}
              disabled={!audioFile || isProcessing}
              className="cyber-button px-6 py-3 rounded-lg disabled:opacity-50"
            >
              {isProcessing ? "PROCESSING..." : "INITIALIZE EXTRACTION"}
            </Button>
            <p className="text-xs text-[hsl(141,100%,59%)] mt-2 font-mono">
              STATUS: {audioFile ? "READY" : "AWAITING_INPUT"}
            </p>
          </div>
        </div>
        
        {/* Audio Info */}
        {audioInfo && (
          <div className="mt-4 p-4 bg-[hsl(0,0%,10%)] rounded border border-[hsl(141,100%,59%)]/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-mono">
              <div>
                <span className="text-[hsl(24,100%,50%)]">FILENAME:</span>
                <span className="text-white ml-2">{audioInfo.filename}</span>
              </div>
              <div>
                <span className="text-[hsl(24,100%,50%)]">DURATION:</span>
                <span className="text-white ml-2">{audioInfo.duration}</span>
              </div>
              <div>
                <span className="text-[hsl(24,100%,50%)]">SIZE:</span>
                <span className="text-white ml-2">{audioInfo.size}</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Waveform Visualization */}
      <Card className="cyber-card rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-[hsl(328,100%,50%)] neon-text">
          WAVEFORM ANALYSIS
        </h2>
        <div className="waveform-container rounded-lg p-4 min-h-32">
          <WaveformCanvas audioFile={audioFile} samples={samples} />
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-2">
              <Button
                onClick={playAudio}
                disabled={!audioFile}
                className="cyber-button px-4 py-2 rounded text-sm"
              >
                <Play className="mr-1 h-4 w-4" /> PLAY
              </Button>
              <Button
                onClick={pauseAudio}
                disabled={!audioFile}
                className="bg-[hsl(24,100%,50%)] hover:bg-orange-400 text-black px-4 py-2 rounded text-sm transition-colors"
              >
                <Pause className="mr-1 h-4 w-4" /> PAUSE
              </Button>
              <Button
                onClick={stopAudio}
                disabled={!audioFile}
                className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                <Square className="mr-1 h-4 w-4" /> STOP
              </Button>
            </div>
            <div className="text-sm font-mono text-[hsl(141,100%,59%)]">
              {formatTime(currentTime)} / {formatTime(duration)}
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
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-[hsl(328,100%,50%)] font-mono font-bold">PROCESSING AUDIO...</p>
            <p className="text-sm text-gray-400 font-mono">// AI EXTRACTION IN PROGRESS //</p>
          </div>
        </div>
      )}
    </div>
  );
}
