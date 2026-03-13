import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { TapNode } from './store';

// Empty VideoNode for now as requested
export const VideoNode = memo((props: NodeProps<TapNode>) => {
  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white/50 text-xs italic">
      Video Node (Work in Progress)
    </div>
  );
});
