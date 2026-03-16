import { useState, useCallback, useRef, useEffect } from 'react';
import { aiService } from '../services/aiService';
import { ProviderConfig } from '../store';

export enum VideoGenerationStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  POLLING = 'POLLING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

interface UseVeoVideoProps {
  onSuccess?: (videoUrl: string) => void;
  onError?: (error: string) => void;
}

export const useVeoVideo = ({ onSuccess, onError }: UseVeoVideoProps = {}) => {
  const [status, setStatus] = useState<VideoGenerationStatus>(VideoGenerationStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
    };
  }, []);

  const generateVideo = useCallback(async (params: {
    prompt: string;
    referenceImages?: string[];
    modelId: string;
    provider: ProviderConfig;
    aspectRatio?: string;
    resolution?: string;
    duration?: string;
  }) => {
    if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
    
    setStatus(VideoGenerationStatus.GENERATING);
    setError(null);
    setVideoUrl(null);
    setProgress(0);

    // Convert referenceImages (base64 strings) to the format expected by aiService
    const images = params.referenceImages?.map(img => ({
      data: img,
      mimeType: 'image/png' // Default to png, aiService will handle it
    }));

    const { operationName, error: genError } = await aiService.generateVideo({
      ...params,
      images
    });

    if (genError) {
      if (isMounted.current) {
        setStatus(VideoGenerationStatus.ERROR);
        setError(genError);
        onError?.(genError);
      }
      return;
    }

    setStatus(VideoGenerationStatus.POLLING);
    pollStatus(operationName, params.provider.apiKey);
  }, [onSuccess, onError]);

  const pollStatus = useCallback(async (operationName: string, apiKey: string) => {
    const { done, videoUri, error: pollError } = await aiService.pollVideoOperation(operationName, apiKey);

    if (!isMounted.current) return;

    if (pollError) {
      setStatus(VideoGenerationStatus.ERROR);
      setError(pollError);
      onError?.(pollError);
      return;
    }

    if (done) {
      if (videoUri) {
        const blobUrl = await aiService.downloadVideoAsBlob(videoUri, apiKey);
        if (isMounted.current) {
          setVideoUrl(blobUrl);
          setStatus(VideoGenerationStatus.COMPLETED);
          onSuccess?.(blobUrl);
        }
      } else {
        const msg = 'Video generation completed but no URI was returned.';
        setStatus(VideoGenerationStatus.ERROR);
        setError(msg);
        onError?.(msg);
      }
      return;
    }

    // Continue polling
    pollingTimerRef.current = setTimeout(() => {
      pollStatus(operationName, apiKey);
    }, 10000); // Poll every 10 seconds as recommended
  }, [onSuccess, onError]);

  const reset = useCallback(() => {
    if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
    setStatus(VideoGenerationStatus.IDLE);
    setError(null);
    setVideoUrl(null);
    setProgress(0);
  }, []);

  return {
    status,
    error,
    progress,
    videoUrl,
    generateVideo,
    reset
  };
};
