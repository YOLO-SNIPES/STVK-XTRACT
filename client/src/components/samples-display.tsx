import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";

interface SamplesDisplayProps {
  stems: string[];
  onMuteChange: (muted: boolean[]) => void;
}

export default function SamplesDisplay({ stems, onMuteChange }: SamplesDisplayProps) {
  const [muted, setMuted] = useState<boolean[]>([]);

  useState(() => {
    setMuted(new Array(stems.length).fill(false));
  });

  const handleMuteToggle = (index: number) => {
    const newMuted = [...muted];
    newMuted[index] = !newMuted[index];
    setMuted(newMuted);
    onMuteChange(newMuted);
  };

  if (stems.length === 0) {
    return null;
  }

  return (
    <Card className="cyber-card rounded-lg p-6">
      <h2
        className="text-xl font-bold mb-6 text-[hsl(328,100%,50%)] neon-text glitch-word"
        data-text="SEPARATED TRACKS"
      >
        SEPARATED TRACKS
      </h2>
      <div className="space-y-4">
        {stems.map((stemUrl, index) => {
          const stemName = stemUrl.split("/").pop()?.replace(".mp3", "").replace(".wav", "") || "stem";
          return (
            <div key={stemUrl} className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor={stemUrl} className="capitalize font-mono">{stemName}</Label>
                <audio id={stemUrl} controls src={stemUrl} className="w-full" muted={muted[index]}/>
              </div>
              <Button onClick={() => handleMuteToggle(index)} variant="ghost" size="icon">
                {muted[index] ? <VolumeX className="h-5 w-5 text-red-500" /> : <Volume2 className="h-5 w-5 text-green-500" />}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
