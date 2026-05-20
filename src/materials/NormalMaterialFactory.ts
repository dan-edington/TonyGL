import type { Renderer } from '../renderer/configureRenderer';
import type { CreateUniformBufferFunction, UniformBuffer } from '../core/UniformBufferFactory';
import { MaterialFlags } from './MaterialsFactory';
import type { BaseMaterial } from './MaterialsFactory';
import { BaseMaterialFactory } from './BaseMaterialFactory';

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
    return createBaseMaterial({
      type: 'normal',
      shader: 'normal',
      transparent: false,
      doubleSided: options.doubleSided ?? false,
      depthWrite: options.depthWrite ?? true,
      uniforms: {
        materialFlags: { type: 'u32', value: MaterialFlags.None },
      },
      buildEntries(materialUniformsBuffer: UniformBuffer | null) {
        if (!materialUniformsBuffer?.buffer) return [];
        return [
          { binding: 0, resource: { buffer: materialUniformsBuffer.buffer } },
          { binding: 1, resource: normalTexture.getView() },
          { binding: 2, resource: sampler },
        ];
      },
    });
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
