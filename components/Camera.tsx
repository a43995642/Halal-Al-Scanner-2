import React from 'react';
import { useCamera } from '../hooks/useCamera';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
}

export const Camera: React.FC<CameraProps> = ({ onCapture, onClose }) => {
  const { 
    videoRef, 
    error, 
    isCapturing, 
    captureImage,
    hasTorch,
    isTorchOn,
    toggleTorch,
    hasZoom,
    zoomLevel,
    maxZoom,
    setZoom
  } = useCamera();

  const handleTakePhoto = () => {
    captureImage(onCapture);
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(parseFloat(e.target.value));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center animate-fade-in">
      {/* Visual Flash Effect */}
      <div 
        className={`absolute inset-0 bg-white pointer-events-none z-30 transition-opacity duration-150 ease-out ${isCapturing ? 'opacity-80' : 'opacity-0'}`} 
      />

      {error ? (
        <div className="text-white p-6 text-center max-w-sm bg-gray-800 rounded-2xl mx-4 shadow-2xl border border-gray-700 animate-slide-up z-40">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="mb-6 font-medium leading-relaxed text-gray-200">{error}</p>
          <button 
            onClick={onClose}
            className="bg-white text-black w-full py-3 rounded-xl font-bold hover:bg-gray-100 transition active:scale-95"
          >
            إغلاق
          </button>
        </div>
      ) : (
        <>
          <div className="relative w-full h-full flex flex-col bg-black">
             {/* Video Element */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            
            {/* Top Bar: Close & Flash */}
            <div className="absolute top-[env(safe-area-inset-top)] left-0 right-0 p-4 mt-2 z-20 flex justify-between items-start px-6">
               {/* Flash Toggle */}
               {hasTorch ? (
                 <button 
                  onClick={toggleTorch}
                  className={`p-3 rounded-full backdrop-blur-md transition active:scale-90 ${isTorchOn ? 'bg-yellow-400 text-yellow-900 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'bg-black/30 text-white'}`}
                  aria-label="تبديل الفلاش"
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
                aria-label="إغلاق الكاميرا"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Guide Frame */}
            <div className={`absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-200 ${isCapturing ? 'opacity-0' : 'opacity-100'}`}>
               <div className="relative">
                 {/* Main Frame Box */}
                 <div className="w-72 h-72 border-2 border-white/30 rounded-3xl relative bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                   {/* Corners */}
                   <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl -mt-1 -ml-1 shadow-sm"></div>
                   <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl -mt-1 -mr-1 shadow-sm"></div>
                   <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl -mb-1 -ml-1 shadow-sm"></div>
                   <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl -mb-1 -mr-1 shadow-sm"></div>
                 </div>
                 
                 {/* Zoom Slider (Only if supported) */}
                 {hasZoom && (
                   <div className="absolute -bottom-28 w-full flex flex-col items-center pointer-events-auto">
                      <div className="flex items-center gap-4 w-64 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full">
                         <span className="text-white text-xs font-bold">1x</span>
                         <input 
                            type="range" 
                            min="1" 
                            max={maxZoom} 
                            step="0.1" 
                            value={zoomLevel} 
                            onChange={handleZoomChange}
                            className="w-full h-1 bg-gray-500 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                         />
                         <span className="text-white text-xs font-bold">{Math.round(maxZoom)}x</span>
                      </div>
                   </div>
                 )}
               </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] flex justify-center items-center z-10">
              <button 
                onClick={handleTakePhoto}
                disabled={isCapturing}
                className={`w-20 h-20 rounded-full border-[5px] flex items-center justify-center transition-all shadow-2xl backdrop-blur-sm group
                  ${isCapturing 
                    ? 'border-white/50 bg-white/40 scale-95 cursor-wait' 
                    : 'border-white/30 bg-white/20 hover:bg-white/30 active:scale-95 cursor-pointer'
                  }`}
                aria-label="التقاط صورة"
              >
                <div className={`w-16 h-16 rounded-full bg-white shadow-inner border border-gray-200 transition-all duration-200 ${isCapturing ? 'scale-75 opacity-80' : 'group-active:scale-90'}`}></div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};