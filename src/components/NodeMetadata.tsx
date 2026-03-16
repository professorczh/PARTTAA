import React, { useState, useEffect, useRef } from 'react';
import { useTapStore } from '../store';
import { useShallow } from 'zustand/react/shallow';
import { Clock, Square, Cpu } from 'lucide-react';
import { cn } from '../lib/utils';

interface NodeMetadataProps {
  metadata?: {
    duration?: number;
    resolution?: string;
    modelName?: string;
    startTime?: number;
  };
  isLoading?: boolean;
}

export const NodeMetadata: React.FC<NodeMetadataProps> = ({ metadata, isLoading }) => {
  const showMetadata = useTapStore(useShallow((state) => state.showMetadata));
  const [internalElapsed, setInternalElapsed] = useState(0);
  const internalStartTimeRef = useRef<number | null>(null);
  const lastIsLoading = useRef(false);

  useEffect(() => {
    let interval: number;
    
    if (isLoading) {
      // START: If we just transitioned to loading, or we don't have a start time yet
      if (!lastIsLoading.current || !internalStartTimeRef.current) {
        // Use provided startTime if available, otherwise fallback to "now" to ensure it runs
        internalStartTimeRef.current = metadata?.startTime || Date.now();
      }

      const update = () => {
        if (internalStartTimeRef.current) {
          const now = Date.now();
          setInternalElapsed(Math.max(0, (now - internalStartTimeRef.current) / 1000));
        }
      };
      
      update();
      interval = window.setInterval(update, 100);
    } 

    lastIsLoading.current = isLoading;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, metadata?.startTime]);

  if (!showMetadata) return null;
  
  // Determine what to show
  const modelName = metadata?.modelName;
  const resolution = metadata?.resolution;
  const duration = metadata?.duration;

  // If we have nothing to show, return null
  const hasContent = isLoading || modelName || resolution || duration !== undefined;
  if (!hasContent) return null;

  // STOPWATCH LOGIC: 
  // 1. While loading, show the internal ticking clock
  // 2. When stopped, prefer the official duration, but fallback to the last internal tick
  const displayValue = isLoading ? internalElapsed : (duration ?? internalElapsed);
  
  const isLongDuration = displayValue !== undefined && displayValue >= 100;
  
  // Fallback to 0.0 if everything is missing
  const formattedDuration = displayValue !== undefined 
    ? (isLongDuration ? Math.floor(displayValue).toString() : displayValue.toFixed(1))
    : '0.0';

  return (
    <div className="flex items-center justify-end gap-2.5 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 font-mono text-[9px] uppercase tracking-widest text-white/60 shadow-sm z-30">
      {/* Model Name */}
      {modelName && (
        <div className="flex items-center gap-1.5 shrink-0">
          <Cpu size={10} className="text-white/40" />
          <span className="truncate max-w-[100px]">{modelName}</span>
        </div>
      )}

      {/* Resolution */}
      {resolution && (
        <div className="flex items-center gap-2.5 shrink-0">
          {modelName && <div className="w-px h-2 bg-white/10" />}
          <div className="flex items-center gap-1.5">
            <Square size={10} className="text-white/40" />
            <span className="text-white/60 whitespace-nowrap">{resolution}</span>
          </div>
        </div>
      )}

      {/* Timer / Duration - Always show if we have a model name (meaning it's an active node) */}
      {(isLoading || duration !== undefined || modelName) && (
        <div className="flex items-center gap-2.5 shrink-0">
          {(modelName || resolution) && <div className="w-px h-2 bg-white/10" />}
          <div className={cn(
            "flex items-center gap-1.5 min-w-[42px] justify-end transition-colors duration-300",
            isLoading ? "text-red-500 animate-pulse" : "text-emerald-400"
          )}>
            <Clock size={10} className={cn(isLoading ? "text-red-500" : "text-emerald-400/60")} />
            <span className="tabular-nums font-bold">
              {formattedDuration}s
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
