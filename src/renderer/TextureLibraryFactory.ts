import { errorMessages } from '../constants/errorMessages';
import { TextureFactory } from '../texture/Texture';
import type { Texture, TextureFallback } from '../texture/texture.types';
import type { Renderer } from './renderer.types';

export type TextureLibrary = {
  loadTexture(key: string, url?: string): Promise<Texture>;
  registerTexture(key: string, texture: Texture): void;
  getFallback(textureName: TextureFallback): Texture;
  getTexture(key: string): Texture;
  destroy(): void;
};

function TextureLibraryFactory(renderer: Renderer): TextureLibrary {
  const TextureLib = TextureFactory();
  const textures = new Map<string, Texture>();

  const fallbackTextures = {
    white: TextureLib.createSolidColor([255, 255, 255, 255], renderer.device),
    black: TextureLib.createSolidColor([0, 0, 0, 255], renderer.device),
    // Normal map pointing straight up (0, 0, 1) = (128, 128, 255) in RGB
    normal: TextureLib.createSolidColor([128, 128, 255, 255], renderer.device),
  };

  async function loadTexture(key: string, url?: string): Promise<Texture> {
    if (textures.has(key)) {
      throw new Error(`Texture with key "${key}" already exists in the library`);
    }

    if (!url) return getFallback('white');

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const imageBitmap = await createImageBitmap(blob);

      const texture = TextureLib.fromImageBitmap(imageBitmap, renderer.device);
      textures.set(key, texture);
      return texture;
    } catch (error) {
      console.warn(`Failed to load texture from ${url}:`, error);
      return getFallback('white');
    }
  }

  function registerTexture(key: string, texture: Texture): void {
    textures.set(key, texture);
  }

  function getFallback(textureName: TextureFallback): Texture {
    const fallbackTexture = fallbackTextures[textureName];

    if (!fallbackTexture) {
      throw new Error(errorMessages.missingTextureLibraryFallbacks);
    }

    return fallbackTexture;
  }

  function getTexture(key: string): Texture {
    return textures.get(key) ?? getFallback('white');
  }

  function destroy(): void {
    textures.forEach((texture) => texture.destroy());
    textures.clear();

    for (const key in fallbackTextures) {
      fallbackTextures[key as keyof typeof fallbackTextures].destroy();
    }
  }

  return {
    loadTexture,
    registerTexture,
    getFallback,
    getTexture,
    destroy,
  };
}

export { TextureLibraryFactory };
