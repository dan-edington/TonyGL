import { colorToLinear } from '../utilities/colorUtilities';
import { BaseMaterialFactory, MaterialFlags } from './BaseMaterialFactory';
import type { CreateUniformBufferFunction, UniformBuffer } from '../core/core.types';
import type { Renderer } from '../renderer/renderer.types';
import type { BaseMaterial } from './materials.types';

export type UnlitMaterial = BaseMaterial & {
  color: Float32Array;
  setColor(value: ArrayLike<number>): void;
};

export type UnlitMaterialOptions = {
  color?: ArrayLike<number>;
  albedoTexture?: any | null;
  alphaTexture?: any | null;
  transparent?: boolean;
  doubleSided?: boolean;
  depthWrite?: boolean;
};

function UnlitMaterialFactory(renderer: Renderer, createUniformBuffer: CreateUniformBufferFunction) {
  const { createBaseMaterial } = BaseMaterialFactory(renderer, createUniformBuffer);

  function createUnlitMaterial(options: UnlitMaterialOptions = {}): UnlitMaterial {
    let color = new Float32Array(options.color ?? [1, 1, 1, 1]);
    let materialFlags = MaterialFlags.None;

    if (options.alphaTexture) {
      materialFlags |= MaterialFlags.Alpha;
    }

    if (options.albedoTexture) {
      materialFlags |= MaterialFlags.Albedo;
    }

    const alphaTexture = options.alphaTexture ?? renderer.textureLibrary.getFallback('white');
    const albedoTexture = options.albedoTexture ?? renderer.textureLibrary.getFallback('white');
    const sampler = renderer.samplerLibrary.getSampler('linearRepeat');
    if (!sampler) throw new Error('Unlit material sampler not found.');

    const self = createBaseMaterial<UnlitMaterial>({
      type: 'unlit',
      shader: 'unlit',
      transparent: options.transparent ?? false,
      doubleSided: options.doubleSided ?? false,
      depthWrite: options.depthWrite ?? true,
      uniforms: {
        materialFlags: { type: 'u32', value: materialFlags },
        color: { type: 'vec4<f32>', value: colorToLinear(color) },
        textureRepeatAlbedo: { type: 'vec2<f32>', value: albedoTexture.repeat },
        textureRepeatAlpha: { type: 'vec2<f32>', value: alphaTexture.repeat },
      },
      buildBindGroupEntries(materialUniformsBuffer: UniformBuffer | null) {
        if (!materialUniformsBuffer?.buffer) return [];
        return [
          { binding: 0, resource: { buffer: materialUniformsBuffer.buffer } },
          { binding: 1, resource: alphaTexture.gpuTextureView },
          { binding: 2, resource: albedoTexture.gpuTextureView },
          { binding: 3, resource: sampler },
        ];
      },
    });

    self.color = color;
    self.setColor = (value: ArrayLike<number>) => {
      self.color = new Float32Array(value);
      self.updateUniforms({ color: colorToLinear(self.color) });
      self.usesAlphaPipeline = self.transparent || self.color[3] < 1;
    };

    return self;
  }

  return { createUnlitMaterial };
}

const unlitMaterialLayoutDescriptor: GPUBindGroupLayoutDescriptor = {
  label: 'UnlitMaterial Bind Group Layout',
  entries: [
    { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
    { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} },
    { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {} },
    { binding: 3, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
  ],
};

export { UnlitMaterialFactory, unlitMaterialLayoutDescriptor };
