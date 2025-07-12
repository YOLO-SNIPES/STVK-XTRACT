export interface AudioSample {
  id: number;
  name: string;
  startTime: number;
  endTime: number;
  duration: string;
  waveform: number[];
}

export class AudioProcessor {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
  }

  async extractSamples(audioBuffer: AudioBuffer, sensitivity: number = 0.75): Promise<AudioSample[]> {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    
    // Simple onset detection based on energy
    const frameSize = 1024;
    const hopSize = 512;
    const onsets: number[] = [];
    
    for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
      const frame = channelData.slice(i, i + frameSize);
      const energy = this.calculateEnergy(frame);
      
      // Detect energy spikes
      if (energy > sensitivity) {
        const timePosition = i / sampleRate;
        
        // Avoid duplicate onsets too close together
        if (onsets.length === 0 || timePosition - onsets[onsets.length - 1] > 0.1) {
          onsets.push(timePosition);
        }
      }
    }

    // Create samples from onsets
    const samples: AudioSample[] = [];
    for (let i = 0; i < onsets.length; i++) {
      const startTime = onsets[i];
      const endTime = i < onsets.length - 1 ? onsets[i + 1] : duration;
      const sampleDuration = endTime - startTime;
      
      // Only include samples longer than 0.1 seconds
      if (sampleDuration > 0.1) {
        const waveform = this.generateWaveform(channelData, startTime, endTime, sampleRate);
        
        samples.push({
          id: i + 1,
          name: `SAMPLE_${String(i + 1).padStart(3, '0')}`,
          startTime,
          endTime,
          duration: `${sampleDuration.toFixed(1)}s`,
          waveform
        });
      }
    }

    return samples.slice(0, 16); // Limit to 16 samples for UI purposes
  }

  private calculateEnergy(frame: Float32Array): number {
    let energy = 0;
    for (let i = 0; i < frame.length; i++) {
      energy += Math.abs(frame[i]);
    }
    return energy / frame.length;
  }

  private generateWaveform(channelData: Float32Array, startTime: number, endTime: number, sampleRate: number): number[] {
    const startSample = Math.floor(startTime * sampleRate);
    const endSample = Math.floor(endTime * sampleRate);
    const sampleData = channelData.slice(startSample, endSample);
    
    // Downsample to 50 points for visualization
    const waveform: number[] = [];
    const step = Math.floor(sampleData.length / 50);
    
    for (let i = 0; i < 50; i++) {
      const start = i * step;
      const end = Math.min(start + step, sampleData.length);
      
      let max = 0;
      for (let j = start; j < end; j++) {
        max = Math.max(max, Math.abs(sampleData[j]));
      }
      waveform.push(max);
    }
    
    return waveform;
  }

  async createSampleBuffer(audioBuffer: AudioBuffer, startTime: number, endTime: number): Promise<AudioBuffer> {
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(startTime * sampleRate);
    const endSample = Math.floor(endTime * sampleRate);
    const length = endSample - startSample;
    
    const sampleBuffer = this.audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      length,
      sampleRate
    );
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const sampleData = channelData.slice(startSample, endSample);
      sampleBuffer.copyToChannel(sampleData, channel);
    }
    
    return sampleBuffer;
  }
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const length = buffer.length * buffer.numberOfChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, buffer.numberOfChannels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
  view.setUint16(32, buffer.numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length, true);
  
  // Convert float32 to int16
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return arrayBuffer;
}
