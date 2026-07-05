import type { Entity } from '../core/core.types';
import type { Geometry } from '../geometry/geometry.types';

export type RaycastTarget = Entity & {
  geometry?: Geometry;
};

export type RaycastOptions = {
  recursive?: boolean;
};

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
  intersect: (objects: RaycastTarget | RaycastTarget[], options?: RaycastOptions) => RaycastResult[] | null;
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
  object: RaycastTarget;
};
