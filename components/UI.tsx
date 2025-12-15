import React, { useRef, useEffect } from 'react';
import { AppMode, GestureResult } from '../types';
import { Upload, Camera, Sparkles, Maximize, MousePointer2 } from 'lucide-react';

interface UIProps {
  mode: AppMode;
  loading: boolean;
  gesture: GestureResult;
  onUpload: (files: FileList) => void;
  webcamRef: React.RefObject<HTMLVideoElement>;
  cameraActive: boolean;
  setCameraActive: (active: boolean) => void;
}

export const UI: React.FC<UIProps> = ({ 
  mode, 
  loading, 
  gesture, 
  onUpload, 
  webcamRef, 
  cameraActive, 
  setCameraActive 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  };

  if (loading) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black text-amber-100">
        <h1 className="text-4xl mb-4 tracking-widest luxury-font animate-pulse">GRAND LUXURY TREE</h1>
        <div className="w-16 h-16 border-t-2 border-amber-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm opacity-70">Initializing Neural Engine & 3D Environment...</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-6 overflow-hidden">
      
      {/* Header */}
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl text-amber-100 luxury-font tracking-widest drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
            GRAND LUXURY TREE
          </h1>
          <p className="text-amber-200/50 text-xs tracking-wider uppercase mt-1">
            Current Mode: <span className="text-amber-400 font-bold">{mode}</span>
          </p>
        </div>
        
        <div className="flex gap-4 pointer-events-auto">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-amber-500/30 text-amber-100 rounded hover:bg-amber-900/40 transition-colors backdrop-blur-md"
           >
             <Upload size={16} /> <span className="text-sm font-light">Add Photos</span>
           </button>
           <input 
             type="file" 
             multiple 
             accept="image/*" 
             ref={fileInputRef} 
             className="hidden" 
             onChange={handleFileChange} 
           />
        </div>
      </header>

      {/* Center Feedback (Gesture) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
         {gesture.gesture !== 'None' && (
           <div className="animate-ping absolute inset-0 rounded-full bg-amber-500/10 scale-150"></div>
         )}
         {gesture.gesture !== 'None' && (
           <div className="text-2xl text-amber-300 font-bold bg-black/50 px-4 py-2 rounded backdrop-blur border border-amber-500/50 animate-bounce">
             {gesture.gesture === 'Fist' && 'TREE MODE'}
             {gesture.gesture === 'Open_Palm' && 'SCATTER'}
             {gesture.gesture === 'Pinch' && 'FOCUS'}
           </div>
         )}
      </div>

      {/* Footer / Controls */}
      <footer className="flex justify-between items-end">
        
        {/* Webcam Preview */}
        <div className="relative w-48 h-36 bg-black/80 rounded border border-amber-900/50 overflow-hidden pointer-events-auto">
          {!cameraActive && (
             <button 
               onClick={() => setCameraActive(true)}
               className="absolute inset-0 flex flex-col items-center justify-center text-amber-100/50 hover:text-amber-100 transition-colors"
             >
               <Camera size={24} />
               <span className="text-xs mt-2">Enable Gesture Control</span>
             </button>
          )}
          <video 
            ref={webcamRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover transform -scale-x-100 ${!cameraActive ? 'hidden' : ''}`} 
          />
          {cameraActive && (
             <div className="absolute bottom-1 left-1 bg-black/60 px-2 py-0.5 rounded text-[10px] text-green-400 font-mono">
                AI ACTIVE
             </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-right text-amber-100/70 space-y-2">
           <div className="flex items-center justify-end gap-2">
             <span className="text-xs uppercase tracking-wide">Fist</span>
             <div className="w-6 h-6 border border-amber-500/50 rounded flex items-center justify-center bg-amber-500/10">
               <span className="block w-2 h-2 bg-amber-500 rounded-full"></span>
             </div>
             <span className="text-xs text-amber-100/40">Form Tree</span>
           </div>
           <div className="flex items-center justify-end gap-2">
             <span className="text-xs uppercase tracking-wide">Open Palm</span>
             <div className="w-6 h-6 border border-amber-500/50 rounded flex items-center justify-center bg-amber-500/10">
               <Maximize size={12} className="text-amber-500"/>
             </div>
             <span className="text-xs text-amber-100/40">Scatter</span>
           </div>
           <div className="flex items-center justify-end gap-2">
             <span className="text-xs uppercase tracking-wide">Pinch</span>
             <div className="w-6 h-6 border border-amber-500/50 rounded flex items-center justify-center bg-amber-500/10">
               <MousePointer2 size={12} className="text-amber-500"/>
             </div>
             <span className="text-xs text-amber-100/40">Focus</span>
           </div>
        </div>

      </footer>
    </div>
  );
};