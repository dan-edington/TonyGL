import type { Entity, EntityOptions, UniformBuffer } from '../core/core.types';

export type CameraOptions = Omit<EntityOptions, 'type'>;

export type Camera = Entity & {
  near: number;
  far: number;
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

export type PerspectiveCamera = Camera & {
  fov: number;
};

export type PerspectiveCameraOptions = CameraOptions & {
  near?: number;
  far?: number;
  fov?: number;
  aspect?: number;
};

export type OrthographicCamera = Camera & {
  left: number;
  right: number;
  bottom: number;
  top: number;
};

export type OrthographicCameraOptions = Omit<EntityOptions, 'type'> & {
  left?: number;
  right?: number;
  bottom?: number;
  top?: number;
  near?: number;
  far?: number;
};

export type OrbitControls = {
  camera: PerspectiveCamera;
  domElement: HTMLElement;
  target: Float32Array;
  isDragging: boolean;
  destroy(): void;
};
