// @ts-ignore
import JSZip from 'jszip';
// @ts-ignore
import { saveAs } from 'file-saver';
import { audioBufferToWav, AudioSample } from './audio-utils';

export interface ExportOptions {
  individualSamples: boolean;
  arrangementMixdown: boolean;
  projectMetadata: boolean;
  format: string;
}

export async function exportAsZip(
  samples: AudioSample[], 
  arrangement: any[], 
  options: ExportOptions
): Promise<void> {
  const zip = new JSZip();
  
  // Create folder structure
  const samplesFolder = zip.folder('samples');
  const arrangementsFolder = zip.folder('arrangements');
  
  if (options.individualSamples && samplesFolder) {
    // Add individual samples
    for (const sample of samples) {
      const fileName = `${sample.name}.${options.format}`;
      
      // Create mock audio data for demonstration
      const mockAudioData = createMockAudioBuffer(sample);
      const wavData = audioBufferToWav(mockAudioData);
      
      samplesFolder.file(fileName, wavData);
    }
  }
  
  if (options.arrangementMixdown && arrangementsFolder && arrangement.length > 0) {
    // Create arrangement file
    const arrangementData = {
      bpm: 120,
      samples: arrangement.map(item => ({
        sampleId: item.id,
        position: item.position || 0,
        name: item.name
      }))
    };
    
    arrangementsFolder.file('arrangement.json', JSON.stringify(arrangementData, null, 2));
  }
  
  if (options.projectMetadata) {
    // Add project metadata
    const metadata = {
      projectName: 'STAK-XTRACT_Export',
      version: '2.0.1',
      created: new Date().toISOString(),
      samples: samples.length,
      format: options.format,
      extractionSettings: {
        sensitivity: 75,
        minDuration: 500,
        mode: 'auto'
      }
    };
    
    zip.file('project_metadata.json', JSON.stringify(metadata, null, 2));
  }
  
  // Add README
  const readme = `STAK-XTRACT Export Package
==========================

This package contains extracted audio samples from STAK-XTRACT v2.0.1

Contents:
- samples/: Individual extracted audio samples
- arrangements/: Arrangement data and mixdowns
- project_metadata.json: Project information and settings

Generated: ${new Date().toISOString()}
Format: ${options.format.toUpperCase()}
Total Samples: ${samples.length}

Visit https://yolosnipes.dev for more information.
`;
  
  zip.file('README.txt', readme);
  
  // Generate and download ZIP
  const blob = await zip.generateAsync({ type: 'blob' });
  const fileName = `STAK-XTRACT_Export_${new Date().toISOString().slice(0, 10)}.zip`;
  
  saveAs(blob, fileName);
}

function createMockAudioBuffer(sample: AudioSample): AudioBuffer {
  // Create a mock AudioContext for generating the buffer
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = 44100;
  const duration = parseFloat(sample.duration);
  const frameCount = sampleRate * duration;
  
  const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);
  
  // Generate mock audio data based on the sample's waveform
  for (let i = 0; i < frameCount; i++) {
    const waveformIndex = Math.floor((i / frameCount) * sample.waveform.length);
    const amplitude = sample.waveform[waveformIndex] || 0;
    
    // Generate a simple sine wave with the amplitude from waveform
    const frequency = 440; // A4 note
    channelData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * amplitude * 0.3;
  }
  
  return buffer;
}

export function downloadIndividualSample(sample: AudioSample, format: string = 'wav'): void {
  const mockBuffer = createMockAudioBuffer(sample);
  const wavData = audioBufferToWav(mockBuffer);
  const blob = new Blob([wavData], { type: 'audio/wav' });
  const fileName = `${sample.name}.${format}`;
  
  saveAs(blob, fileName);
}
