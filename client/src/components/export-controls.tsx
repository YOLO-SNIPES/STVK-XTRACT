import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import { exportAsZip } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";

interface ExportControlsProps {
  samples: any[];
  arrangement: any[];
}

export default function ExportControls({ samples, arrangement }: ExportControlsProps) {
  const [exportOptions, setExportOptions] = useState({
    individualSamples: true,
    arrangementMixdown: false,
    projectMetadata: true,
    format: "wav"
  });
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (samples.length === 0) {
      toast({
        title: "No Samples",
        description: "Extract samples before exporting",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    try {
      await exportAsZip(samples, arrangement, exportOptions);
      
      toast({
        title: "Export Complete",
        description: "Download package created successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to create download package",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const totalSize = samples.length * 1.2; // Mock calculation

  return (
    <Card className="cyber-card rounded-lg p-6">
      <h2 
        className="text-xl font-bold mb-6 text-[hsl(328,100%,50%)] neon-text glitch-word"
        data-text="EXPORT PROTOCOL"
      >
        <span className="glitch-word" data-text="EXPORT">EXPORT</span>{" "}
        <span className="glitch-word" data-text="PROTOCOL">PROTOCOL</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold mb-3 text-[hsl(24,100%,50%)]">EXPORT OPTIONS</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="individualSamples"
                checked={exportOptions.individualSamples}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, individualSamples: !!checked }))
                }
              />
              <Label htmlFor="individualSamples" className="text-sm font-mono">
                INDIVIDUAL SAMPLES
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="arrangementMixdown"
                checked={exportOptions.arrangementMixdown}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, arrangementMixdown: !!checked }))
                }
              />
              <Label htmlFor="arrangementMixdown" className="text-sm font-mono">
                ARRANGEMENT MIXDOWN
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="projectMetadata"
                checked={exportOptions.projectMetadata}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, projectMetadata: !!checked }))
                }
              />
              <Label htmlFor="projectMetadata" className="text-sm font-mono">
                PROJECT METADATA
              </Label>
            </div>
            
            <div>
              <Label className="block text-sm font-mono text-[hsl(141,100%,59%)] mb-2">
                OUTPUT FORMAT
              </Label>
              <Select
                value={exportOptions.format}
                onValueChange={(value) => 
                  setExportOptions(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger className="bg-[hsl(0,0%,10%)] border border-[hsl(141,100%,59%)]/30 text-white font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wav">WAV (Uncompressed)</SelectItem>
                  <SelectItem value="mp3">MP3 (320kbps)</SelectItem>
                  <SelectItem value="flac">FLAC (Lossless)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-bold mb-3 text-[hsl(24,100%,50%)]">DOWNLOAD PACKAGE</h3>
          <div className="bg-[hsl(0,0%,10%)] rounded p-4 mb-4">
            <div className="text-sm font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">SAMPLES:</span>
                <span className="text-white">{samples.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">TOTAL SIZE:</span>
                <span className="text-white">{totalSize.toFixed(1)} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">FORMAT:</span>
                <span className="text-white">{exportOptions.format.toUpperCase()}</span>
              </div>
            </div>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting || samples.length === 0}
            className="cyber-button w-full py-3 rounded-lg font-bold"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "GENERATING..." : "GENERATE DOWNLOAD PACKAGE"}
          </Button>
          <p className="text-xs text-gray-400 mt-2 font-mono">
            // CREATES ZIP FILE WITH EXTRACTED SAMPLES //
          </p>
        </div>
      </div>
    </Card>
  );
}
