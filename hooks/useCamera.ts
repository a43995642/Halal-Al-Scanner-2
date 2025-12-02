import { useRef, useState, useEffect, useCallback } from 'react';

export const useCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Camera Capabilities State
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasZoom, setHasZoom] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);

  // Helper to stop all tracks on a stream
  const stopStream = (stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        // Reset capabilities when stopping
        setHasTorch(false);
        setHasZoom(false);
      });
    }
  };

  const startCamera = useCallback(async () => {
    setError('');
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('عذراً، متصفحك لا يدعم تشغيل الكاميرا.');
      return;
    }

    try {
      // Try to get a stream with specific constraints for better scanning
      const constraints: MediaStreamConstraints = {
        video: { 
            facingMode: { ideal: 'environment' }, // Rear camera
            width: { ideal: 1920 }, // Higher res for OCR
            height: { ideal: 1080 },
            focusMode: { ideal: 'continuous' } // Attempt to force autofocus
        } as any, // Cast to any because focusMode isn't in standard TS lib yet
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(e => console.error("Play error:", e));
      }

      // Check Capabilities (Zoom & Torch)
      const track = stream.getVideoTracks()[0];
      const capabilities = ((track.getCapabilities && track.getCapabilities()) || {}) as any;
      
      // 1. Check Torch
      if ('torch' in capabilities) {
        setHasTorch(true);
      }

      // 2. Check Zoom
      if ('zoom' in capabilities) {
        setHasZoom(true);
        setMaxZoom(capabilities.zoom.max || 5); // Default cap if undefined
        setZoomLevel(capabilities.zoom.min || 1);
      }

    } catch (err: any) {
      console.error("Camera start failed:", err);
      
      // Fallback attempts logic...
      try {
          console.log("Retrying with basic constraints...");
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          streamRef.current = fallbackStream;
          
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play().catch(e => console.error("Play error fallback:", e));
          }
      } catch (fallbackErr: any) {
           // Error handling (same as before)
           const errorName = fallbackErr.name || err.name;
           if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
             setError('تم رفض إذن الكاميرا. يرجى تفعيلها من إعدادات المتصفح.');
           } else if (errorName === 'NotFoundError') {
             setError('لم يتم العثور على كاميرا.');
           } else {
             setError('حدث خطأ غير متوقع في الكاميرا.');
           }
      }
    }
  }, []);

  const cleanupCamera = useCallback(() => {
    if (streamRef.current) {
      stopStream(streamRef.current);
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Torch Toggle Function
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current || !hasTorch) return;
    const track = streamRef.current.getVideoTracks()[0];
    
    try {
      await track.applyConstraints({
        advanced: [{ torch: !isTorchOn }] as any
      });
      setIsTorchOn(!isTorchOn);
    } catch (e) {
      console.error("Torch toggle failed", e);
    }
  }, [hasTorch, isTorchOn]);

  // Zoom Function
  const setZoom = useCallback(async (level: number) => {
    if (!streamRef.current || !hasZoom) return;
    const track = streamRef.current.getVideoTracks()[0];

    try {
      await track.applyConstraints({
        advanced: [{ zoom: level }] as any
      });
      setZoomLevel(level);
    } catch (e) {
      console.error("Zoom failed", e);
    }
  }, [hasZoom]);

  const captureImage = useCallback((onCapture: (imageSrc: string) => void) => {
    if (isCapturing) return;
    
    if (videoRef.current && videoRef.current.readyState >= videoRef.current.HAVE_CURRENT_DATA) {
      setIsCapturing(true);

      // Trigger Haptic Feedback on capture attempt
      if (navigator.vibrate) navigator.vibrate(50);

      const video = videoRef.current;
      
      // Visual delay for shutter effect
      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          // High quality capture
          const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95); 
          
          // Haptic success
          if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
          
          onCapture(imageDataUrl);
          cleanupCamera();
        } else {
          setIsCapturing(false);
        }
      }, 100); 
    }
  }, [isCapturing, cleanupCamera]);

  useEffect(() => {
    startCamera();
    return () => cleanupCamera();
  }, [startCamera, cleanupCamera]);

  return {
    videoRef,
    error,
    isCapturing,
    captureImage,
    // Capabilities exports
    hasTorch,
    isTorchOn,
    toggleTorch,
    hasZoom,
    zoomLevel,
    maxZoom,
    setZoom
  };
};