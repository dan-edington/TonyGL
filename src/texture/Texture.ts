import type { uuid } from '../core/core.types';
import type {
  TextureColorSpace,
  Texture,
  TextureSubscriber,
  CreateSolidColorTexture,
  CreateTextureFromImageBitmap,
} from './texture.types';

export type TextureOptions = {
  width: number;
  height: number;
  colorSpace?: TextureColorSpace;
};

function TextureFactory() {
  function createTexture(options: TextureOptions): Texture {
    const id = crypto.randomUUID();
    let gpuTexture: GPUTexture | null = null;
    let gpuTextureView: GPUTextureView | null = null;
    const width = options.width;
    const height = options.height;
    const colorSpace = options.colorSpace || 'srgb';
    const format: GPUTextureFormat = colorSpace === 'srgb' ? 'rgba8unorm-srgb' : 'rgba8unorm';
    let _repeat = new Float32Array([1, 1]);
    let isInitialized = false;
    const subscribers: Map<uuid, TextureSubscriber> = new Map();

    function getView(): GPUTextureView {
      if (!gpuTextureView) {
        throw new Error(`Texture ${id} has no view. Initialize first.`);
      }
      return gpuTextureView;
    }

    function destroy() {
      if (gpuTexture) {
        gpuTexture.destroy();
        gpuTexture = null;
        gpuTextureView = null;
      }
    }

    function subscribe(subscriber: TextureSubscriber) {
      if (!subscribers.has(subscriber.id)) {
        subscribers.set(subscriber.id, subscriber);
      }
    }

    function unsubscribe(id: uuid) {
      subscribers.delete(id);
    }

    function publish() {
      subscribers.forEach((subscriber) => subscriber.onTextureUpdate(texture));
    }

    const texture: Texture = {
      id,
      gpuTexture,
      width,
      height,
      format,
      colorSpace,
      isInitialized,
      get repeat() {
        return _repeat;
      },
      set repeat(repeat: Float32Array) {
        _repeat = new Float32Array(repeat);
        publish();
      },
      getView,
      destroy,
      subscribe,
      unsubscribe,
    };

    // Internal helpers for initialization
    function initFromImageBitmap(imageBitmap: ImageBitmap, device: GPUDevice) {
      texture.gpuTexture = device.createTexture({
        size: { width, height },
        format,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        mipLevelCount: 1,
      });
      device.queue.copyExternalImageToTexture({ source: imageBitmap, flipY: true }, { texture: texture.gpuTexture }, [
        width,
        height,
      ]);
      gpuTextureView = texture.gpuTexture.createView();
      texture.isInitialized = true;
    }

    function initFromData(data: Uint8Array, device: GPUDevice) {
      texture.gpuTexture = device.createTexture({
        size: { width, height },
        format,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        mipLevelCount: 1,
      });
      device.queue.writeTexture({ texture: texture.gpuTexture }, data, { bytesPerRow: width * 4 }, { width, height });
      gpuTextureView = texture.gpuTexture.createView();
      texture.isInitialized = true;
    }

    // Attach helpers for factory
    (texture as any)._initFromImageBitmap = initFromImageBitmap;
    (texture as any)._initFromData = initFromData;

    return texture;
  }

  const fromImageBitmap: CreateTextureFromImageBitmap = (imageBitmap, device, colorSpace = 'srgb') => {
    const texture = createTexture({
      width: imageBitmap.width,
      height: imageBitmap.height,
      colorSpace,
    });
    (texture as any)._initFromImageBitmap(imageBitmap, device);
    return texture;
  };

  const createSolidColor: CreateSolidColorTexture = (color, device, colorSpace = 'srgb') => {
    const texture = createTexture({
      width: 1,
      height: 1,
      colorSpace,
    });
    const data = new Uint8Array([color[0], color[1], color[2], color[3]]);
    (texture as any)._initFromData(data, device);
    return texture;
  };

  return {
    createTexture,
    fromImageBitmap,
    createSolidColor,
  };
}

export { TextureFactory };
