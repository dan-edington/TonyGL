import type { uuid } from '../core/core.types';

export type TextureColorSpace = 'srgb' | 'linear' | 'data';

export type TextureFallback = 'white' | 'black' | 'normal';

export interface TextureSubscriber {
  id: uuid;
  onTextureUpdate(texture: Texture): void;
}

export interface Texture {
  id: uuid;
  gpuTexture: GPUTexture | null;
  width: number;
  height: number;
  format: GPUTextureFormat;
  repeat: Float32Array;
  colorSpace: TextureColorSpace;
  isInitialized: boolean;
  getView(): GPUTextureView;
  destroy(): void;
  subscribe(subscriber: TextureSubscriber): void;
  unsubscribe(id: uuid): void;
}

export type CreateTextureFromImageBitmap = (
  imageBitmap: ImageBitmap,
  device: GPUDevice,
  colorSpace?: TextureColorSpace,
) => Texture;

export type CreateSolidColorTexture = (
  color: [number, number, number, number],
  device: GPUDevice,
  colorSpace?: TextureColorSpace,
) => Texture;
