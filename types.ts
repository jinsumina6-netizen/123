import { Vector3, Quaternion } from 'three';

export enum AppMode {
  TREE = 'TREE',
  SCATTER = 'SCATTER',
  FOCUS = 'FOCUS',
}

export interface ParticleData {
  id: string;
  type: 'ornament' | 'photo';
  meshType: 'sphere' | 'box' | 'gem' | 'candyCane' | 'giftBox' | 'gingerbread' | 'santaHat';
  color: string;
  position: Vector3; // Current rendered position (managed by refs usually, but here for init)
  treePos: Vector3;
  scatterPos: Vector3;
  focusPos: Vector3;
  rotation: Quaternion;
  scale: number;
  imageUrl?: string;
  aspectRatio?: number;
}

export interface GestureResult {
  gesture: 'Fist' | 'Open_Palm' | 'Pinch' | 'None';
  confidence: number;
}