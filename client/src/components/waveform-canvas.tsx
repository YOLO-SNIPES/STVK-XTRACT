import { useEffect, useRef } from "react";

interface WaveformCanvasProps {
  audioFile: File | null;
  samples: any[];
}

export default function WaveformCanvas({ audioFile, samples }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2; // For high DPI
    canvas.height = 200;
    ctx.scale(2, 2);

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2);

    if (!audioFile) {
      // Draw placeholder waveform
      ctx.strokeStyle = 'rgba(255, 0, 128, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < canvas.width / 2; i += 4) {
        const y = 50 + Math.sin(i * 0.02) * 20;
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.stroke();

      // Draw grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < canvas.width / 2; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height / 2);
        ctx.stroke();
      }

      return;
    }

    // Draw waveform visualization
    drawWaveform(ctx, canvas);
    
    // Draw sample markers
    if (samples.length > 0) {
      drawSampleMarkers(ctx, canvas, samples);
    }
  }, [audioFile, samples]);

  const drawWaveform = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const width = canvas.width / 2;
    const height = canvas.height / 2;
    
    // Generate mock waveform data
    const waveformData = Array.from({ length: Math.floor(width / 2) }, (_, i) => {
      return Math.sin(i * 0.1) * Math.random() * 0.5 + Math.sin(i * 0.05) * 0.3;
    });

    // Draw waveform
    ctx.strokeStyle = '#ff0080';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    waveformData.forEach((value, i) => {
      const x = (i / waveformData.length) * width;
      const y = height / 2 + value * height / 3;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    
    ctx.stroke();

    // Add glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff0080';
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawSampleMarkers = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, samples: any[]) => {
    const width = canvas.width / 2;
    const height = canvas.height / 2;

    samples.forEach((sample, index) => {
      const x = (sample.startTime / 30) * width; // Assuming 30s total duration
      
      // Draw sample marker
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(x - 1, 0, 2, height);
      
      // Draw sample label
      ctx.fillStyle = '#00ff88';
      ctx.font = '10px monospace';
      ctx.fillText(sample.name, x + 5, 15);
    });
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-32 rounded"
      style={{ animation: audioFile ? 'waveflow 3s ease-in-out infinite' : 'none' }}
    />
  );
}
