import { Mesh } from '../modules';

export type RaycasterOptions = {
  origin: Float32Array;
  direction: Float32Array;
  near?: number;
  far?: number;
};

export type RaycasterObject = {
  origin: Float32Array;
  direction: Float32Array;
  near: number;
  far: number;
  set: (options: Partial<RaycasterOptions>) => void;
  intersect: (object: Mesh) => RaycastResult[] | null;
};

export type Ray = {
  direction: ArrayLike<number>;
  origin: ArrayLike<number>;
};

export type RaycastResult = {
  distance: number;
  point: Float32Array;
  triangleIndex: number;
  uv: [number, number];
};
