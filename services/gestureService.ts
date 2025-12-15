import { FilesetResolver, HandLandmarker, Landmark } from '@mediapipe/tasks-vision';
import { GestureResult } from '../types';

let handLandmarker: HandLandmarker | null = null;

export const initializeHandLandmarker = async (): Promise<void> => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 1
  });
};

export const detectGesture = (video: HTMLVideoElement, timestamp: number): GestureResult => {
  if (!handLandmarker) return { gesture: 'None', confidence: 0 };

  const result = handLandmarker.detectForVideo(video, timestamp);
  
  if (result.landmarks && result.landmarks.length > 0) {
    const landmarks = result.landmarks[0];
    return analyzeHand(landmarks);
  }

  return { gesture: 'None', confidence: 0 };
};

const distance = (a: Landmark, b: Landmark) => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2));
};

const analyzeHand = (landmarks: Landmark[]): GestureResult => {
  // Keypoints
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  const indexBase = landmarks[5];

  // 1. PINCH DETECTION (Thumb tip close to Index tip)
  const pinchDist = distance(thumbTip, indexTip);
  // Normalize by hand size (wrist to index base)
  const handSize = distance(wrist, indexBase); 
  
  if (pinchDist < handSize * 0.2) {
    return { gesture: 'Pinch', confidence: 0.9 };
  }

  // 2. FIST DETECTION (Fingertips close to wrist/palm base)
  const fingersFolded = [indexTip, middleTip, ringTip, pinkyTip].every(tip => {
    return distance(tip, wrist) < handSize * 0.9; 
  });

  if (fingersFolded) {
    return { gesture: 'Fist', confidence: 0.9 };
  }

  // 3. OPEN PALM (Fingers extended)
  const fingersExtended = [indexTip, middleTip, ringTip, pinkyTip].every(tip => {
    return distance(tip, wrist) > handSize * 1.5;
  });

  if (fingersExtended) {
    return { gesture: 'Open_Palm', confidence: 0.9 };
  }

  return { gesture: 'None', confidence: 0 };
};