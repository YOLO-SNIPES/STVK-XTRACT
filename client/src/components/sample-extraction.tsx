import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Edit } from "lucide-react";

interface SampleExtractionProps {
  samples: any[];
  setSamples: (samples: any[]) => void;
  isProcessing: boolean;
}

export default function SampleExtraction({ samples, setSamples, isProcessing }: SampleExtractionProps) {
  return (
    <Card className="cyber-card rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-[hsl(328,100%,50%)] neon-text">
        SAMPLE EXTRACTION MATRIX
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Extraction Controls */}
        <div>
          <h3 className="text-lg font-bold mb-3 text-[hsl(24,100%,50%)]">AI PROCESSING PARAMETERS</h3>
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-mono text-[hsl(141,100%,59%)] mb-2">
                SENSITIVITY THRESHOLD
              </Label>
              <Slider
                defaultValue={[75]}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>LOW</span>
                <span className="text-[hsl(141,100%,59%)] font-mono">75%</span>
                <span>HIGH</span>
              </div>
            </div>
            
            <div>
              <Label className="block text-sm font-mono text-[hsl(141,100%,59%)] mb-2">
                MINIMUM DURATION (MS)
              </Label>
              <Input
                type="number"
                defaultValue={500}
                min={100}
                max={5000}
                step={100}
                className="bg-[hsl(0,0%,10%)] border border-[hsl(141,100%,59%)]/30 text-white font-mono"
              />
            </div>
            
            <div>
              <Label className="block text-sm font-mono text-[hsl(141,100%,59%)] mb-2">
                EXTRACTION MODE
              </Label>
              <Select defaultValue="auto">
                <SelectTrigger className="bg-[hsl(0,0%,10%)] border border-[hsl(141,100%,59%)]/30 text-white font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">AUTO_DETECT</SelectItem>
                  <SelectItem value="drums">DRUM_SAMPLES</SelectItem>
                  <SelectItem value="melody">MELODIC_LOOPS</SelectItem>
                  <SelectItem value="vocal">VOCAL_CHOPS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Extracted Samples */}
        <div>
          <h3 className="text-lg font-bold mb-3 text-[hsl(24,100%,50%)]">EXTRACTED SAMPLES</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {samples.length > 0 ? (
              samples.map((sample) => (
                <div key={sample.id} className="arrangement-item p-3 rounded flex justify-between items-center">
                  <div>
                    <span className="font-mono text-sm">{sample.name}</span>
                    <span className="text-xs text-gray-300 ml-2">{sample.duration}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      size="sm"
                      className="bg-[hsl(141,100%,59%)] hover:bg-green-400 text-black px-2 py-1 text-xs"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm"
                      className="bg-[hsl(24,100%,50%)] hover:bg-orange-400 text-black px-2 py-1 text-xs"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 font-mono">
                {isProcessing ? (
                  <>
                    <div className="loading-spinner mx-auto mb-2"></div>
                    <p>EXTRACTING SAMPLES...</p>
                  </>
                ) : (
                  <p>AWAITING EXTRACTION...</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
