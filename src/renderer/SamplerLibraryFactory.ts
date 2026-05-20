import { SamplerDescriptorKey } from '../types';
import { Renderer } from './configureRenderer';

type SamplerConfig = {
  magFilter?: GPUFilterMode;
  minFilter?: GPUFilterMode;
  mipmapFilter?: GPUMipmapFilterMode;
  addressModeU?: GPUAddressMode;
  addressModeV?: GPUAddressMode;
  compare?: GPUCompareFunction;
};

export type SamplerLibrary = {
  createSampler(key: SamplerDescriptorKey, config: SamplerConfig): GPUSampler;
  getSampler(key: SamplerDescriptorKey): GPUSampler | undefined;
};

function SamplerLibraryFactory(renderer: Renderer): SamplerLibrary {
  const samplers = new Map<SamplerDescriptorKey, GPUSampler>();

  function createSampler(key: SamplerDescriptorKey, config: SamplerConfig): GPUSampler {
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

  function getSampler(key: SamplerDescriptorKey): GPUSampler | undefined {
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
