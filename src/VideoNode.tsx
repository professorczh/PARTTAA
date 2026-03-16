import React, { useRef, useEffect, memo, useState, useMemo } from 'react';
import { NodeProps, useConnection, NodeResizer, useReactFlow } from '@xyflow/react';
import { useTapStore, TapNode } from './store';
import { useShallow } from 'zustand/react/shallow';
import { Video, Play, Loader2, Check, Download, Volume2, VolumeX, Square, Clock, Maximize2 } from 'lucide-react';
import { NodePromptInput } from './NodePromptInput';
import { NodeMetadata } from './components/NodeMetadata';
import { EditableTitle } from './components/EditableTitle';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MagneticPort, MagneticInput } from './components/MagneticPorts';
import { useVeoVideo, VideoGenerationStatus } from './hooks/useVeoVideo';
import { resolvePrompt } from './utils/promptResolver';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const VideoNode = memo((props: NodeProps<TapNode>) => {
  const { id, data, selected } = props;
  const connection = useConnection();
  const isTargetOfConnection = connection.inProgress && connection.toNode?.id === id;
  
  const { updateNodeData, nodes, edges, providers, globalDefaults, isDemoMode, showMetadata } = useTapStore(useShallow((state) => ({
    updateNodeData: state.updateNodeData,
    nodes: state.nodes,
    edges: state.edges,
    providers: state.providers,
    globalDefaults: state.globalDefaults,
    isDemoMode: state.isDemoMode,
    showMetadata: state.showMetadata
  })));

  const { setNodes } = useReactFlow();

  const calculateNodeHeight = (ratio: number, currentWidth: number, forceLoading = false) => {
    const headerHeight = 40;
    const verticalPadding = 24; // p-3 top and bottom
    const borderWeight = 2; // 1px border top and bottom
    const containerBorder = 2; // 1px border top and bottom
    const elementGap = 12; // gap-3
    const bottomBreathingRoom = 16; // Extra space at the bottom to prevent drawer collision
    
    const innerWidth = currentWidth - 24 - 2 - 2;
    const contentHeight = Math.ceil(innerWidth * ratio);
    
    const hasMetadata = showMetadata && (forceLoading || isGenerating || data.metadata?.modelName || data.metadata?.resolution || data.metadata?.duration);
    const metadataHeight = hasMetadata ? 28 : 0;
    
    let visibleElements = 1; // VideoContainer
    if (hasMetadata) visibleElements++;
    const totalGapHeight = (visibleElements - 1) * elementGap;
    
    return contentHeight + headerHeight + verticalPadding + borderWeight + containerBorder + metadataHeight + totalGapHeight + bottomBreathingRoom;
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPromptActive, setIsPromptActive] = useState(false);

  const { status, error, progress, videoUrl, generateVideo, reset } = useVeoVideo();

  // 3. Scanline Reveal State & Orchestration
  const [isRevealing, setIsRevealing] = useState(false);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [pendingOutput, setPendingOutput] = useState<string | null>(null);
  const [targetVideoHeight, setTargetVideoHeight] = useState<number | null>(null);
  const lastVideoRef = useRef<string | null>(null);
  const revealProgress = useMotionValue(0);
  const revealPercent = useTransform(revealProgress, [0, 1], ["0%", "100%"]);
  
  const maskImageValue = useTransform(revealProgress, (p) => {
    if (!isRevealing) return 'none';
    const pos = p * 100;
    if (p === 0) return 'linear-gradient(to bottom, transparent, transparent)';
    return `linear-gradient(to bottom, black 0%, black calc(${pos}% - 40px), transparent ${pos}%)`;
  });

  // Orchestrator Effect
  useEffect(() => {
    if (pendingOutput && isLayoutReady && status === VideoGenerationStatus.COMPLETED) {
      const randomDelay = 500 + Math.random() * 500;
      const timer = setTimeout(() => {
        setIsRevealing(true);
        lastVideoRef.current = pendingOutput;
        setPendingOutput(null);
        
        revealProgress.set(0);
        animate(revealProgress, 1, {
          duration: 1.5,
          ease: "linear",
          onComplete: () => setIsRevealing(false)
        });
      }, randomDelay);
      return () => clearTimeout(timer);
    }
  }, [pendingOutput, isLayoutReady, status, revealProgress]);

  useEffect(() => {
    if (videoUrl && videoUrl !== lastVideoRef.current && status === VideoGenerationStatus.COMPLETED) {
      setPendingOutput(videoUrl);
    }
  }, [videoUrl, status]);

  // Sync hook state to node data
  useEffect(() => {
    if (status === VideoGenerationStatus.COMPLETED && videoUrl) {
      updateNodeData(id, { 
        outputs: { ...data.outputs, video: videoUrl },
        isLoading: false,
        isGenerated: true,
        metadata: {
          ...data.metadata,
          duration: data.config?.videoDuration || '8',
          resolution: data.config?.videoResolution || '1080p',
          startTime: undefined
        }
      });
    } else if (status === VideoGenerationStatus.GENERATING || status === VideoGenerationStatus.POLLING) {
      updateNodeData(id, { isLoading: true });
    } else if (status === VideoGenerationStatus.ERROR && error) {
      updateNodeData(id, { isLoading: false });
      alert(`Video Generation Error: ${error}`);
    }
  }, [status, videoUrl, error, id, updateNodeData]);

  const handleRun = async () => {
    const activeOutputMode = 'video';
    const modelKey = data.config?.model || (globalDefaults?.[activeOutputMode] as string) || '';
    
    let currentModel = null;
    if (modelKey) {
      const [pId, mId] = modelKey.split(':');
      const p = providers.find(p => p.id === pId);
      const m = p?.models.find(m => m.id === mId);
      if (p && m && p.enabled && m.enabled) currentModel = { provider: p, model: m };
    }

    // Fallback for demo mode if no model is selected or provider is disabled
    if (!currentModel && isDemoMode) {
      currentModel = {
        provider: { id: 'demo', name: 'Demo Provider', type: 'mock', enabled: true, models: [], defaultProtocol: 'json', apiKey: '' } as any,
        model: { id: 'demo-video-model', name: 'Demo Video Model', enabled: true, capabilities: { video: true } }
      };
    }

    if (!currentModel) {
      alert("No model selected.");
      return;
    }

    const { prompt: resolvedPrompt, images } = resolvePrompt(data.prompt || '', nodes, edges, id);
    
    // Convert resolved images to the format expected by Veo
    const referenceImages = images.map(img => img.data);

    updateNodeData(id, { 
      isLoading: true,
      metadata: {
        modelName: currentModel.model.name,
        startTime: Date.now()
      }
    });

    // PREDICTIVE LAYOUT: Calculate target height immediately
    setIsLayoutReady(false);
    const videoAspectRatio = data.config?.videoAspectRatio || '16:9';
    const [w, h] = videoAspectRatio.split(':').map(Number);
    const ratio = h / w;
    const nodeElement = document.querySelector(`[data-id="${id}"]`) as HTMLElement;
    if (nodeElement) {
      const currentWidth = nodeElement.offsetWidth || 320;
      
      // 1. Lock video container height
      const innerWidth = currentWidth - 24 - 2 - 2;
      const vidHeight = Math.ceil(innerWidth * ratio);
      setTargetVideoHeight(vidHeight);

      // 2. Set total node height
      const targetHeight = calculateNodeHeight(ratio, currentWidth, true);
      
      setNodes(nds => nds.map(n => n.id === id ? {
        ...n,
        style: { ...n.style, height: targetHeight }
      } : n));

      setTimeout(() => setIsLayoutReady(true), 600);
    }

    generateVideo({
      prompt: resolvedPrompt,
      referenceImages: referenceImages.slice(0, 3), // Max 3
      modelId: currentModel.model.id,
      provider: currentModel.provider,
      aspectRatio: data.config?.videoAspectRatio || '16:9',
      resolution: data.config?.videoResolution || '1080p',
      duration: data.config?.videoDuration || '8'
    });
  };

  const hasContent = !!data.outputs?.video;
  const isGenerating = status === VideoGenerationStatus.GENERATING || status === VideoGenerationStatus.POLLING;

  // Computed Metadata
  const computedMetadata = useMemo(() => {
    const baseMetadata = { ...(data.metadata || {}) };
    if (!baseMetadata.modelName) {
      const modelKey = data.config?.model || (globalDefaults?.['video'] as string) || '';
      if (modelKey) {
        const [pId, mId] = modelKey.split(':');
        const p = providers.find(prov => prov.id === pId);
        const m = p?.models.find(mod => mod.id === mId);
        if (m) baseMetadata.modelName = m.name;
      }
    }
    return baseMetadata;
  }, [data.metadata, data.config, providers, globalDefaults]);

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-full group transition-all duration-500 ease-in-out"
    >
      <div className={cn(
        "w-full h-full flex flex-col glass-panel rounded-2xl relative z-10 transition-all duration-500 ease-in-out",
        selected && "node-selected ring-2 ring-[var(--brand-red)] shadow-2xl shadow-red-900/20",
        isGenerating && "animate-pulse ring-1 ring-purple-500/50"
      )}>
        <NodeResizer 
          color="transparent" 
          isVisible={selected} 
          minWidth={300} 
          minHeight={300}
          keepAspectRatio={true}
        />

        {/* Header */}
        <div className="bg-[var(--app-panel)] px-4 py-2 flex items-center justify-between border-b border-[var(--app-border)] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <Video size={14} />
            </div>
            <div className="flex flex-col">
              <EditableTitle 
                value={data.label || 'Video'} 
                onSave={(val) => updateNodeData(id, { label: val })} 
              />
              <span className="text-[8px] font-mono text-[var(--app-text-muted)]">{data.shortId}</span>
            </div>
          </div>
        </div>

        {/* Content: Video Display */}
        <div className="p-3 flex-1 min-h-0 flex flex-col gap-3 pb-6">
          {hasContent ? (
            <div 
              className="relative w-full overflow-hidden rounded-xl border border-[var(--app-border)] bg-black transition-all duration-500 ease-in-out"
              style={{ 
                height: targetVideoHeight || 'auto',
                aspectRatio: !targetVideoHeight ? (data.config?.videoAspectRatio || '16:9').replace(':', '/') : undefined,
                minHeight: !targetVideoHeight ? 180 : undefined
              }}
            >
              <motion.div 
                className="w-full h-full relative"
                style={{ maskImage: maskImageValue, WebkitMaskImage: maskImageValue }}
              >
                <video 
                  ref={videoRef}
                  src={videoUrl || data.outputs.video}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted={isMuted}
                  onLoadedMetadata={(e) => {
                    const video = e.currentTarget;
                    video.volume = 0.2; // Default low volume
                  }}
                />
                
                {/* Scanline Effect */}
                {isRevealing && (
                  <motion.div 
                    className="absolute left-0 right-0 h-1 bg-white/40 shadow-[0_0_15px_rgba(255,255,255,0.8)] z-[60] pointer-events-none"
                    style={{ top: revealPercent }}
                  />
                )}
              </motion.div>
                
                {/* Video Controls Overlay */}
                <div className="absolute bottom-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 rounded-lg bg-black/60 border border-white/10 text-white hover:bg-black/80 transition-all"
                  >
                    {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  </button>
                  <button 
                    onClick={() => videoRef.current?.requestFullscreen()}
                    className="p-1.5 rounded-lg bg-black/60 border border-white/10 text-white hover:bg-black/80 transition-all"
                  >
                    <Maximize2 size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className="w-full flex items-center justify-center bg-white/[0.03] border-dashed border-white/10 hover:border-white/20 hover:bg-white/[0.05] rounded-xl transition-all duration-500 ease-in-out"
                style={{ 
                  height: targetVideoHeight || 'auto',
                  aspectRatio: !targetVideoHeight ? (data.config?.videoAspectRatio || '16:9').replace(':', '/') : undefined,
                  minHeight: !targetVideoHeight ? 180 : undefined
                }}
              >
                <Video size={48} className="text-white/[0.03] group-hover:text-white/[0.06] transition-colors" />
                {isGenerating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 animate-pulse">
                        <Loader2 size={14} className="animate-spin" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Generating Video...</span>
                      </div>
                      {progress > 0 && (
                        <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-purple-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Status Overlay (Top Left) */}
            {isGenerating && (
              <div className="absolute top-2 left-2 z-20">
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/60 border border-white/10 backdrop-blur-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                  <span className="text-[9px] font-bold text-white/90 uppercase tracking-wider">
                    {status === VideoGenerationStatus.GENERATING ? 'Initializing' : 'Polling'}
                  </span>
                </div>
              </div>
            )}
          </div>

        {/* Metadata Bar - Immediate display, following bottom edge */}
        <AnimatePresence>
          {(isGenerating || hasContent) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3"
            >
              <div className="flex justify-end px-1 pb-1">
                <NodeMetadata metadata={computedMetadata} isLoading={isGenerating} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    {/* Ports */}
      <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-16 flex flex-col z-[200] pointer-events-auto">
        <MagneticPort 
          id="output-video" 
          type="video" 
          isSource={true} 
          hasContent={hasContent}
        />
      </div>
      
      <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-16 flex flex-col z-[200] pointer-events-auto">
        <MagneticInput isTargetOfConnection={isTargetOfConnection} />
      </div>

      {/* Prompt Input Drawer */}
      <NodePromptInput 
        node={props as any} 
        selected={selected}
        onRun={handleRun}
        onExpandChange={setIsPromptActive}
      />
    </motion.div>
  );
});

VideoNode.displayName = 'VideoNode';
