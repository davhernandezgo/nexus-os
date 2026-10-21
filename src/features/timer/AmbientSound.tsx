import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AmbientSoundProps {
  className?: string;
}

export default function AmbientSound({ className = '' }: AmbientSoundProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(50); // 0 - 100
  const [showControls, setShowControls] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize Web Audio graph
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtxClass();
    }

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (!scriptNodeRef.current) {
      const bufferSize = 4096;
      let lastOut = 0.0;

      // ScriptProcessorNode generates brown noise samples
      const scriptNode = ctx.createScriptProcessor(bufferSize, 1, 1);
      scriptNode.onaudioprocess = (e) => {
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Brownian random walk algorithm
          lastOut = (lastOut + 0.02 * white) / 1.02;
          // Boost gain to compensate integration roll-off
          output[i] = lastOut * 3.2;
        }
      };

      // Lowpass filter for smooth, warm brown rumble
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(360, ctx.currentTime);
      filter.Q.setValueAtTime(0.8, ctx.currentTime);

      // Volume Gain Node
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume / 100, ctx.currentTime);

      // Connect graph: ScriptNode -> Lowpass Filter -> Gain -> Destination
      scriptNode.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      scriptNodeRef.current = scriptNode;
      filterRef.current = filter;
      gainNodeRef.current = gain;
    }
  };

  const stopAudio = () => {
    if (scriptNodeRef.current) {
      try {
        scriptNodeRef.current.disconnect();
      } catch {
        // already disconnected
      }
      scriptNodeRef.current = null;
    }
    if (filterRef.current) {
      try {
        filterRef.current.disconnect();
      } catch {
        // already disconnected
      }
      filterRef.current = null;
    }
    if (gainNodeRef.current) {
      try {
        gainNodeRef.current.disconnect();
      } catch {
        // already disconnected
      }
      gainNodeRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
      audioCtxRef.current.suspend();
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      initAudio();
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (newVal: number) => {
    setVolume(newVal);
    if (gainNodeRef.current && audioCtxRef.current) {
      // Smooth gain transition
      gainNodeRef.current.gain.setTargetAtTime(newVal / 100, audioCtxRef.current.currentTime, 0.03);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* Sound Toggle Button */}
      <button
        type="button"
        onClick={togglePlayback}
        title={isPlaying ? 'Desactivar Ruido Marrón' : 'Activar Ruido Marrón para Enfoque'}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          isPlaying
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
            : 'bg-nexus-surface-2 text-nexus-text-secondary hover:text-nexus-text border border-nexus-border hover:border-nexus-border-hover'
        }`}
      >
        {isPlaying ? (
          <div className="flex items-center gap-1.5">
            {/* Waveform animation */}
            <div className="flex items-end gap-0.5 h-3.5 w-3.5">
              <span className="w-0.5 bg-amber-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-full" />
              <span className="w-0.5 bg-amber-400 rounded-full animate-[pulse_0.9s_ease-in-out_infinite_0.15s] h-2" />
              <span className="w-0.5 bg-amber-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.3s] h-3" />
            </div>
            <span className="hidden sm:inline">Ruido Marrón</span>
          </div>
        ) : (
          <>
            <Waves className="w-3.5 h-3.5 text-nexus-text-muted" />
            <span className="hidden sm:inline">Sonido de Enfoque</span>
          </>
        )}
      </button>

      {/* Volume / Controls trigger */}
      <button
        type="button"
        onClick={() => setShowControls(!showControls)}
        title="Ajustar volumen de sonido ambiente"
        className={`p-1.5 ml-1 rounded-md transition-colors ${
          showControls || isPlaying
            ? 'text-amber-400 hover:text-amber-300 bg-amber-500/10'
            : 'text-nexus-text-muted hover:text-nexus-text-secondary hover:bg-nexus-surface-2'
        }`}
      >
        {volume === 0 || !isPlaying ? (
          <VolumeX className="w-3.5 h-3.5" />
        ) : (
          <Volume2 className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Volume Slider Popover */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 right-0 w-52 p-3 bg-nexus-surface-2 border border-nexus-border rounded-xl shadow-2xl z-50 backdrop-blur-md"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-nexus-text">Ruido Marrón</span>
              </div>
              <span className="text-[11px] font-mono text-nexus-text-muted">{volume}%</span>
            </div>

            <p className="text-[11px] text-nexus-text-muted mb-2.5 leading-tight">
              Frecuencias graves relajantes generadas con Web Audio API 100% offline.
            </p>

            <div className="flex items-center gap-2">
              <VolumeX className="w-3.5 h-3.5 text-nexus-text-muted shrink-0" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-full h-1.5 bg-nexus-surface-3 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <Volume2 className="w-3.5 h-3.5 text-nexus-text-muted shrink-0" />
            </div>

            <div className="mt-2.5 pt-2 border-t border-nexus-border flex items-center justify-between">
              <span className="text-[10px] text-nexus-text-muted">
                {isPlaying ? '🟢 Reproduciendo' : '⚪ Silenciado'}
              </span>
              <button
                type="button"
                onClick={togglePlayback}
                className="text-[11px] font-medium text-amber-400 hover:text-amber-300 underline"
              >
                {isPlaying ? 'Pausar' : 'Activar'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
