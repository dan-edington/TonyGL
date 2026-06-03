import { errorMessages } from '../constants/errorMessages';
import { Texture } from '../texture/Texture';
import type { Texture as TextureType, TextureFallback } from '../texture/texture.types';
import type { Renderer } from './renderer.types';

export type TextureLibrary = {
  loadTexture(key: string, url?: string): Promise<TextureType>;
  registerTexture(key: string, texture: TextureType): void;
  getFallback(textureName: TextureFallback): TextureType;
  getTexture(key: string): TextureType;
  destroy(): void;
};

function TextureLibraryFactory(renderer: Renderer): TextureLibrary {
  const createTexture = Texture(renderer);
  const textures = new Map<string, TextureType>();

  const fallbackTextures = {
    white: createTexture({ textureData: [255, 255, 255, 255], width: 1, height: 1 }),
    black: createTexture({ textureData: [0, 0, 0, 255], width: 1, height: 1 }),
    // Normal map pointing straight up (0, 0, 1) = (128, 128, 255) in RGB
    normal: createTexture({ textureData: [128, 128, 255, 255], width: 1, height: 1 }),
  };

  async function loadTexture(key: string, url?: string): Promise<TextureType> {
    if (textures.has(key)) {
      throw new Error(`Texture with key "${key}" already exists in the library`);
    }

    if (!url) return getFallback('white');

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const imageBitmap = await createImageBitmap(blob);
      const texture = createTexture({
        textureData: imageBitmap,
        width: imageBitmap.width,
        height: imageBitmap.height,
      });
      textures.set(key, texture);
      return texture;
    } catch (error) {
      console.warn(`Failed to load texture from ${url}:`, error);
      return getFallback('white');
    }
  }

  function registerTexture(key: string, texture: TextureType): void {
    textures.set(key, texture);
  }

  function getFallback(textureName: TextureFallback): TextureType {
    const fallbackTexture = fallbackTextures[textureName];

    if (!fallbackTexture) {
      throw new Error(errorMessages.missingTextureLibraryFallbacks);
    }

    return fallbackTexture;
  }

  function getTexture(key: string): TextureType {
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
