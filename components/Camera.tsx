
import React, { useRef, useState } from 'react';
import { useCamera } from '../hooks/useCamera';
import { Language } from '../types';
import { translations } from '../utils/translations';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
  lang: Language;
}

export const Camera: React.FC<CameraProps> = ({ onCapture, onClose, lang }) => {
  const t = translations[lang];
  const { 
    videoRef, 
    error, 
    isCapturing, 
    captureImage,
    openNativeCamera,
    hasTorch,
    isTorchOn,
    toggleTorch
  } = useCamera();

  // Multi-capture Logic
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressHandled = useRef(false);
  const [showAddedToast, setShowAddedToast] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Constants
  const LONG_PRESS_DURATION = 800; // ms

  const handlePressStart = (e: React.TouchEvent | React.MouseEvent) => {
    // Prevent default to avoid ghost clicks on some mobile browsers
    if (e.type === 'touchstart') {
      // e.preventDefault(); 
    }
    
    isLongPressHandled.current = false;

    pressTimer.current = setTimeout(() => {
      // LONG PRESS ACTION: Capture and Stay
      isLongPressHandled.current = true;
      captureImage(onCapture, false); // false = Do NOT close camera
      
      // Visual feedback
      setShowAddedToast(true);
      setTimeout(() => setShowAddedToast(false), 2000);
      
    }, LONG_PRESS_DURATION);
  };

  const handlePressEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (e.type === 'touchend') e.preventDefault(); 
    
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }

    if (!isLongPressHandled.current) {
      // SHORT PRESS ACTION: Capture and Close
      captureImage((src) => {
        onCapture(src);
        // Add slight delay (100ms) to ensure smooth transition and avoid flicker on weak devices
        setTimeout(() => {
          onClose();
        }, 100);
      }, true); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center animate-fade-in" dir="ltr">
      {/* Hide default video controls explicitly to prevent 'play' button overlay */}
      <style>{`
        video::-webkit-media-controls,
        video::-webkit-media-controls-start-playback-button,
        video::-webkit-media-controls-play-button,
        video::-webkit-media-controls-overlay-play-button,
        video::-webkit-media-controls-enclosure {
          display: none !important;
          -webkit-appearance: none;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        .no-select {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
      `}</style>

      {/* Visual Flash Effect - Updated for gentler experience */}
      <div 
        className={`absolute inset-0 bg-white pointer-events-none z-30 transition-opacity duration-200 ease-out ${isCapturing ? 'opacity-30' : 'opacity-0'}`} 
      />

      {/* Internal Toast for Multi-Capture */}
      <div className={`absolute top-24 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-300 ${showAddedToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 backdrop-blur-sm bg-opacity-90">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
           </svg>
           <span className="font-bold text-sm">{t.imgAdded}</span>
        </div>
      </div>

      {error ? (
        <div className="text-white p-6 text-center max-w-sm bg-gray-900 rounded-3xl mx-4 shadow-2xl border border-gray-700 animate-slide-up z-40" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2 text-white">{t.cameraErrorTitle}</h3>
          <p className="mb-6 font-medium leading-relaxed text-gray-400 text-sm">
            {error}
          </p>
          
          <button 
            onClick={() => openNativeCamera(onCapture)}
            className="bg-emerald-600 text-white w-full py-4 rounded-xl font-bold hover:bg-emerald-700 transition active:scale-95 mb-3 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 text-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
            {t.useNativeCamera}
          </button>

          <button 
            onClick={onClose}
            className="bg-white/10 text-white w-full py-3 rounded-xl font-bold hover:bg-white/20 transition active:scale-95"
          >
            {t.close}
          </button>
        </div>
      ) : (
        <>
          <div className="relative w-full h-full flex flex-col bg-black">
             {/* Video Element */}
             {/* Note: We hide the video until it's playing to prevent the grey 'play button' artifact on Android */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              controls={false}
              onPlaying={() => setIsVideoReady(true)}
              className={`w-full h-full object-cover transition-opacity duration-300 pointer-events-none ${isVideoReady ? 'opacity-100' : 'opacity-0'}`}
            />
            
            {/* Top Bar: Close & Flash */}
            <div className="absolute top-[env(safe-area-inset-top)] left-0 right-0 p-4 mt-2 z-20 flex justify-between items-start px-6">
               {/* Flash Toggle */}
               {hasTorch ? (
                 <button 
                  onClick={toggleTorch}
                  className={`p-3 rounded-full backdrop-blur-md transition active:scale-90 ${isTorchOn ? 'bg-yellow-400 text-yellow-900 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'bg-black/30 text-white'}`}
                  aria-label={t.flashToggle}
                 >
                   {isTorchOn ? (
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
                     </svg>
                   ) : (
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                     </svg>
                   )}
                 </button>
               ) : <div className="w-12"></div>}

               <button 
                onClick={onClose}
                disabled={isCapturing}
                className="text-white p-3 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 transition active:scale-90"
                aria-label={t.closeCamera}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Guide Frame */}
            <div className={`absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-200 ${isCapturing ? 'opacity-0' : 'opacity-100'}`}>
               <div className="relative">
                 {/* Main Frame Box - Removed border-white/40 */}
                 <div className="w-72 h-72 rounded-3xl relative bg-transparent">
                   {/* Corners */}
                   <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl -mt-1 -ml-1 shadow-sm"></div>
                   <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl -mt-1 -mr-1 shadow-sm"></div>
                   <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl -mb-1 -ml-1 shadow-sm"></div>
                   <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl -mb-1 -mr-1 shadow-sm"></div>
                 </div>
               </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] flex flex-col justify-center items-center z-10 space-y-3">
              <button 
                onMouseDown={handlePressStart}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={handlePressStart}
                onTouchEnd={handlePressEnd}
                disabled={isCapturing}
                className={`w-20 h-20 rounded-full border-[5px] flex items-center justify-center transition-all shadow-2xl backdrop-blur-sm group no-select
                  ${isCapturing 
                    ? 'border-white/50 bg-white/40 scale-95 cursor-wait' 
                    : 'border-white/30 bg-white/20 hover:bg-white/30 active:scale-95 cursor-pointer'
                  }`}
                aria-label={t.captureHint}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className={`w-16 h-16 rounded-full bg-white shadow-inner border border-gray-200 transition-all duration-200 ${isCapturing ? 'scale-75 opacity-80' : 'group-active:scale-90'}`}></div>
              </button>
              
              <p className="text-white/60 text-xs font-medium text-center drop-shadow-md">
                {t.captureHint}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
