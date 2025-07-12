import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Play } from "lucide-react";

interface ArrangementTimelineProps {
  samples: any[];
  arrangement: any[];
  setArrangement: (arrangement: any[]) => void;
}

export default function ArrangementTimeline({ samples, arrangement, setArrangement }: ArrangementTimelineProps) {
  const clearArrangement = () => {
    setArrangement([]);
  };

  const addToArrangement = (sample: any) => {
    setArrangement([...arrangement, { ...sample, id: Date.now() }]);
  };

  // Create 16 timeline slots
  const timelineSlots = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    sample: arrangement[i] || null
  }));

  return (
    <Card className="cyber-card rounded-lg p-6">
      <h2 
        className="text-xl font-bold mb-6 text-[hsl(328,100%,50%)] neon-text glitch-word"
        data-text="ARRANGEMENT TIMELINE"
      >
        <span className="glitch-word" data-text="ARRANGEMENT">ARRANGEMENT</span>{" "}
        <span className="glitch-word" data-text="TIMELINE">TIMELINE</span>
      </h2>
      <div className="bg-[hsl(0,0%,10%)] rounded-lg p-4 min-h-40">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button
              onClick={clearArrangement}
              className="bg-red-500 hover:bg-red-400 text-white px-3 py-1 rounded text-sm"
            >
              CLEAR
            </Button>
            <Button className="cyber-button px-3 py-1 rounded text-sm">
              PLAY SEQUENCE
            </Button>
          </div>
          <div className="text-sm font-mono text-[hsl(141,100%,59%)] flex items-center gap-2">
            BPM: 
            <Input
              type="number"
              defaultValue={120}
              min={60}
              max={200}
              className="bg-[hsl(0,0%,4%)] border border-[hsl(141,100%,59%)]/30 w-16 text-white"
            />
          </div>
        </div>
        
        {/* Timeline Grid */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-1 min-h-32 p-2 border-2 border-dashed border-[hsl(141,100%,59%)]/30 rounded">
          {timelineSlots.map((slot) => (
            <div
              key={slot.id}
              className={`bg-[hsl(0,0%,10%)]/50 border border-gray-600 rounded aspect-square flex items-center justify-center text-xs font-mono transition-colors cursor-pointer ${
                slot.sample 
                  ? 'bg-[hsl(328,100%,50%)]/20 border-[hsl(328,100%,50%)]' 
                  : 'hover:bg-[hsl(141,100%,59%)]/20'
              }`}
            >
              {slot.sample ? (
                <span className="text-white text-[10px] text-center">
                  {slot.sample.name.substring(0, 8)}
                </span>
              ) : (
                <span className="text-gray-500">EMPTY</span>
              )}
            </div>
          ))}
        </div>
        
        <p className="text-xs text-gray-400 mt-2 font-mono">
          // CLICK SAMPLES BELOW TO ADD TO TIMELINE //
        </p>

        {/* Quick Add Sample Buttons */}
        {samples.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-mono text-[hsl(24,100%,50%)] mb-2">QUICK ADD:</h4>
            <div className="flex flex-wrap gap-1">
              {samples.slice(0, 8).map((sample) => (
                <Button
                  key={sample.id}
                  onClick={() => addToArrangement(sample)}
                  className="bg-[hsl(141,100%,59%)]/20 hover:bg-[hsl(141,100%,59%)]/40 text-white px-2 py-1 text-xs font-mono border border-[hsl(141,100%,59%)]/30"
                >
                  {sample.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
