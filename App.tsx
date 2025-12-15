import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { EnvironmentEffects } from './components/Environment';
import { TreeParticles } from './components/TreeParticles';
import { UI } from './components/UI';
import { AppMode, GestureResult } from './types';
import { initializeHandLandmarker, detectGesture } from './services/gestureService';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<AppMode>(AppMode.TREE);
  const [photos, setPhotos] = useState<string[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [lastGesture, setLastGesture] = useState<GestureResult>({ gesture: 'None', confidence: 0 });
  
  const webcamRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number>(0);
  const lastGestureTime = useRef<number>(0);

  // Initialize AI and Camera
  useEffect(() => {
    const init = async () => {
      await initializeHandLandmarker();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (cameraActive && webcamRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
          webcamRef.current.onloadeddata = predictWebcam;
        }
      }).catch(err => {
        console.error("Camera access denied:", err);
        setCameraActive(false);
      });
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [cameraActive]);

  const predictWebcam = () => {
    if (!webcamRef.current) return;
    
    // Throttle prediction to save battery? We run it every frame but throttle the state update slightly for stability
    const result = detectGesture(webcamRef.current, Date.now());
    
    // Simple debouncing/cooldown logic for state switching
    const now = Date.now();
    if (now - lastGestureTime.current > 1000 && result.confidence > 0.8) {
      if (result.gesture === 'Fist' && mode !== AppMode.TREE) {
        setMode(AppMode.TREE);
        lastGestureTime.current = now;
      } else if (result.gesture === 'Open_Palm' && mode !== AppMode.SCATTER) {
        setMode(AppMode.SCATTER);
        lastGestureTime.current = now;
      } else if (result.gesture === 'Pinch' && mode !== AppMode.FOCUS) {
        setMode(AppMode.FOCUS);
        lastGestureTime.current = now;
      }
    }
    
    if (result.confidence > 0.6) {
        setLastGesture(result);
    } else {
        setLastGesture({ gesture: 'None', confidence: 0 });
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  const handleUpload = (files: FileList) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Use Promise.all to read all files first, then update state once
    // This prevents flickering and multiple re-renders
    const fileReaders = fileArray.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result && typeof e.target.result === 'string') {
            resolve(e.target.result);
          } else {
            resolve('');
          }
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(fileReaders).then(results => {
      const validPhotos = results.filter(r => r.length > 0);
      if (validPhotos.length > 0) {
        setPhotos(prev => [...prev, ...validPhotos]);
        // Optional: Switch to TREE mode to see new photos if not already
        if (mode === AppMode.SCATTER) {
           setMode(AppMode.TREE);
        }
      }
    });
  };

  return (
    <div className="w-full h-screen relative bg-black">
      <UI 
        mode={mode} 
        loading={loading}
        gesture={lastGesture}
        onUpload={handleUpload}
        webcamRef={webcamRef}
        cameraActive={cameraActive}
        setCameraActive={setCameraActive}
      />
      
      {!loading && (
        <Canvas 
          camera={{ position: [0, 5, 25], fov: 60 }} 
          gl={{ antialias: false }} // Post-processing handles AA usually, or better performance without
          dpr={[1, 1.5]} // Cap DPR for performance
        >
          <color attach="background" args={['#050a10']} />
          <fog attach="fog" args={['#050a10', 20, 50]} />
          
          <EnvironmentEffects />
          
          <Suspense fallback={null}>
             <TreeParticles mode={mode} photos={photos} />
          </Suspense>

          <EffectComposer disableNormalPass>
            <Bloom 
              luminanceThreshold={0.8} // Only very bright things glow
              luminanceSmoothing={0.5} 
              height={300} 
              intensity={2.5} // Strong glow
            />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Canvas>
      )}
    </div>
  );
};

export default App;