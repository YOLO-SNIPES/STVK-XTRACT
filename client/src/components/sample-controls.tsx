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
      <h2 
        className="text-xl font-bold mb-6 text-[hsl(328,100%,50%)] neon-text glitch-word"
        data-text="SAMPLE EXTRACTION MATRIX"
      >
        <span className="glitch-word" data-text="SAMPLE">SAMPLE</span>{" "}
        <span className="glitch-word" data-text="EXTRACTION">EXTRACTION</span>{" "}
        <span className="glitch-word" data-text="MATRIX">MATRIX</span>
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Extraction Controls */}
        <div className="lg:col-span-1">
          <h3 
            className="text-lg font-bold mb-4 text-[hsl(24,100%,50%)] glitch-word"
            data-text="AI PROCESSING PARAMETERS"
          >
            AI PROCESSING PARAMETERS
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-mono text-[hsl(141,100%,59%)] mb-2">
                ANALYSIS_TYPE
              </Label>
              <Select defaultValue="sample_extraction">
                <SelectTrigger className="bg-[hsl(0,0%,10%)] border border-[hsl(141,100%,59%)]/30 text-white font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sample_extraction">Sample Extraction</SelectItem>
                  <SelectItem value="beat_detection">Beat Detection</SelectItem>
                  <SelectItem value="melody_analysis">Melody Analysis</SelectItem>
                  <SelectItem value="full_analysis">Full Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm font-mono text-[hsl(141,100%,59%)] mb-2">
                SENSITIVITY_LEVEL
              </Label>
              <Select defaultValue="medium">
                <SelectTrigger className="bg-[hsl(0,0%,10%)] border border-[hsl(141,100%,59%)]/30 text-white font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (Fewer samples)</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High (More samples)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Extracted Samples */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-bold mb-3 text-[hsl(24,100%,50%)]">EXTRACTED SAMPLES</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {samples.length > 0 ? (
              samples.map((sample) => (
                <div key={sample.id} className="cyber-card p-3 rounded flex flex-col justify-between items-start">
                  <div>
                    <span className="font-mono text-sm font-bold text-white">{sample.name}</span>
                    <span className="text-xs text-gray-400 block">{sample.duration}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
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
              <div className="col-span-full text-center py-8 text-gray-400 font-mono">
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
