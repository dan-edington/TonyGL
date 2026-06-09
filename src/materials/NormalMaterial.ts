import { BaseMaterialFactory, MaterialFlags } from './BaseMaterialFactory';
import type { UniformBuffer } from '../core/core.types';
import type { NormalMaterial as NormalMaterialType } from './materials.types';
import { TonyModuleContext } from '../TonyGL.types';

export type NormalMaterialOptions = {
  normalTexture?: any | null;
  doubleSided?: boolean;
  depthWrite?: boolean;
};

function NormalMaterial(context: TonyModuleContext) {
  const { renderer, createUniformBuffer, registerMaterialLayoutDescriptor } = context;

  const { createBaseMaterial } = BaseMaterialFactory(renderer);

  const normalMaterialLayoutDescriptor: GPUBindGroupLayoutDescriptor = {
    label: 'NormalMaterial Bind Group Layout',
    entries: [
      { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
    ],
  };

  registerMaterialLayoutDescriptor('normal', normalMaterialLayoutDescriptor);

  function createNormalMaterial(options: NormalMaterialOptions = {}): NormalMaterialType {
    const normalTexture = options.normalTexture ?? renderer.textureLibrary.getFallback('normal');
    const sampler = renderer.samplerLibrary.getSampler('linearRepeat');
    if (!sampler) throw new Error('Normal material sampler not found.');

    let materialFlags = MaterialFlags.None;

    if (options.normalTexture) {
      materialFlags |= MaterialFlags.Normal;
    }
    const materialUniformsBuffer = createUniformBuffer({
      materialFlags: { type: 'u32', value: materialFlags },
    });

    const self = createBaseMaterial<NormalMaterialType>({
      type: 'normal',
      shader: 'normal',
      transparent: false,
      doubleSided: options.doubleSided ?? false,
      depthWrite: options.depthWrite ?? true,
      buffers: [materialUniformsBuffer],
      buildBindGroupEntries(materialBuffers: UniformBuffer[]) {
        const materialUniformsBuffer = materialBuffers[0];
        if (!materialUniformsBuffer?.buffer) return [];
        return [
          { binding: 0, resource: { buffer: materialUniformsBuffer.buffer } },
          { binding: 1, resource: normalTexture.gpuTextureView },
          { binding: 2, resource: sampler },
        ];
      },
    });

    return self;
  }

  return { createNormalMaterial };
}

export { NormalMaterial };
