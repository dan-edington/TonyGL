import { SamplerConfig, SamplerLibrary } from './renderer.types';
import type { Renderer } from './renderer.types';

function SamplerLibraryFactory(renderer: Renderer): SamplerLibrary {
  const samplers = new Map<string, GPUSampler>();

  function createSampler(key: string, config: SamplerConfig): GPUSampler {
    if (samplers.has(key)) throw new Error(`Sampler with key "${key}" already exists in the library`);

    const sampler = renderer.device.createSampler({
      magFilter: config.magFilter ?? 'linear',
      minFilter: config.minFilter ?? 'linear',
      mipmapFilter: config.mipmapFilter,
      addressModeU: config.addressModeU ?? 'repeat',
      addressModeV: config.addressModeV ?? 'repeat',
      compare: config.compare,
    });

    samplers.set(key, sampler);

    return sampler;
  }

  function getSampler(key: string): GPUSampler | undefined {
    return samplers.get(key);
  }

  // Linear interpolation, repeat wrapping
  createSampler('linearRepeat', {
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'linear',
    addressModeU: 'repeat',
    addressModeV: 'repeat',
  });

  // Linear interpolation, clamp wrapping
  createSampler('linearClamp', {
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'linear',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
  });

  // Nearest neighbor, repeat wrapping
  createSampler('nearestRepeat', {
    magFilter: 'nearest',
    minFilter: 'nearest',
    addressModeU: 'repeat',
    addressModeV: 'repeat',
  });

  // Nearest neighbor, clamp wrapping
  createSampler('nearestClamp', {
    magFilter: 'nearest',
    minFilter: 'nearest',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
  });

  return {
    createSampler,
    getSampler,
  };
}

export { SamplerLibraryFactory };
