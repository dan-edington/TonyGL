import type { uuid } from '../core/core.types';

export type Geometry = {
  id: uuid;
  name: string;
  type: 'Geometry';
  isIndexed: boolean;
  indexCount: number;
  indexFormat: GPUIndexFormat | null;
  topology: GPUPrimitiveTopology;
  vertices: Float32Array;
  indices: Uint16Array | Uint32Array | null;
  normals: Float32Array;
  uvs: Float32Array;
  tangents: Float32Array;
  vertexBuffer: GPUBuffer | null;
  indexBuffer: GPUBuffer | null;
  normalBuffer: GPUBuffer | null;
  tangentBuffer: GPUBuffer | null;
  uvBuffer: GPUBuffer | null;
  boundingBox: BoundingBox;
  boundingSphere: BoundingSphere;
  destroy: () => void;
};

export type GeometryOptions = {
  name?: string;
  vertices: Float32Array;
  indices?: Uint16Array | Uint32Array;
  normals?: Float32Array;
  uvs?: Float32Array;
  topology?: GPUPrimitiveTopology;
};

export type BoundingBox = {
  min: Float32Array;
  max: Float32Array;
};

export type BoundingSphere = {
  radius: number;
  center: Float32Array;
};

export type Bounds = {
  boundingSphere: BoundingSphere;
  boundingBox: BoundingBox;
};
