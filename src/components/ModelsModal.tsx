import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Plus, 
  Trash2, 
  Check, 
  Eye, 
  EyeOff, 
  Globe, 
  Cpu, 
  Zap, 
  ShieldCheck,
  AlertCircle,
  Save,
  Loader2,
  ChevronDown,
  RotateCcw,
  GripVertical,
  Power,
  Image as ImageIcon,
  Settings2,
  LayoutGrid,
  ArrowRightLeft,
  PlusCircle
} from 'lucide-react';
import { useTapStore, ProviderConfig, ModelConfig, ProviderType, ImageConfig } from '../store';
import { aiService } from '../services/aiService';
import { clsx } from 'clsx';
import { ConfirmDialog, Toast } from './UI';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SUPPORTED_RATIOS, SUPPORTED_QUALITIES } from '../constants';

interface ModelsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SortableModelItemProps {
  model: ModelConfig;
  globalIdx: number;
  type: 'text' | 'image' | 'video';
  selectedProvider: ProviderConfig;
  handleUpdateProvider: (id: string, updates: Partial<ProviderConfig>) => void;
  key?: any;
}

const SortableModelItem = ({ 
  model, 
  globalIdx, 
  type, 
  selectedProvider, 
  handleUpdateProvider 
}: SortableModelItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `${selectedProvider.id}-${type}-${model.id}-${globalIdx}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={clsx(
        "bg-white/5 border rounded-xl group relative transition-all flex overflow-hidden",
        model.enabled ? "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]" : "border-white/10 opacity-60 grayscale-[0.2]"
      )}
    >
      {/* Power Strip on the left (Status Ribbon) */}
      <div 
        className={clsx(
          "w-8 flex items-center justify-center border-r transition-all duration-300",
          model.enabled ? "bg-emerald-500/20 border-emerald-500/30" : "bg-black/40 border-white/5"
        )}
      >
        <button
          onClick={() => {
            const newModels = [...selectedProvider.models];
            newModels[globalIdx] = { ...model, enabled: !model.enabled };
            handleUpdateProvider(selectedProvider.id, { models: newModels });
          }}
          className={clsx(
            "w-full h-full flex items-center justify-center transition-all duration-300",
            model.enabled ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "text-white/10 hover:text-white/30"
          )}
          title={model.enabled ? "Disable Model" : "Enable Model"}
        >
          <Power size={14} className={clsx(model.enabled && "animate-pulse-subtle")} />
        </button>
      </div>

      <div className="flex-1 p-2 space-y-2">
        <div className="flex items-center gap-1.5">
          <CustomSelect
            disabled={selectedProvider.defaultProtocol !== 'mix'}
            value={selectedProvider.defaultProtocol === 'mix' ? (model.protocol || 'openai-compatible') : selectedProvider.defaultProtocol}
            onChange={(val) => {
              const newModels = [...selectedProvider.models];
              newModels[globalIdx] = { ...model, protocol: val as any };
              handleUpdateProvider(selectedProvider.id, { models: newModels });
            }}
            options={[
              { value: 'openai-compatible', label: 'O' },
              { value: 'gemini', label: 'G' }
            ]}
            buttonClassName={clsx(
              "bg-black/40 border border-white/10 rounded-md px-1 py-0.5 text-[9px] font-bold h-6 min-w-[32px]",
              selectedProvider.defaultProtocol === 'mix' ? "text-[var(--brand-red)]" : "text-zinc-600"
            )}
          />
          <input 
            type="text"
            value={model.id}
            onChange={(e) => {
              const newModels = [...selectedProvider.models];
              newModels[globalIdx] = { ...model, id: e.target.value };
              handleUpdateProvider(selectedProvider.id, { models: newModels });
            }}
            className="bg-transparent border-none p-0 text-[10px] font-mono text-white focus:outline-none focus:ring-0 flex-1 min-w-0"
            placeholder="Model ID"
          />
          <button 
            onClick={() => {
              const newModels = selectedProvider.models.filter((_, i) => i !== globalIdx);
              handleUpdateProvider(selectedProvider.id, { models: newModels });
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-500 transition-all"
          >
            <X size={10} />
          </button>
        </div>
        <input 
          type="text"
          value={model.name}
          onChange={(e) => {
            const newModels = [...selectedProvider.models];
            newModels[globalIdx] = { ...model, name: e.target.value };
            handleUpdateProvider(selectedProvider.id, { models: newModels });
          }}
          className="w-full bg-transparent border-none p-0 text-[9px] text-[var(--app-text-muted)] italic focus:outline-none focus:ring-0 px-1"
          placeholder="Display Name (Optional)"
        />
      </div>

      {/* Drag Handle on the right */}
      <button 
        {...attributes} 
        {...listeners}
        className="w-8 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/5 border-l border-white/5 transition-all text-white/10 hover:text-white/30 group-hover:text-white/20"
      >
        <GripVertical size={14} />
      </button>
    </div>
  );
};

const SortableRatioItem = ({ 
  id, 
  ratio, 
  isDefault, 
  onSetDefault, 
  onRemove 
}: { 
  id: string; 
  ratio: string; 
  isDefault: boolean; 
  onSetDefault: () => void; 
  onRemove: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  // Helper to get aspect ratio box style
  const getRatioStyle = (r: string) => {
    const [w, h] = r.split(':').map(Number);
    if (w > h) return { width: '16px', height: `${(h / w) * 16}px` };
    if (h > w) return { width: `${(w / h) * 16}px`, height: '16px' };
    return { width: '14px', height: '14px' };
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "relative group flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all cursor-grab active:cursor-grabbing",
        isDragging ? "opacity-50 scale-95 border-[var(--brand-red)] bg-[var(--brand-red)]/10" : 
        isDefault ? "border-[var(--brand-red)] bg-[var(--brand-red)]/5 shadow-[0_0_10px_rgba(239,68,68,0.1)]" : "border-white/10 bg-white/5 hover:border-white/20"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-center w-6 h-6">
        <div 
          className={clsx("border rounded-sm", isDefault ? "border-[var(--brand-red)]" : "border-white/40")} 
          style={getRatioStyle(ratio)} 
        />
      </div>
      <span className={clsx("text-[9px] font-bold", isDefault ? "text-[var(--brand-red)]" : "text-white/60")}>
        {ratio}
      </span>

      {/* Actions */}
      <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onSetDefault(); }}
          className={clsx(
            "w-4 h-4 rounded-full flex items-center justify-center transition-all",
            isDefault ? "bg-[var(--brand-red)] text-white" : "bg-zinc-800 text-zinc-500 hover:text-white"
          )}
          title="Set as Default"
        >
          <Check size={8} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-500 hover:text-red-500 flex items-center justify-center transition-all"
          title="Remove"
        >
          <X size={8} />
        </button>
      </div>
    </div>
  );
};

const DEFAULT_IMAGE_CONFIG = {
  defaultRatio: '1:1',
  defaultQuality: '1K',
  ratioLayout: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9', '5:4', '4:5']
};

interface CustomSelectOption {
  value: string;
  label: string;
  group?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: (string | CustomSelectOption)[];
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
}

const CustomSelect = ({ value, onChange, options, className, buttonClassName, disabled }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const flatOptions = useMemo(() => {
    return options.map(opt => typeof opt === 'string' ? { value: opt, label: opt } : opt);
  }, [options]);

  const selectedOption = flatOptions.find(opt => opt.value === value);

  // Group options
  const groupedOptions = useMemo(() => {
    const groups: { [key: string]: CustomSelectOption[] } = {};
    const noGroup: CustomSelectOption[] = [];

    flatOptions.forEach(opt => {
      if (opt.group) {
        if (!groups[opt.group]) groups[opt.group] = [];
        groups[opt.group].push(opt);
      } else {
        noGroup.push(opt);
      }
    });

    return { groups, noGroup };
  }, [flatOptions]);

  return (
    <div className={clsx("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white flex items-center justify-between hover:bg-white/10 transition-all focus:outline-none focus:border-[var(--brand-red)]",
          disabled && "opacity-50 cursor-not-allowed grayscale",
          buttonClassName
        )}
      >
        <span className="truncate">{selectedOption?.label || value || 'Select...'}</span>
        <ChevronDown size={12} className={clsx("transition-transform duration-200 text-white/40", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-full left-0 right-0 mt-1.5 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden z-[70] shadow-2xl max-h-64 overflow-y-auto custom-scrollbar"
            >
              {groupedOptions.noGroup.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={clsx(
                    "w-full px-3 py-2 text-[11px] text-left transition-colors flex items-center justify-between group",
                    value === opt.value ? "text-[var(--brand-red)] bg-white/5" : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span>{opt.label}</span>
                  {value === opt.value && <Check size={10} />}
                </button>
              ))}

              {Object.entries(groupedOptions.groups).map(([groupName, groupOpts]) => (
                <div key={groupName} className="border-t border-white/5 first:border-t-0">
                  <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-white/20 bg-white/[0.02]">
                    {groupName}
                  </div>
                  {groupOpts.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={clsx(
                        "w-full px-3 py-2 text-[11px] text-left transition-colors flex items-center justify-between group pl-5",
                        value === opt.value ? "text-[var(--brand-red)] bg-white/5" : "text-white/70 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <span>{opt.label}</span>
                      {value === opt.value && <Check size={10} />}
                    </button>
                  ))}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ModelsModal = ({ isOpen, onClose }: ModelsModalProps) => {
  const { 
    providers: storeProviders, 
    addProvider: storeAddProvider, 
    updateProvider: storeUpdateProvider, 
    removeProvider: storeRemoveProvider, 
    globalDefaults: storeGlobalDefaults, 
    setGlobalDefault: storeSetGlobalDefault
  } = useTapStore();

  // Local state for editing
  const [localProviders, setLocalProviders] = useState<ProviderConfig[]>([]);
  const [localGlobalDefaults, setLocalGlobalDefaults] = useState(storeGlobalDefaults);
  const [localModelOverrides, setLocalModelOverrides] = useState(useTapStore.getState().modelOverrides);
  
  const [selectedProviderId, setSelectedProviderId] = useState<string | 'global-settings'>('global-settings');
  const [imageConfigTab, setImageConfigTab] = useState<string>('GLOBAL');
  const [showOverrideSelector, setShowOverrideSelector] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleKeyVisibility = (id: string) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Dialog states
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalProviders(JSON.parse(JSON.stringify(storeProviders || [])));
      
      // Ensure imageConfig exists in global defaults
      const defaults = { ...storeGlobalDefaults };
      if (!defaults.imageConfig) {
        defaults.imageConfig = {
          defaultRatio: '1:1',
          defaultQuality: '1K',
          ratioLayout: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9', '5:4', '4:5']
        };
      }
      setLocalGlobalDefaults(defaults);
      
      setLocalModelOverrides(JSON.parse(JSON.stringify(useTapStore.getState().modelOverrides || {})));
      setSelectedProviderId('global-settings');
      setImageConfigTab('GLOBAL');
      setShowOverrideSelector(false);
      // Reset UI states
      setShowUnsavedConfirm(false);
      setShowSaveToast(false);
      setConfirmRemoveId(null);
      setIsSaving(false);
    }
  }, [isOpen, storeProviders, storeGlobalDefaults]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(localProviders) !== JSON.stringify(storeProviders) ||
           JSON.stringify(localGlobalDefaults) !== JSON.stringify(storeGlobalDefaults) ||
           JSON.stringify(localModelOverrides) !== JSON.stringify(useTapStore.getState().modelOverrides);
  }, [localProviders, storeProviders, localGlobalDefaults, storeGlobalDefaults, localModelOverrides]);

  const selectedProvider = localProviders.find(p => p.id === selectedProviderId);

  const handleAddProvider = () => {
    const id = `provider-${Date.now()}`;
    const newProvider: ProviderConfig = {
      id,
      name: 'New Provider',
      type: 'openai-compatible',
      defaultProtocol: 'openai-compatible',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      enabled: true,
      models: []
    };
    setLocalProviders([...localProviders, newProvider]);
    setSelectedProviderId(id);
  };

  const handleUpdateProvider = (id: string, updates: Partial<ProviderConfig>) => {
    setLocalProviders(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleRemoveProvider = (id: string) => {
    setLocalProviders(prev => prev.filter(p => p.id !== id));
    if (selectedProviderId === id) {
      setSelectedProviderId('global-settings');
    }
    setConfirmRemoveId(null);
  };

  const handleSetGlobalDefault = (type: 'text' | 'image' | 'video', value: string) => {
    setLocalGlobalDefaults(prev => ({ ...prev, [type]: value }));
  };

  const handleSave = () => {
    if (isSaving) return;
    setIsSaving(true);

    // Commit all local changes to store
    // 1. Update providers
    // First remove ones that are gone
    const currentStoreIds = storeProviders.map(p => p.id);
    const localIds = localProviders.map(p => p.id);
    currentStoreIds.forEach(id => {
      if (!localIds.includes(id)) storeRemoveProvider(id);
    });

    // Then update/add
    localProviders.forEach(p => {
      const existing = storeProviders.find(sp => sp.id === p.id);
      if (existing) {
        storeUpdateProvider(p.id, p);
      } else {
        storeAddProvider(p);
      }
    });

    // 2. Update defaults
    storeSetGlobalDefault('text', localGlobalDefaults.text);
    storeSetGlobalDefault('image', localGlobalDefaults.image);
    storeSetGlobalDefault('video', localGlobalDefaults.video);
    useTapStore.getState().setImageConfig(localGlobalDefaults.imageConfig);

    // 3. Update overrides
    // First remove ones that are gone
    const currentOverrideKeys = Object.keys(useTapStore.getState().modelOverrides);
    const localOverrideKeys = Object.keys(localModelOverrides);
    currentOverrideKeys.forEach(key => {
      if (!localOverrideKeys.includes(key)) useTapStore.getState().removeModelOverride(key);
    });

    // Then update/add
    localOverrideKeys.forEach(key => {
      const config = localModelOverrides[key].imageConfig;
      if (config) useTapStore.getState().setImageConfig(config, key);
    });

    setShowSaveToast(true);
    
    // Use a ref or a flag to prevent the "unsaved changes" dialog from showing during the close timeout
    // Actually, setting isSaving to true and checking it in handleCloseAttempt is better
    
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleCloseAttempt = () => {
    if (isSaving) return; // Don't allow closing while saving
    if (hasChanges) {
      setShowUnsavedConfirm(true);
    } else {
      onClose();
    }
  };

  const handleTestProvider = async (provider: ProviderConfig) => {
    setTestStatus(prev => ({ ...prev, [provider.id]: 'loading' }));
    try {
      const success = await aiService.testConnection(provider);
      setTestStatus(prev => ({ ...prev, [provider.id]: success ? 'success' : 'error' }));
    } catch (err) {
      setTestStatus(prev => ({ ...prev, [provider.id]: 'error' }));
    }
  };
  const handleAddModel = (providerId: string, type: 'text' | 'image' | 'video') => {
    const provider = localProviders.find(p => p.id === providerId);
    if (!provider) return;

    const newModel: ModelConfig = {
      id: '',
      name: '',
      capabilities: { 
        text: type === 'text', 
        image: type === 'image', 
        video: type === 'video' 
      },
      protocol: provider.defaultProtocol,
      enabled: true,
      isCustom: true
    };

    handleUpdateProvider(providerId, {
      models: [...provider.models, newModel]
    });
  };

  const handleDragEnd = (event: DragEndEvent, type: 'text' | 'image' | 'video') => {
    const { active, over } = event;
    if (!over || !selectedProvider) return;

    if (active.id !== over.id) {
      const typeModels = selectedProvider.models.filter(m => m.capabilities[type]);
      const oldIndex = typeModels.findIndex(m => {
        const globalIdx = selectedProvider.models.indexOf(m);
        return `${selectedProvider.id}-${type}-${m.id}-${globalIdx}` === active.id;
      });
      const newIndex = typeModels.findIndex(m => {
        const globalIdx = selectedProvider.models.indexOf(m);
        return `${selectedProvider.id}-${type}-${m.id}-${globalIdx}` === over.id;
      });

      if (oldIndex !== -1 && newIndex !== -1) {
        const movedModel = typeModels[oldIndex];
        const otherModels = selectedProvider.models.filter(m => !m.capabilities[type]);
        
        // Reconstruct the models array
        const newTypeModels = arrayMove(typeModels, oldIndex, newIndex);
        
        // This is tricky because we want to maintain relative order but they are mixed in the global array
        // For simplicity, we'll group them by capability for now or just update the global array
        const newGlobalModels = [...selectedProvider.models];
        
        // Find all indices of models of this type in the global array
        const globalIndices = selectedProvider.models
          .map((m, i) => m.capabilities[type] ? i : -1)
          .filter(i => i !== -1);
          
        // Replace them with the new ordered models
        newTypeModels.forEach((m, i) => {
          newGlobalModels[globalIndices[i]] = m;
        });

        handleUpdateProvider(selectedProvider.id, { models: newGlobalModels });
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-12"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={handleCloseAttempt} />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="relative w-full max-w-6xl h-full max-h-[800px] bg-[#0a0a0a] border border-[var(--app-border)] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <header className="h-16 border-b border-[var(--app-border)] flex items-center justify-between px-8 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--brand-red)] rounded-lg flex items-center justify-center">
                  <Cpu size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-display font-bold uppercase tracking-widest">Model Management</h2>
                  <p className="text-[10px] text-[var(--app-text-muted)] uppercase tracking-tight">Configure your AI providers and custom models</p>
                </div>
              </div>
              <button 
                onClick={handleCloseAttempt}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar: Provider List */}
              <aside className="w-64 border-r border-[var(--app-border)] bg-black/20 flex flex-col">
                <div className="p-2 border-b border-[var(--app-border)]">
                  <button
                    onClick={() => setSelectedProviderId('global-settings')}
                    className={clsx(
                      "w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-left",
                      selectedProviderId === 'global-settings' 
                        ? "bg-white/10 border border-white/20" 
                        : "hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <Zap size={14} className="text-[var(--brand-red)]" fill="currentColor" />
                    <div className="text-[11px] font-bold uppercase tracking-widest">Global Defaults</div>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  <div className="px-3 py-2 text-[8px] uppercase tracking-[0.2em] text-[var(--app-text-muted)] font-bold">Providers</div>
                  {localProviders.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProviderId(p.id)}
                      className={clsx(
                        "w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-left group",
                        selectedProviderId === p.id 
                          ? "bg-[var(--brand-red)]/10 border border-[var(--brand-red)]/30" 
                          : "hover:bg-white/5 border border-transparent"
                      )}
                    >
                      <div className={clsx(
                        "w-2 h-2 rounded-full",
                        p.enabled ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-600"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold truncate">{p.name}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-4 border-t border-[var(--app-border)]">
                  <button 
                    onClick={handleAddProvider}
                    className="w-full py-2 px-4 rounded-xl bg-white/5 border border-dashed border-white/20 hover:border-[var(--brand-red)] hover:bg-[var(--brand-red)]/10 transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                  >
                    <Plus size={14} /> Add Provider
                  </button>
                </div>
              </aside>

              {/* Main Content: Provider Settings */}
              <main className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-black to-[#0d0d0d]">
                {selectedProviderId === 'global-settings' ? (
                  <div className="max-w-3xl mx-auto space-y-8">
                    <section className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                        <Zap size={14} className="text-[var(--brand-red)]" />
                        <h3 className="text-[10px] font-display uppercase tracking-[0.2em] text-white">
                          Global Default Models
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        {(['text', 'image', 'video'] as const).map(type => (
                          <div key={type} className="space-y-2">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--app-text-muted)] ml-1">
                              {type === 'text' ? 'Text / Vision' : type === 'image' ? 'Image Gen' : 'Video Gen'}
                            </label>
                            <div className="relative group">
                              <CustomSelect
                                value={localGlobalDefaults[type]}
                                onChange={(val) => handleSetGlobalDefault(type, val)}
                                options={[
                                  { value: "", label: "Not Set" },
                                  ...localProviders.filter(p => p.enabled).flatMap(p => 
                                    p.models.filter(m => m.enabled && m.capabilities[type === 'text' ? 'text' : type]).map(m => ({
                                      value: `${p.id}:${m.id}`,
                                      label: m.name || m.id,
                                      group: p.name
                                    }))
                                  )
                                ]}
                                className="w-full"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                        <p className="text-[10px] text-blue-400/80 leading-relaxed">
                          New nodes will automatically use these defaults. Nodes that have been manually configured will retain their settings.
                        </p>
                      </div>
                    </section>

                    {/* Image Node Configuration Section */}
                    <section className="space-y-6 pt-4">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                          <ImageIcon size={14} className="text-[var(--brand-red)]" />
                          <h3 className="text-[10px] font-display uppercase tracking-[0.2em] text-white">
                            Image Node Configuration (UI & Workflow)
                          </h3>
                        </div>
                      </div>

                      {/* Tabs for Global vs Model Overrides */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setImageConfigTab('GLOBAL')}
                          className={clsx(
                            "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                            imageConfigTab === 'GLOBAL' 
                              ? "bg-white/10 border-white/20 text-white" 
                              : "bg-transparent border-transparent text-[var(--app-text-muted)] hover:text-white"
                          )}
                        >
                          Global
                        </button>
                        {Object.keys(localModelOverrides).map(modelKey => (
                          <div key={modelKey} className="group relative">
                            <button
                              onClick={() => setImageConfigTab(modelKey)}
                              className={clsx(
                                "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center gap-2",
                                imageConfigTab === modelKey 
                                  ? "bg-[var(--brand-red)]/10 border-[var(--brand-red)]/30 text-[var(--brand-red)]" 
                                  : "bg-transparent border-transparent text-[var(--app-text-muted)] hover:text-white"
                              )}
                            >
                              {modelKey.split(':')[1]}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newOverrides = { ...localModelOverrides };
                                  delete newOverrides[modelKey];
                                  setLocalModelOverrides(newOverrides);
                                  if (imageConfigTab === modelKey) setImageConfigTab('GLOBAL');
                                }}
                                className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                              >
                                <X size={10} />
                              </button>
                            </button>
                          </div>
                        ))}
                        
                        <div className="relative">
                          <button
                            onClick={() => setShowOverrideSelector(!showOverrideSelector)}
                            className="p-2 rounded-xl bg-white/5 border border-dashed border-white/20 hover:border-[var(--brand-red)]/50 hover:text-[var(--brand-red)] transition-all"
                            title="Add Model Override"
                          >
                            <PlusCircle size={16} />
                          </button>
                          
                          <AnimatePresence>
                            {showOverrideSelector && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute left-0 top-full mt-2 z-50 w-64 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl p-2 max-h-64 overflow-y-auto"
                              >
                                {localProviders.filter(p => p.enabled).map(p => (
                                  <div key={p.id} className="space-y-1 mb-2 last:mb-0">
                                    <div className="px-3 py-1 text-[8px] font-bold uppercase tracking-widest text-white/30">{p.name}</div>
                                    {p.models.filter(m => m.enabled && m.capabilities.image).map(m => {
                                      const key = `${p.id}:${m.id}`;
                                      if (localModelOverrides[key]) return null;
                                      return (
                                        <button
                                          key={key}
                                          onClick={() => {
                                            setLocalModelOverrides({
                                              ...localModelOverrides,
                                              [key]: { imageConfig: { ...localGlobalDefaults.imageConfig } }
                                            });
                                            setImageConfigTab(key);
                                            setShowOverrideSelector(false);
                                          }}
                                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-[10px] font-medium transition-colors"
                                        >
                                          {m.name || m.id}
                                        </button>
                                      );
                                    })}
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Config Area */}
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* 1. Defaults */}
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[var(--app-text-muted)]">
                              <Settings2 size={12} /> 1. Default Settings (For new nodes)
                            </div>
                            <div className="flex gap-4">
                              <div className="flex-1 space-y-1.5">
                                <label className="text-[8px] font-bold uppercase tracking-widest text-white/30 ml-1">Default Ratio</label>
                                <CustomSelect
                                  value={imageConfigTab === 'GLOBAL' ? localGlobalDefaults.imageConfig?.defaultRatio || '1:1' : localModelOverrides[imageConfigTab]?.imageConfig?.defaultRatio || '1:1'}
                                  onChange={(val) => {
                                    if (imageConfigTab === 'GLOBAL') {
                                      setLocalGlobalDefaults({
                                        ...localGlobalDefaults,
                                        imageConfig: { ...(localGlobalDefaults.imageConfig || DEFAULT_IMAGE_CONFIG), defaultRatio: val }
                                      });
                                    } else {
                                      setLocalModelOverrides({
                                        ...localModelOverrides,
                                        [imageConfigTab]: {
                                          ...localModelOverrides[imageConfigTab],
                                          imageConfig: { ...(localModelOverrides[imageConfigTab]?.imageConfig || DEFAULT_IMAGE_CONFIG), defaultRatio: val }
                                        }
                                      });
                                    }
                                  }}
                                  options={SUPPORTED_RATIOS}
                                />
                              </div>
                              <div className="flex-1 space-y-1.5">
                                <label className="text-[8px] font-bold uppercase tracking-widest text-white/30 ml-1">Default Quality</label>
                                <CustomSelect
                                  value={imageConfigTab === 'GLOBAL' ? localGlobalDefaults.imageConfig?.defaultQuality || '1K' : localModelOverrides[imageConfigTab]?.imageConfig?.defaultQuality || '1K'}
                                  onChange={(val) => {
                                    if (imageConfigTab === 'GLOBAL') {
                                      setLocalGlobalDefaults({
                                        ...localGlobalDefaults,
                                        imageConfig: { ...(localGlobalDefaults.imageConfig || DEFAULT_IMAGE_CONFIG), defaultQuality: val }
                                      });
                                    } else {
                                      setLocalModelOverrides({
                                        ...localModelOverrides,
                                        [imageConfigTab]: {
                                          ...localModelOverrides[imageConfigTab],
                                          imageConfig: { ...(localModelOverrides[imageConfigTab]?.imageConfig || DEFAULT_IMAGE_CONFIG), defaultQuality: val }
                                        }
                                      });
                                    }
                                  }}
                                  options={[...SUPPORTED_QUALITIES].reverse()}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 2. Panel Designer */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[var(--app-text-muted)]">
                            <LayoutGrid size={12} /> 2. Panel Designer (Drag & Drop to customize UI)
                          </div>

                          <div className="flex gap-8">
                            {/* Available Pool */}
                            <div className="w-48 space-y-3">
                              <div className="text-[8px] font-bold uppercase tracking-widest text-white/30 ml-1">Available Ratios</div>
                              <div className="grid grid-cols-2 gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl min-h-[200px]">
                                {SUPPORTED_RATIOS.filter(r => {
                                  const layout = imageConfigTab === 'GLOBAL' 
                                    ? localGlobalDefaults.imageConfig?.ratioLayout || []
                                    : localModelOverrides[imageConfigTab]?.imageConfig?.ratioLayout || [];
                                  return !layout.includes(r);
                                }).map(ratio => (
                                  <button
                                    key={ratio}
                                    onClick={() => {
                                      if (imageConfigTab === 'GLOBAL') {
                                        const layout = [...(localGlobalDefaults.imageConfig?.ratioLayout || DEFAULT_IMAGE_CONFIG.ratioLayout)];
                                        if (layout.length < 12) {
                                          layout.push(ratio);
                                          setLocalGlobalDefaults({
                                            ...localGlobalDefaults,
                                            imageConfig: { ...(localGlobalDefaults.imageConfig || DEFAULT_IMAGE_CONFIG), ratioLayout: layout }
                                          });
                                        }
                                      } else {
                                        const layout = [...(localModelOverrides[imageConfigTab]?.imageConfig?.ratioLayout || DEFAULT_IMAGE_CONFIG.ratioLayout)];
                                        if (layout.length < 12) {
                                          layout.push(ratio);
                                          setLocalModelOverrides({
                                            ...localModelOverrides,
                                            [imageConfigTab]: {
                                              ...localModelOverrides[imageConfigTab],
                                              imageConfig: { ...(localModelOverrides[imageConfigTab]?.imageConfig || DEFAULT_IMAGE_CONFIG), ratioLayout: layout }
                                            }
                                          });
                                        }
                                      }
                                    }}
                                    className="flex items-center justify-center p-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all text-[9px] font-bold text-white/60"
                                  >
                                    {ratio}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Active Preview */}
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="text-[8px] font-bold uppercase tracking-widest text-white/30 ml-1">Preview: Node Popup Panel</div>
                                <div className="text-[8px] font-bold uppercase tracking-widest text-white/20 italic">Max 12 Slots</div>
                              </div>
                              
                              <div className="p-6 bg-black/40 border border-white/10 rounded-3xl flex gap-6 relative overflow-hidden group/preview">
                                {/* Grid Background */}
                                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                                
                                {/* Ratio Grid */}
                                <div className="flex-1 flex flex-col">
                                  <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragStart={(e) => setActiveDragId(e.active.id as string)}
                                    onDragEnd={(e) => {
                                      setActiveDragId(null);
                                      const { active, over } = e;
                                      if (!over || active.id === over.id) return;

                                      const layout = imageConfigTab === 'GLOBAL' 
                                        ? [...(localGlobalDefaults.imageConfig?.ratioLayout || DEFAULT_IMAGE_CONFIG.ratioLayout)]
                                        : [...(localModelOverrides[imageConfigTab]?.imageConfig?.ratioLayout || DEFAULT_IMAGE_CONFIG.ratioLayout)];
                                      
                                      const oldIndex = layout.indexOf(active.id as string);
                                      const newIndex = layout.indexOf(over.id as string);
                                      
                                      const newLayout = arrayMove(layout, oldIndex, newIndex);
                                      
                                      if (imageConfigTab === 'GLOBAL') {
                                        setLocalGlobalDefaults({
                                          ...localGlobalDefaults,
                                          imageConfig: { ...(localGlobalDefaults.imageConfig || DEFAULT_IMAGE_CONFIG), ratioLayout: newLayout }
                                        });
                                      } else {
                                        setLocalModelOverrides({
                                          ...localModelOverrides,
                                          [imageConfigTab]: {
                                            ...localModelOverrides[imageConfigTab],
                                            imageConfig: { ...(localModelOverrides[imageConfigTab]?.imageConfig || DEFAULT_IMAGE_CONFIG), ratioLayout: newLayout }
                                          }
                                        });
                                      }
                                    }}
                                  >
                                    <SortableContext
                                      items={imageConfigTab === 'GLOBAL' ? (localGlobalDefaults.imageConfig?.ratioLayout || []) : localModelOverrides[imageConfigTab]?.imageConfig?.ratioLayout || []}
                                      strategy={rectSortingStrategy}
                                    >
                                      <div className="grid grid-cols-4 gap-3">
                                        {(imageConfigTab === 'GLOBAL' ? (localGlobalDefaults.imageConfig?.ratioLayout || []) : localModelOverrides[imageConfigTab]?.imageConfig?.ratioLayout || []).map(ratio => (
                                          <SortableRatioItem
                                            key={ratio}
                                            id={ratio}
                                            ratio={ratio}
                                            isDefault={(imageConfigTab === 'GLOBAL' ? localGlobalDefaults.imageConfig?.defaultRatio : localModelOverrides[imageConfigTab]?.imageConfig?.defaultRatio) === ratio}
                                            onSetDefault={() => {
                                              if (imageConfigTab === 'GLOBAL') {
                                                setLocalGlobalDefaults({
                                                  ...localGlobalDefaults,
                                                  imageConfig: { ...(localGlobalDefaults.imageConfig || DEFAULT_IMAGE_CONFIG), defaultRatio: ratio }
                                                });
                                              } else {
                                                setLocalModelOverrides({
                                                  ...localModelOverrides,
                                                  [imageConfigTab]: {
                                                    ...localModelOverrides[imageConfigTab],
                                                    imageConfig: { ...(localModelOverrides[imageConfigTab]?.imageConfig || DEFAULT_IMAGE_CONFIG), defaultRatio: ratio }
                                                  }
                                                });
                                              }
                                            }}
                                            onRemove={() => {
                                              if (imageConfigTab === 'GLOBAL') {
                                                setLocalGlobalDefaults({
                                                  ...localGlobalDefaults,
                                                  imageConfig: { 
                                                    ...(localGlobalDefaults.imageConfig || DEFAULT_IMAGE_CONFIG), 
                                                    ratioLayout: (localGlobalDefaults.imageConfig?.ratioLayout || DEFAULT_IMAGE_CONFIG.ratioLayout).filter(r => r !== ratio) 
                                                  }
                                                });
                                              } else {
                                                setLocalModelOverrides({
                                                  ...localModelOverrides,
                                                  [imageConfigTab]: {
                                                    ...localModelOverrides[imageConfigTab],
                                                    imageConfig: { 
                                                      ...(localModelOverrides[imageConfigTab]?.imageConfig || DEFAULT_IMAGE_CONFIG), 
                                                      ratioLayout: (localModelOverrides[imageConfigTab]?.imageConfig?.ratioLayout || DEFAULT_IMAGE_CONFIG.ratioLayout).filter(r => r !== ratio) 
                                                    }
                                                  }
                                                });
                                              }
                                            }}
                                          />
                                        ))}
                                        {/* Empty slots placeholders */}
                                        {Array.from({ length: 12 - (imageConfigTab === 'GLOBAL' ? (localGlobalDefaults.imageConfig?.ratioLayout?.length || 0) : localModelOverrides[imageConfigTab]?.imageConfig?.ratioLayout?.length || 0) }).map((_, i) => (
                                          <div key={`empty-${i}`} className="aspect-square rounded-xl border border-dashed border-white/5 bg-white/[0.01]" />
                                        ))}
                                      </div>
                                    </SortableContext>
                                  </DndContext>
                                  <div className="text-[8px] font-bold uppercase tracking-widest text-white/20 text-center mt-auto pt-4">Ratio Grid (3x4 Flow)</div>
                                </div>

                                {/* Divider */}
                                <div className="w-px bg-white/10 self-stretch" />

                                {/* Quality List */}
                                <div className="w-20 flex flex-col">
                                  <div className="flex flex-col gap-2">
                                    {[...SUPPORTED_QUALITIES].reverse().map(q => {
                                      const isDefault = (imageConfigTab === 'GLOBAL' ? localGlobalDefaults.imageConfig?.defaultQuality : localModelOverrides[imageConfigTab]?.imageConfig?.defaultQuality) === q;
                                      return (
                                        <div
                                          key={q}
                                          className={clsx(
                                            "px-2 py-3 rounded-lg border text-[9px] font-bold text-center transition-all",
                                            isDefault ? "border-[var(--brand-red)] bg-[var(--brand-red)]/5 text-[var(--brand-red)]" : "border-white/5 bg-white/5 text-white/40"
                                          )}
                                        >
                                          {q}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className="text-[8px] font-bold uppercase tracking-widest text-white/20 text-center mt-auto pt-4">Quality</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-[8px] text-white/20 italic ml-2">
                                <ArrowRightLeft size={10} /> Empty slots auto-collapse in the actual node UI.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                ) : selectedProvider ? (
                  <div className="max-w-3xl mx-auto space-y-8">
                    {/* Basic Info Section */}
                    <section className="space-y-6">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                          <Globe size={14} className="text-[var(--brand-red)]" />
                          <h3 className="text-[10px] font-display uppercase tracking-[0.2em] text-white">
                            Provider Configuration
                          </h3>
                        </div>
                        <button 
                          onClick={() => handleUpdateProvider(selectedProvider.id, { enabled: !selectedProvider.enabled })}
                          className={clsx(
                            "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all",
                            selectedProvider.enabled ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                          )}
                        >
                          {selectedProvider.enabled ? 'Active' : 'Disabled'}
                        </button>
                      </div>

                      {/* Row 1: Name, URL, Protocol */}
                      <div className="flex gap-4 items-end">
                        <div className="flex-[1.5] space-y-1.5">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--app-text-muted)] ml-1">Display Name</label>
                          <input 
                            type="text"
                            value={selectedProvider.name}
                            onChange={(e) => handleUpdateProvider(selectedProvider.id, { name: e.target.value })}
                            className="w-full bg-white/5 border border-[var(--app-border)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[var(--brand-red)] transition-all disabled:opacity-50"
                            placeholder="e.g. 12AI Aggregator"
                          />
                        </div>
                        <div className="flex-[5.5] space-y-1.5">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--app-text-muted)] ml-1">Base URL</label>
                          <input 
                            type="text"
                            value={selectedProvider.baseUrl}
                            onChange={(e) => handleUpdateProvider(selectedProvider.id, { baseUrl: e.target.value })}
                            className="w-full bg-white/5 border border-[var(--app-border)] rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-[var(--brand-red)] transition-all"
                            placeholder={selectedProvider.type === 'gemini' ? "https://generativelanguage.googleapis.com" : "https://api.openai.com/v1"}
                          />
                        </div>
                        <div className="flex-[3] space-y-1.5">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--app-text-muted)] ml-1">Default Protocol</label>
                          <div className="flex bg-white/5 border border-[var(--app-border)] rounded-xl p-1">
                            {(['openai-compatible', 'gemini', 'mix'] as const).map(p => (
                              <button
                                key={p}
                                onClick={() => handleUpdateProvider(selectedProvider.id, { defaultProtocol: p })}
                                className={clsx(
                                  "flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                                  selectedProvider.defaultProtocol === p 
                                    ? "bg-[var(--brand-red)] text-white shadow-lg" 
                                    : "text-[var(--app-text-muted)] hover:text-white"
                                )}
                              >
                                {p === 'openai-compatible' ? 'OpenAI' : p === 'gemini' ? 'Gemini' : 'Mix'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Row 2: API Key & Unified Connection Hub */}
                      <div className="flex gap-4 items-end">
                        <div className="flex-[7] space-y-1.5">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--app-text-muted)] ml-1">API Secret Key</label>
                          <div className="relative">
                            <input 
                              type={showKey[selectedProvider.id] ? "text" : "password"}
                              value={selectedProvider.apiKey}
                              onChange={(e) => handleUpdateProvider(selectedProvider.id, { apiKey: e.target.value })}
                              className="w-full bg-white/5 border border-[var(--app-border)] rounded-xl px-4 h-[38px] text-xs font-mono focus:outline-none focus:border-[var(--brand-red)] transition-all pr-12"
                              placeholder="sk-••••••••••••••••••••••••"
                            />
                            <button 
                              onClick={() => toggleKeyVisibility(selectedProvider.id)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-lg text-[var(--app-text-muted)] transition-colors"
                            >
                              {showKey[selectedProvider.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex-[3] pb-0.5">
                          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl h-[38px] overflow-hidden w-full">
                            {/* Status Section */}
                            <div className="flex-1 flex items-center gap-3 px-4 border-r border-white/10 h-full">
                              <span className="text-[11px] font-bold text-white/60 uppercase tracking-tight">Status:</span>
                              <div className={clsx(
                                "transition-all duration-500",
                                testStatus[selectedProvider.id] === 'success' ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" :
                                testStatus[selectedProvider.id] === 'error' ? "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]" :
                                testStatus[selectedProvider.id] === 'loading' ? "text-blue-400" :
                                "text-white/20"
                              )}>
                                {testStatus[selectedProvider.id] === 'loading' ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Zap size={14} fill={testStatus[selectedProvider.id] === 'success' ? "currentColor" : "none"} />
                                )}
                              </div>
                            </div>

                            {/* Test Button Section */}
                            <div className="px-1.5 py-1.5 h-full flex items-center">
                              <button 
                                onClick={() => handleTestProvider(selectedProvider)}
                                disabled={testStatus[selectedProvider.id] === 'loading'}
                                className={clsx(
                                  "h-full px-4 rounded-lg text-[10px] font-bold uppercase tracking-[0.1em] transition-all disabled:opacity-50 flex items-center justify-center",
                                  "bg-white/10 border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.2)] hover:bg-white/20 hover:border-white/20 active:scale-95 active:bg-white/5",
                                  testStatus[selectedProvider.id] === 'success' ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" :
                                  testStatus[selectedProvider.id] === 'error' ? "text-red-400 border-red-500/30 bg-red-500/10" :
                                  "text-white"
                                )}
                              >
                                {testStatus[selectedProvider.id] === 'loading' ? 'Testing' : 'Test'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-[9px] text-[var(--app-text-muted)] ml-1 flex items-center gap-1 -mt-4">
                        <ShieldCheck size={10} /> Keys are stored locally in your browser's LocalStorage.
                      </p>
                    </section>

                    {/* Models Section - Three Columns */}
                    <section className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                        <Zap size={14} className="text-[var(--brand-red)]" />
                        <h3 className="text-[10px] font-display uppercase tracking-[0.2em] text-white">Model Configuration</h3>
                      </div>

                      <div className="grid grid-cols-3 gap-6">
                        {(['text', 'image', 'video'] as const).map(type => {
                          const typeModels = selectedProvider.models.filter(m => m.capabilities[type]);
                          const modelIds = typeModels.map((m, i) => {
                            const globalIdx = selectedProvider.models.indexOf(m);
                            return `${selectedProvider.id}-${type}-${m.id}-${globalIdx}`;
                          });

                          return (
                            <div key={type} className="space-y-3">
                              <div className="flex items-center justify-between px-1">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--app-text-muted)]">
                                  {type === 'text' ? 'Text / Vision' : type === 'image' ? 'Image' : 'Video'}
                                </span>
                              </div>

                              <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={(event) => handleDragEnd(event, type)}
                              >
                                <SortableContext
                                  items={modelIds}
                                  strategy={verticalListSortingStrategy}
                                >
                                  <div className="space-y-2">
                                    {typeModels.map((model) => {
                                      const globalIdx = selectedProvider.models.indexOf(model);
                                      return (
                                        <SortableModelItem
                                          key={`${selectedProvider.id}-${type}-${model.id}-${globalIdx}`}
                                          model={model}
                                          globalIdx={globalIdx}
                                          type={type}
                                          selectedProvider={selectedProvider}
                                          handleUpdateProvider={handleUpdateProvider}
                                        />
                                      );
                                    })}
                                    
                                    {/* Ghost Card: Add Model Button */}
                                    <button
                                      onClick={() => handleAddModel(selectedProvider.id, type)}
                                      className="w-full h-[54px] border border-dashed border-white/10 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] hover:border-[var(--brand-red)]/30 transition-all group/ghost flex items-center justify-center gap-2.5"
                                    >
                                      <Plus size={12} className="text-white/10 group-hover/ghost:text-[var(--brand-red)] transition-all" />
                                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/10 group-hover/ghost:text-white/40 transition-all">
                                        Add {type === 'text' ? 'Text' : type === 'image' ? 'Image' : 'Video'} Model
                                      </span>
                                    </button>

                                    {typeModels.length === 0 && (
                                      <div className="py-4 flex items-center justify-center">
                                        <span className="text-[8px] uppercase tracking-widest text-white/5 italic">No models configured</span>
                                      </div>
                                    )}
                                  </div>
                                </SortableContext>
                              </DndContext>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                      <section className="pt-8 border-t border-white/10">
                        <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Danger Zone</h4>
                            <p className="text-[10px] text-red-500/60">Removing this provider will delete all its configurations and keys.</p>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setConfirmRemoveId(selectedProvider.id);
                            }}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                          >
                            <Trash2 size={14} /> Remove Provider
                          </button>
                        </div>
                      </section>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-[var(--app-text-muted)]">
                      <Cpu size={32} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">No Provider Selected</h3>
                      <p className="text-xs text-[var(--app-text-muted)]">Select a provider from the sidebar or add a new one.</p>
                    </div>
                  </div>
                )}
              </main>
            </div>

            {/* Footer */}
            <footer className="h-16 border-t border-[var(--app-border)] flex items-center justify-between px-8 bg-black/40">
              <div className="flex items-center gap-2 text-[9px] text-[var(--app-text-muted)] uppercase font-mono">
                <ShieldCheck size={12} className="text-emerald-500" /> End-to-end local encryption active
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleCloseAttempt}
                  className="px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-2"
                >
                  <RotateCcw size={14} /> Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className={clsx(
                    "flex items-center gap-2 px-6 py-2 rounded-xl text-white text-[10px] font-bold uppercase tracking-widest transition-all",
                    hasChanges ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-900/20" : "bg-zinc-800 text-zinc-500 opacity-50 cursor-not-allowed"
                  )}
                >
                  <Save size={14} /> Save Changes
                </button>
              </div>
            </footer>
          </motion.div>

          {/* Dialogs & Toasts */}
          <ConfirmDialog
            isOpen={!!confirmRemoveId}
            title="Remove Provider"
            message="Are you sure you want to remove this provider? This action cannot be undone and all associated configurations will be lost."
            confirmLabel="Remove"
            onConfirm={() => confirmRemoveId && handleRemoveProvider(confirmRemoveId)}
            onCancel={() => setConfirmRemoveId(null)}
            variant="danger"
          />

          <ConfirmDialog
            isOpen={showUnsavedConfirm}
            title="Unsaved Changes"
            message="You have unsaved changes. Are you sure you want to leave without saving?"
            confirmLabel="Discard Changes"
            cancelLabel="Keep Editing"
            onConfirm={onClose}
            onCancel={() => setShowUnsavedConfirm(false)}
            variant="warning"
          />

          <Toast
            isVisible={showSaveToast}
            message="Settings saved successfully"
            onClose={() => setShowSaveToast(false)}
            type="success"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
