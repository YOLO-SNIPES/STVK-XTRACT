import { useState, useRef, useCallback } from "react";

export function useAudioContext() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);

  const loadAudio = useCallback(async (file: File) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = await ctx.decodeAudioData(arrayBuffer);
      
      setAudioBuffer(buffer);
      setDuration(buffer.duration);
      setCurrentTime(0);
      
      return buffer;
    } catch (error) {
      console.error("Failed to load audio:", error);
      throw error;
    }
  }, []);

  const playAudio = useCallback(() => {
    if (!audioContext || !audioBuffer) return;

    // Stop current playback if any
    if (sourceRef.current) {
      sourceRef.current.stop();
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    const startOffset = pauseTimeRef.current;
    source.start(0, startOffset);
    
    startTimeRef.current = audioContext.currentTime - startOffset;
    sourceRef.current = source;
    setIsPlaying(true);

    // Update current time
    const updateTime = () => {
      if (isPlaying && audioContext) {
        const elapsed = audioContext.currentTime - startTimeRef.current;
        setCurrentTime(Math.min(elapsed, duration));
        
        if (elapsed < duration) {
          requestAnimationFrame(updateTime);
        } else {
          setIsPlaying(false);
          setCurrentTime(0);
          pauseTimeRef.current = 0;
        }
      }
    };
    requestAnimationFrame(updateTime);

    source.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      pauseTimeRef.current = 0;
    };
  }, [audioContext, audioBuffer, duration, isPlaying]);

  const pauseAudio = useCallback(() => {
    if (sourceRef.current && audioContext) {
      sourceRef.current.stop();
      pauseTimeRef.current = audioContext.currentTime - startTimeRef.current;
      setIsPlaying(false);
    }
  }, [audioContext]);

  const stopAudio = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    pauseTimeRef.current = 0;
  }, []);

  return {
    audioContext,
    audioBuffer,
    isPlaying,
    currentTime,
    duration,
    loadAudio,
    playAudio,
    pauseAudio,
    stopAudio
  };
}
