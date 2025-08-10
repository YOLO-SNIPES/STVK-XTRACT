import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import WaveformCanvas from "./waveform-canvas";
import SampleControls from "./sample-controls";
import SamplesDisplay from "./samples-display";
import ArrangementTimeline from "./arrangement-timeline";
import ExportControls from "./export-controls";
import { useAudioContext } from "@/hooks/use-audio-context";
import { useToast } from "@/hooks/use-toast";
import { uploadProject, getProjectStatus, getProjectStems } from "@/lib/api-client";
import type { AudioProject } from "@shared/schema";

export default function AudioProcessor() {
  const [currentProject, setCurrentProject] = useState<AudioProject | null>(null);
  const [samples, setSamples] = useState<any[]>([]);
  const [arrangement, setArrangement] = useState<any[]>([]);
  const [stemUrls, setStemUrls] = useState<string[]>([]);
  const [mutedStems, setMutedStems] = useState<boolean[]>([]);
  const [zoom, setZoom] = useState(1);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  
  const { loadAudio, playAudio, pauseAudio, stopAudio, currentTime, duration } = useAudioContext();
  const { toast } = useToast();

  const { data: projectStatus } = useQuery({
    queryKey: ["projectStatus", currentProject?.id],
    queryFn: () => getProjectStatus(currentProject!.id),
    enabled: !!currentProject && (currentProject.status === "processing" || currentProject.status === "uploaded"),
    refetchInterval: 2000, // Poll every 2 seconds
  });

  useEffect(() => {
    if (projectStatus?.status === "completed" && currentProject) {
      getProjectStems(currentProject.id).then(urls => {
        setStemUrls(urls);
        setMutedStems(new Array(urls.length).fill(false));
      });
    }
  }, [projectStatus, currentProject]);

  const handleMuteChange = (newMuted: boolean[]) => {
    setMutedStems(newMuted);
  };

  const handleSelectionChange = (newSelection: { start: number; end: number } | null) => {
    setSelection(newSelection);
  };

  const { mutate: upload, isLoading: isUploading } = useMutation({
    mutationFn: (file: File) => {
      const audio = new Audio(URL.createObjectURL(file));
      return new Promise<{ file: File; duration: number }>((resolve) => {
        audio.onloadedmetadata = () => {
          resolve({ file, duration: audio.duration });
        };
      });
    },
    onSuccess: async ({ file, duration }) => {
      try {
        const newProject = await uploadProject(file, file.name, duration);
        setCurrentProject(newProject);
        await loadAudio(file);
        toast({ title: "Upload successful", description: "Your project is now being processed." });
      } catch (error: any) {
        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      }
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    upload(file);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusMessage = () => {
    if (isUploading) return "UPLOADING...";
    if (!currentProject) return "AWAITING_INPUT";
    switch (projectStatus?.status || currentProject.status) {
      case "uploaded":
        return "QUEUED FOR PROCESSING";
      case "processing":
        return "AI_PROCESSING...";
      case "completed":
        return "COMPLETED";
      case "failed":
        return "FAILED";
      default:
        return "READY";
    }
  };

  return (
    <div className="space-y-8">
      {/* Audio Upload */}
      <Card className="cyber-card rounded-lg p-6">
        <h2 
          className="text-xl font-bold mb-6 text-[hsl(328,100%,50%)] neon-text glitch-word"
          data-text="AUDIO UPLOAD PROTOCOL"
        >
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
              disabled={isUploading || (!!currentProject && currentProject.status !== "completed" && currentProject.status !== "failed")}
            />
            <Label
              htmlFor="audioFile"
              className={`cyber-button block text-center py-4 px-6 rounded-lg cursor-pointer transition-all animate-float ${isUploading || (!!currentProject && currentProject.status !== "completed" && currentProject.status !== "failed") ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Upload className="inline-block mr-2 h-4 w-4" />
              SELECT AUDIO FILE
            </Label>
          </div>
          <div className="text-center lg:text-right">
             <p className="text-xs text-[hsl(141,100%,59%)] mt-3 font-mono">
              STATUS: {getStatusMessage()}
            </p>
          </div>
        </div>
        
        {currentProject && (
          <div className="mt-4 p-4 bg-[hsl(0,0%,10%)] rounded border border-[hsl(141,100%,59%)]/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-mono">
              <div>FILENAME: {currentProject.name}</div>
              <div>DURATION: {formatTime(currentProject.duration || 0)}</div>
              <div>SIZE: {((currentProject.size || 0) / 1024 / 1024).toFixed(2)} MB</div>
            </div>
          </div>
        )}
      </Card>

      {/* Waveform Visualization */}
      <Card className="cyber-card rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2
            className="text-xl font-bold text-[hsl(328,100%,50%)] neon-text glitch-word"
            data-text="WAVEFORM ANALYSIS"
          >
            WAVEFORM ANALYSIS
          </h2>
          <div className="flex gap-2">
            <Button onClick={() => setZoom(z => Math.min(z * 1.5, 10))} size="sm" className="cyber-button font-mono">[+]</Button>
            <Button onClick={() => setZoom(z => Math.max(z / 1.5, 1))} size="sm" className="cyber-button font-mono">[-]</Button>
            <Button onClick={() => setZoom(1)} size="sm" className="cyber-button font-mono">[RST]</Button>
          </div>
        </div>
        <div className="waveform-container rounded-lg p-4 min-h-32">
          <WaveformCanvas
            stemUrls={stemUrls}
            samples={samples}
            mutedStems={mutedStems}
            zoom={zoom}
            onSelectionChange={handleSelectionChange}
          />
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-3">
              <Button onClick={playAudio} disabled={!currentProject} className="cyber-button px-4 py-2 rounded text-sm animate-float">PLAY</Button>
              <Button onClick={pauseAudio} disabled={!currentProject} className="bg-[hsl(24,100%,50%)] hover:bg-orange-400 text-black px-4 py-2 rounded text-sm transition-all animate-float">PAUSE</Button>
              <Button onClick={stopAudio} disabled={!currentProject} className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded text-sm transition-all animate-float">STOP</Button>
            </div>
            <Button
              onClick={() => console.log("Extracting sample:", selection)}
              disabled={!selection}
              className="cyber-button font-bold"
            >
              [EXTRACT_SAMPLE.exe]
            </Button>
            <div className="text-sm font-mono text-[hsl(141,100%,59%)]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>
      </Card>

      {/* Sample Extraction */}
      <SampleControls
        samples={samples} 
        setSamples={setSamples}
        isProcessing={projectStatus?.status === "processing"}
      />

      <SamplesDisplay stems={stemUrls} onMuteChange={handleMuteChange} />

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
    </div>
  );
}
