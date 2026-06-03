import type { uuid } from '../core/core.types';
import { Renderer } from '../renderer/renderer.types';
import type { TextureColorSpace, Texture, TextureSubscriber } from './texture.types';

export type CreateTextureResourceOptions = {
  width: number;
  height: number;
  colorSpace?: TextureColorSpace;
};

export type CreateTextureFromDataOptions = {
  width: number;
  height: number;
  textureData: ImageBitmap | [number, number, number] | [number, number, number, number];
  colorSpace?: TextureColorSpace;
};

function Texture(renderer: Renderer) {
  function createTextureResource(options: CreateTextureResourceOptions): Texture {
    const colorSpace = options.colorSpace || 'srgb';
    const format: GPUTextureFormat = colorSpace === 'srgb' ? 'rgba8unorm-srgb' : 'rgba8unorm';

    const self: Texture = {
      id: crypto.randomUUID(),
      width: options.width,
      height: options.height,
      colorSpace,
      format,
      repeat: new Float32Array([1, 1]),
      subscribers: new Map<uuid, TextureSubscriber>(),
      gpuTexture: null,
      gpuTextureView: null,
      destroy,
      setRepeat,
      subscribe,
      unsubscribe,
    };

    function destroy() {
      if (self.gpuTexture) {
        self.gpuTexture.destroy();
        self.gpuTexture = null;
        self.gpuTextureView = null;
      }
    }

    function subscribe(subscriber: TextureSubscriber) {
      if (!self.subscribers.has(subscriber.id)) {
        self.subscribers.set(subscriber.id, subscriber);
      }
    }

    function unsubscribe(id: uuid) {
      self.subscribers.delete(id);
    }

    function publish() {
      self.subscribers.forEach((subscriber) => subscriber.onTextureUpdate(self));
    }

    function setRepeat(value: ArrayLike<number>) {
      self.repeat.set([value[0], value[1]]);
      publish();
    }

    return self;
  }

  function createTexture(options: CreateTextureFromDataOptions): Texture {
    const { width, height, textureData, colorSpace = 'srgb' } = options;

    const self = createTextureResource({ width, height, colorSpace });

    if (textureData instanceof ImageBitmap) {
      self.gpuTexture = renderer.device.createTexture({
        size: { width, height },
        format: self.format,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        mipLevelCount: 1,
      });

      renderer.device.queue.copyExternalImageToTexture(
        { source: textureData, flipY: true },
        { texture: self.gpuTexture },
        [width, height],
      );

      self.gpuTextureView = self.gpuTexture.createView();
    } else if (Array.isArray(textureData)) {
      const colorData = new Uint8Array(textureData.length === 4 ? [...textureData] : [...textureData, 1]);

      self.gpuTexture = renderer.device.createTexture({
        size: { width, height },
        format: self.format,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        mipLevelCount: 1,
      });

      renderer.device.queue.writeTexture(
        { texture: self.gpuTexture },
        colorData,
        { bytesPerRow: width * 4 },
        { width, height },
      );

      self.gpuTextureView = self.gpuTexture.createView();
    }

    return self;
  }

  return createTexture;
}

export { Texture };
