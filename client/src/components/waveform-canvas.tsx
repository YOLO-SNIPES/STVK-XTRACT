import { useEffect, useRef } from "react";
import { useAudioContext } from "@/hooks/use-audio-context";

interface WaveformCanvasProps {
  /** An array of URLs for the audio stems to be rendered. */
  stemUrls: string[];
  /** An array of sample objects to be marked on the waveform. */
  samples: any[];
  /** An array of booleans indicating which stems are muted. */
  mutedStems: boolean[];
  /** The zoom level for the waveform display. */
  zoom: number;
}

const stemColors = ["#ff0080", "#00ff88", "#8b5cf6", "#06b6d4", "#ff6600", "#fde047"];

/**
 * A component that renders multiple audio waveforms on a canvas.
 * It fetches the audio data, decodes it, and draws the waveforms.
 */
export default function WaveformCanvas({ stemUrls, samples, mutedStems, zoom }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { audioContext } = useAudioContext();

  useEffect(() => {
    if (!canvasRef.current || !audioContext) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = 200;
    ctx.scale(2, 2);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2);

    if (stemUrls.length === 0) {
      drawPlaceholder(ctx, canvas);
      return;
    }

    let isActive = true;

    const drawAllWaveforms = async () => {
      try {
        const audioBuffers = await Promise.all(
          stemUrls.map(async (url) => {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            return audioContext.decodeAudioData(arrayBuffer);
          })
        );

        if (!isActive) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2);

        audioBuffers.forEach((buffer, index) => {
          const color = mutedStems[index] ? "#555" : stemColors[index % stemColors.length];
          drawWaveform(ctx, canvas, buffer, color);
        });

        if (samples.length > 0 && audioBuffers.length > 0) {
          drawSampleMarkers(ctx, canvas, samples, audioBuffers[0].duration);
        }
      } catch (error) {
        console.error("Error drawing waveforms:", error);
        drawPlaceholder(ctx, canvas);
      }
    };

    drawAllWaveforms();

    return () => {
      isActive = false;
    }

  }, [stemUrls, samples, audioContext]);

  const drawPlaceholder = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.strokeStyle = 'rgba(255, 0, 128, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < canvas.width / 2; i += 4) {
      const y = 50 + Math.sin(i * 0.02) * 20;
      if (i === 0) ctx.moveTo(i, y);
      else ctx.lineTo(i, y);
    }
    ctx.stroke();
  };

  /**
   * Draws a single waveform on the canvas.
   * @param ctx The canvas rendering context.
   * @param canvas The canvas element.
   * @param audioBuffer The decoded audio data.
   * @param color The color of the waveform.
   */
  const drawWaveform = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, audioBuffer: AudioBuffer, color: string) => {
    const width = canvas.width / 2;
    const height = canvas.height / 2;
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / (width * zoom));
    const amp = height / 2;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.moveTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
    }
    
    ctx.stroke();
  };

  const drawSampleMarkers = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, samples: any[], duration: number) => {
    const width = canvas.width / 2;
    const height = canvas.height / 2;

    samples.forEach((sample) => {
      const x = (sample.startTime / duration) * width;
      
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(x - 1, 0, 2, height);
      
      ctx.fillStyle = '#00ff88';
      ctx.font = '10px monospace';
      ctx.fillText(sample.name, x + 5, 15);
    });
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-32 rounded"
      style={{ animation: stemUrls.length > 0 ? 'waveflow 3s ease-in-out infinite' : 'none' }}
    />
  );
}
