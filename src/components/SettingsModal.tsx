import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Cpu, Zap, Info, ShieldCheck, Monitor, BrainCircuit, MousePointer2, Layout, Plus } from 'lucide-react';
import { useTapStore } from '../store';
import { cn } from '../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { 
    isDemoMode, 
    setDemoMode, 
    isRecognitionMode, 
    setRecognitionMode,
    isMultiSelectMasterEnabled,
    setMultiSelectMasterEnabled,
    isBoxSelectionEnabled,
    setBoxSelectionEnabled,
    isShiftClickSelectionEnabled,
    setShiftClickSelectionEnabled,
    isSelectionHelperVisible,
    setSelectionHelperVisible,
    showMetadata,
    setShowMetadata,
    autoFocusPrompt,
    setAutoFocusPrompt,
    promptPanelWidth,
    setPromptPanelWidth,
    autoExpandOnSelect,
    setAutoExpandOnSelect,
    autoExpandText,
    setAutoExpandText,
    autoExpandImage,
    setAutoExpandImage,
    autoExpandVideo,
    setAutoExpandVideo
  } = useTapStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl bg-[var(--app-panel)] border border-[var(--app-border)] rounded-2xl shadow-2xl overflow-hidden hud-border max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--app-border)] bg-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Cpu size={18} className="text-white/60" />
                </div>
                <h2 className="font-display text-lg font-bold tracking-tight uppercase">Settings</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-8 items-start">
                {/* Left Column */}
                <div className="space-y-8">
                  {/* Display & UI Section */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--app-text-muted)]">
                      <Layout size={12} />
                      <span>Display & UI</span>
                    </div>

                    <div className="space-y-3">
                      <div 
                        onClick={() => setShowMetadata(!showMetadata)}
                        className={cn(
                          "group p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                          showMetadata 
                            ? "bg-blue-500/10 border-blue-500/30" 
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                            showMetadata ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-white/40"
                          )}>
                            <Info size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-bold">Node Metadata</div>
                            <div className="text-[10px] text-[var(--app-text-muted)]">Show generation info.</div>
                          </div>
                        </div>
                        <div className={cn(
                          "w-10 h-5 rounded-full relative transition-all duration-300 border shrink-0",
                          showMetadata ? "bg-blue-500/20 border-blue-500/50" : "bg-white/5 border-white/10"
                        )}>
                          <motion.div 
                            animate={{ x: showMetadata ? 20 : 2 }}
                            className={cn(
                              "absolute top-1 w-3 h-3 rounded-full shadow-sm",
                              showMetadata ? "bg-blue-400" : "bg-white/20"
                            )}
                          />
                        </div>
                      </div>

                      <div 
                        onClick={() => setAutoFocusPrompt(!autoFocusPrompt)}
                        className={cn(
                          "group p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                          autoFocusPrompt 
                            ? "bg-purple-500/10 border-purple-500/30" 
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                            autoFocusPrompt ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-white/40"
                          )}>
                            <Zap size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-bold">Auto-focus Prompt</div>
                            <div className="text-[10px] text-[var(--app-text-muted)]">Focus input on select.</div>
                          </div>
                        </div>
                        <div className={cn(
                          "w-10 h-5 rounded-full relative transition-all duration-300 border shrink-0",
                          autoFocusPrompt ? "bg-purple-500/20 border-purple-500/50" : "bg-white/5 border-white/10"
                        )}>
                          <motion.div 
                            animate={{ x: autoFocusPrompt ? 20 : 2 }}
                            className={cn(
                              "absolute top-1 w-3 h-3 rounded-full shadow-sm",
                              autoFocusPrompt ? "bg-purple-400" : "bg-white/20"
                            )}
                          />
                        </div>
                      </div>

                      {/* Prompt Panel Width */}
                      <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                              <Layout size={20} />
                            </div>
                            <div>
                              <div className="text-sm font-bold">Prompt Panel Width</div>
                              <div className="text-[10px] text-[var(--app-text-muted)]">Adjust the width of the input area.</div>
                            </div>
                          </div>
                          <div className="text-[10px] font-mono text-white/40 uppercase bg-black/20 px-2 py-1 rounded border border-white/5">
                            {promptPanelWidth}px
                          </div>
                        </div>
                        <div className="flex p-1 bg-black/20 rounded-xl border border-white/5">
                          {[
                            { label: 'Short', value: 360 },
                            { label: 'Default', value: 480 },
                            { label: 'Long', value: 640 }
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setPromptPanelWidth(opt.value)}
                              className={cn(
                                "flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                                promptPanelWidth === opt.value 
                                  ? "bg-white/10 text-white shadow-sm" 
                                  : "text-white/30 hover:text-white/50"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* AI Capabilities Section */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--app-text-muted)]">
                      <BrainCircuit size={12} />
                      <span>AI Capabilities</span>
                    </div>
                    
                    <div 
                      onClick={() => setRecognitionMode(!isRecognitionMode)}
                      className={cn(
                        "group p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                        isRecognitionMode 
                          ? "bg-emerald-500/10 border-emerald-500/30" 
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                          isRecognitionMode ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/40"
                        )}>
                          <Zap size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-bold">Recognition Mode</div>
                          <div className="text-[10px] text-[var(--app-text-muted)]">SAM object detection.</div>
                        </div>
                      </div>
                      <div className={cn(
                        "w-10 h-5 rounded-full relative transition-all duration-300 border shrink-0",
                        isRecognitionMode ? "bg-emerald-500/20 border-emerald-500/50" : "bg-white/5 border-white/10"
                      )}>
                        <motion.div 
                          animate={{ x: isRecognitionMode ? 20 : 2 }}
                          className={cn(
                            "absolute top-1 w-3 h-3 rounded-full shadow-sm",
                            isRecognitionMode ? "bg-emerald-400" : "bg-white/20"
                          )}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Runtime Environment Section */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--app-text-muted)]">
                      <Monitor size={12} />
                      <span>Runtime Environment</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setDemoMode(true)}
                        className={cn(
                          "p-3 rounded-xl border transition-all text-left space-y-2",
                          isDemoMode 
                            ? "bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/30" 
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          isDemoMode ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-white/40"
                        )}>
                          <Info size={16} />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold">Demo Mode</div>
                          <div className="text-[8px] text-[var(--app-text-muted)] leading-tight">Simulated.</div>
                        </div>
                      </button>

                      <button
                        onClick={() => setDemoMode(false)}
                        className={cn(
                          "p-3 rounded-xl border transition-all text-left space-y-2",
                          !isDemoMode 
                            ? "bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/30" 
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          !isDemoMode ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/40"
                        )}>
                          <ShieldCheck size={16} />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold">Real Mode</div>
                          <div className="text-[8px] text-[var(--app-text-muted)] leading-tight">Gemini 3 Pro.</div>
                        </div>
                      </button>
                    </div>
                  </section>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                  {/* Selection Controls Section */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--app-text-muted)]">
                      <MousePointer2 size={12} />
                      <span>Selection Controls</span>
                    </div>

                    <div className="space-y-3">
                      {/* Master Switch */}
                      <div 
                        onClick={() => setMultiSelectMasterEnabled(!isMultiSelectMasterEnabled)}
                        className={cn(
                          "group p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                          isMultiSelectMasterEnabled 
                            ? "bg-red-500/10 border-red-500/30" 
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                            isMultiSelectMasterEnabled ? "bg-red-500/20 text-red-400" : "bg-white/5 text-white/40"
                          )}>
                            <ShieldCheck size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-bold">Multi-Select Master</div>
                            <div className="text-[10px] text-[var(--app-text-muted)]">Global selection toggle.</div>
                          </div>
                        </div>
                        <div className={cn(
                          "w-10 h-5 rounded-full relative transition-all duration-300 border shrink-0",
                          isMultiSelectMasterEnabled ? "bg-red-500/20 border-red-500/50" : "bg-white/5 border-white/10"
                        )}>
                          <motion.div 
                            animate={{ x: isMultiSelectMasterEnabled ? 20 : 2 }}
                            className={cn(
                              "absolute top-1 w-3 h-3 rounded-full shadow-sm",
                              isMultiSelectMasterEnabled ? "bg-red-400" : "bg-white/20"
                            )}
                          />
                        </div>
                      </div>

                      {/* Sub-switches */}
                      <div className={cn("space-y-2 pl-4 border-l-2 border-white/5 transition-opacity", !isMultiSelectMasterEnabled && "opacity-40 pointer-events-none")}>
                        {/* Box Selection */}
                        <div 
                          onClick={() => setBoxSelectionEnabled(!isBoxSelectionEnabled)}
                          className={cn(
                            "p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between",
                            isBoxSelectionEnabled ? "bg-white/10 border-white/20" : "bg-white/5 border-white/5"
                          )}
                        >
                          <div className="text-xs font-medium">Box Selection</div>
                          <div className={cn(
                            "w-8 h-4 rounded-full relative transition-all border shrink-0",
                            isBoxSelectionEnabled ? "bg-white/20 border-white/30" : "bg-white/5 border-white/10"
                          )}>
                            <motion.div 
                              animate={{ x: isBoxSelectionEnabled ? 16 : 2 }}
                              className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white/60"
                            />
                          </div>
                        </div>

                        {/* Shift-Click */}
                        <div 
                          onClick={() => setShiftClickSelectionEnabled(!isShiftClickSelectionEnabled)}
                          className={cn(
                            "p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between",
                            isShiftClickSelectionEnabled ? "bg-white/10 border-white/20" : "bg-white/5 border-white/5"
                          )}
                        >
                          <div className="text-xs font-medium">Shift-Click Select</div>
                          <div className={cn(
                            "w-8 h-4 rounded-full relative transition-all border shrink-0",
                            isShiftClickSelectionEnabled ? "bg-white/20 border-white/30" : "bg-white/5 border-white/10"
                          )}>
                            <motion.div 
                              animate={{ x: isShiftClickSelectionEnabled ? 16 : 2 }}
                              className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white/60"
                            />
                          </div>
                        </div>

                        {/* Helper Box */}
                        <div 
                          onClick={() => setSelectionHelperVisible(!isSelectionHelperVisible)}
                          className={cn(
                            "p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between",
                            isSelectionHelperVisible ? "bg-white/10 border-white/20" : "bg-white/5 border-white/5"
                          )}
                        >
                          <div className="text-xs font-medium">Selection Helper</div>
                          <div className={cn(
                            "w-8 h-4 rounded-full relative transition-all border shrink-0",
                            isSelectionHelperVisible ? "bg-white/20 border-white/30" : "bg-white/5 border-white/10"
                          )}>
                            <motion.div 
                              animate={{ x: isSelectionHelperVisible ? 16 : 2 }}
                              className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white/60"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Future Features Placeholder */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--app-text-muted)]">
                      <Layout size={12} />
                      <span>Interaction Behavior</span>
                    </div>

                    <div className="space-y-3">
                      {/* Master Switch */}
                      <div 
                        onClick={() => setAutoExpandOnSelect(!autoExpandOnSelect)}
                        className={cn(
                          "group p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                          autoExpandOnSelect 
                            ? "bg-blue-500/10 border-blue-500/30" 
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                            autoExpandOnSelect ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-white/40"
                          )}>
                            <Zap size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-bold">Auto-expand on Select</div>
                            <div className="text-[10px] text-[var(--app-text-muted)]">Open panel when node is clicked.</div>
                          </div>
                        </div>
                        <div className={cn(
                          "w-10 h-5 rounded-full relative transition-all duration-300 border shrink-0",
                          autoExpandOnSelect ? "bg-blue-500/20 border-blue-500/50" : "bg-white/5 border-white/10"
                        )}>
                          <motion.div 
                            animate={{ x: autoExpandOnSelect ? 20 : 2 }}
                            className={cn(
                              "absolute top-1 w-3 h-3 rounded-full shadow-sm",
                              autoExpandOnSelect ? "bg-blue-400" : "bg-white/20"
                            )}
                          />
                        </div>
                      </div>

                      {/* Sub-switches */}
                      <div className={cn("space-y-2 pl-4 border-l-2 border-white/5 transition-opacity", !autoExpandOnSelect && "opacity-40 pointer-events-none")}>
                        {/* Text Nodes */}
                        <div 
                          onClick={() => setAutoExpandText(!autoExpandText)}
                          className={cn(
                            "p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between",
                            autoExpandText ? "bg-white/10 border-white/20" : "bg-white/5 border-white/5"
                          )}
                        >
                          <div className="text-xs font-medium">Text Nodes</div>
                          <div className={cn(
                            "w-8 h-4 rounded-full relative transition-all border shrink-0",
                            autoExpandText ? "bg-white/20 border-white/30" : "bg-white/5 border-white/10"
                          )}>
                            <motion.div 
                              animate={{ x: autoExpandText ? 16 : 2 }}
                              className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white/60"
                            />
                          </div>
                        </div>

                        {/* Image Nodes */}
                        <div 
                          onClick={() => setAutoExpandImage(!autoExpandImage)}
                          className={cn(
                            "p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between",
                            autoExpandImage ? "bg-white/10 border-white/20" : "bg-white/5 border-white/5"
                          )}
                        >
                          <div className="text-xs font-medium">Image Nodes</div>
                          <div className={cn(
                            "w-8 h-4 rounded-full relative transition-all border shrink-0",
                            autoExpandImage ? "bg-white/20 border-white/30" : "bg-white/5 border-white/10"
                          )}>
                            <motion.div 
                              animate={{ x: autoExpandImage ? 16 : 2 }}
                              className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white/60"
                            />
                          </div>
                        </div>

                        {/* Video Nodes */}
                        <div 
                          onClick={() => setAutoExpandVideo(!autoExpandVideo)}
                          className={cn(
                            "p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between",
                            autoExpandVideo ? "bg-white/10 border-white/20" : "bg-white/5 border-white/5"
                          )}
                        >
                          <div className="text-xs font-medium">Video Nodes</div>
                          <div className={cn(
                            "w-8 h-4 rounded-full relative transition-all border shrink-0",
                            autoExpandVideo ? "bg-white/20 border-white/30" : "bg-white/5 border-white/10"
                          )}>
                            <motion.div 
                              animate={{ x: autoExpandVideo ? 16 : 2 }}
                              className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white/60"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Future Features Placeholder */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--app-text-muted)]">
                      <Plus size={12} />
                      <span>Future Extensions</span>
                    </div>
                    <div className="border-2 border-dashed border-white/5 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-2 opacity-40">
                      <Plus size={24} className="text-white/20" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">More features coming soon</span>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white/5 border-t border-[var(--app-border)] flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-white/90 transition-all"
              >
                Apply Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
