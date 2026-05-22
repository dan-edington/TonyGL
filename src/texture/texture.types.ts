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
  gpuTextureView: GPUTextureView | null;
  width: number;
  height: number;
  format: GPUTextureFormat;
  repeat: Float32Array;
  colorSpace: TextureColorSpace;
  subscribers: Map<uuid, TextureSubscriber>;
  setRepeat(value: ArrayLike<number>): void;
  destroy(): void;
  subscribe(subscriber: TextureSubscriber): void;
  unsubscribe(id: uuid): void;
}
