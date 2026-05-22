import type { Entity, UniformBuffer } from '../core/core.types';

export type PerspectiveCamera = Entity & {
  near: number;
  far: number;
  fov: number;
  aspect: number;
  projectionMatrix: Float32Array;
  viewMatrix: Float32Array;
  viewProjectionMatrix: Float32Array;
  cameraUniformsBuffer: UniformBuffer;
  cameraUniformsBindGroup: GPUBindGroup;
  lookAt(target: ArrayLike<number>, up?: ArrayLike<number>): void;
  updateCameraUniforms(): void;
  updateProjectionMatrix(): void;
  destroy(): void;
};

export type OrbitControls = {
  camera: PerspectiveCamera;
  domElement: HTMLElement;
  target: Float32Array;
  isDragging: boolean;
  destroy(): void;
};
