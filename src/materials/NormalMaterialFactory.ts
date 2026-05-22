import { BaseMaterialFactory, MaterialFlags } from './BaseMaterialFactory';
import type { CreateUniformBufferFunction, UniformBuffer } from '../core/core.types';
import type { Renderer } from '../renderer/renderer.types';
import type { BaseMaterial } from './materials.types';

export type NormalMaterial = BaseMaterial;

export type NormalMaterialOptions = {
  normalTexture?: any | null;
  doubleSided?: boolean;
  depthWrite?: boolean;
};

function NormalMaterialFactory(renderer: Renderer, createUniformBuffer: CreateUniformBufferFunction) {
  const { createBaseMaterial } = BaseMaterialFactory(renderer, createUniformBuffer);

  function createNormalMaterial(options: NormalMaterialOptions = {}): NormalMaterial {
    const normalTexture = options.normalTexture ?? renderer.textureLibrary.getFallback('normal');
    const sampler = renderer.samplerLibrary.getSampler('linearRepeat');
    if (!sampler) throw new Error('Normal material sampler not found.');

    let materialFlags = MaterialFlags.None;

    if (options.normalTexture) {
      materialFlags |= MaterialFlags.Normal;
    }

    const normalMaterial = createBaseMaterial<NormalMaterial>({
      type: 'normal',
      shader: 'normal',
      transparent: false,
      doubleSided: options.doubleSided ?? false,
      depthWrite: options.depthWrite ?? true,
      uniforms: {
        materialFlags: { type: 'u32', value: materialFlags },
      },
      buildBindGroupEntries(materialUniformsBuffer: UniformBuffer | null) {
        if (!materialUniformsBuffer?.buffer) return [];
        return [
          { binding: 0, resource: { buffer: materialUniformsBuffer.buffer } },
          { binding: 1, resource: normalTexture.getView() },
          { binding: 2, resource: sampler },
        ];
      },
    });

    return normalMaterial;
  }

  return { createNormalMaterial };
}

const normalMaterialLayoutDescriptor: GPUBindGroupLayoutDescriptor = {
  label: 'NormalMaterial Bind Group Layout',
  entries: [
    { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
    { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} },
    { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
  ],
};

export { NormalMaterialFactory, normalMaterialLayoutDescriptor };
