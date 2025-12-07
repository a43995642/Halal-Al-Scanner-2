import { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export const useCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const mountedRef = useRef(true);
  
  // Camera Capabilities State
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasZoom, setHasZoom] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);

  // Helper to stop all tracks on a stream
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
  };

  const startCamera = useCallback(async () => {
    setError('');
    
    // Safety check: Don't start if unmounted
    if (!mountedRef.current) return;

    // IMPORTANT: Request permissions explicitly on native devices
    if (Capacitor.isNativePlatform()) {
      try {
        const permissions = await Camera.requestPermissions();
        if (permissions.camera !== 'granted' && permissions.camera !== 'limited') {
           setError('يرجى منح إذن الكاميرا من إعدادات الهاتف لاستخدام التطبيق.');
           return;
        }
      } catch (e) {
        console.warn("Native permission request failed", e);
      }
    }

    // Check if navigator.mediaDevices exists (required for web camera)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // If on native platform, guide user to use native camera button
      if (Capacitor.isNativePlatform()) {
        setError('تعذر فتح الكاميرا المباشرة. يرجى استخدام زر "كاميرا النظام".');
      } else {
        setError('المتصفح لا يدعم الكاميرا المباشرة.');
      }
      return;
    }

    try {
      // 1. Try to get a stream with reasonable constraints
      // Removing 'focusMode' as it causes issues on some Android WebViews
      const constraints: MediaStreamConstraints = {
        video: { 
            facingMode: 'environment', // Rear camera
            width: { ideal: 1280 },    // Safe HD resolution
            height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // If component unmounted while waiting for stream, stop it immediately
      if (!mountedRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Handle play promise rejection silently (common in strict mode)
        videoRef.current.play().catch(e => console.warn("Video play interrupted:", e));
      }

      // Check Capabilities (Zoom & Torch)
      try {
        const track = stream.getVideoTracks()[0];
        const capabilities = ((track.getCapabilities && track.getCapabilities()) || {}) as any;
        
        if (capabilities.torch) setHasTorch(true);
        if (capabilities.zoom) {
          setHasZoom(true);
          setMaxZoom(capabilities.zoom.max || 1);
          setZoomLevel(capabilities.zoom.min || 1);
        }
      } catch (e) {
        console.warn("Capabilities check failed", e);
      }

    } catch (err: any) {
      console.error("Camera start failed:", err);
      if (!mountedRef.current) return;
      
      // Fallback: Try generic constraints if specific ones failed
      try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          
          if (!mountedRef.current) {
            fallbackStream.getTracks().forEach(t => t.stop());
            return;
          }

          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.play().catch(e => console.warn("Fallback play error:", e));
          }
      } catch (fallbackErr: any) {
           const errorName = fallbackErr.name || err.name;
           if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
             setError('تم رفض إذن الكاميرا. يرجى تفعيلها من الإعدادات.');
           } else if (errorName === 'NotFoundError') {
             setError('لم يتم العثور على كاميرا.');
           } else {
             // Generic error on mobile often means WebView restriction
             setError('حدث خطأ. اضغط على "استخدام كاميرا النظام" في الأسفل.');
           }
      }
    }
  }, []);

  const openNativeCamera = async (onCapture: (imageSrc: string) => void) => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        promptLabelHeader: 'فحص المنتج',
        promptLabelPhoto: 'التقاط صورة',
        promptLabelPicture: 'التقاط صورة'
      });

      if (image.dataUrl) {
        onCapture(image.dataUrl);
      }
    } catch (e) {
      console.log('User cancelled or failed to open native camera', e);
    }
  };

  const cleanupCamera = useCallback(() => {
    stopStream();
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

  const captureImage = useCallback((onCapture: (imageSrc: string) => void, shouldClose: boolean = true) => {
    if (isCapturing) return;
    
    if (videoRef.current && videoRef.current.readyState >= videoRef.current.HAVE_CURRENT_DATA) {
      setIsCapturing(true);

      if (navigator.vibrate) navigator.vibrate(50);

      const video = videoRef.current;
      
      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95); 
          
          if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
          
          onCapture(imageDataUrl);
          
          // Updated Logic: Only clean up if we intend to close
          if (shouldClose) {
            // FIX: Do NOT clean up manually here. 
            // Let the component unmount cleanup (useEffect) handle it.
            // This prevents the video from freezing/turning black for a few frames before the UI is removed.
          } else {
            setIsCapturing(false); // Reset lock to allow subsequent captures
          }

        } else {
          setIsCapturing(false);
        }
      }, 100); 
    }
  }, [isCapturing, cleanupCamera]);

  useEffect(() => {
    mountedRef.current = true;
    startCamera();
    return () => {
      mountedRef.current = false;
      cleanupCamera();
    };
  }, [startCamera, cleanupCamera]);

  return {
    videoRef,
    error,
    isCapturing,
    captureImage,
    openNativeCamera, // New export for fallback
    hasTorch,
    isTorchOn,
    toggleTorch,
    hasZoom,
    zoomLevel,
    maxZoom,
    setZoom
  };
};
