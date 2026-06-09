import { UniformBuffer } from '../core/core.types';
import { colorToLinear } from '../utilities/colorUtilities';
import { BaseMaterialFactory, MaterialFlags } from './BaseMaterialFactory';
import type { LambertMaterial as LambertMaterialType } from './materials.types';
import { TonyModuleContext } from '../TonyGL.types';

export type LambertMaterialOptions = {
  color?: ArrayLike<number>;
  albedoTexture?: any | null;
  normalTexture?: any | null;
  alphaTexture?: any | null;
  transparent?: boolean;
  doubleSided?: boolean;
  depthWrite?: boolean;
};

function LambertMaterial(context: TonyModuleContext) {
  const { renderer, createUniformBuffer, registerMaterialLayoutDescriptor } = context;

  const { createBaseMaterial } = BaseMaterialFactory(renderer);

  const lambertMaterialLayoutDescriptor: GPUBindGroupLayoutDescriptor = {
    label: 'LambertMaterial Bind Group Layout',
    entries: [
      { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {} },
      { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: {} },
      { binding: 4, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
    ],
  };

  registerMaterialLayoutDescriptor('lambert', lambertMaterialLayoutDescriptor);

  function createLambertMaterial(options: LambertMaterialOptions = {}): LambertMaterialType {
    let color = new Float32Array(options.color ?? [1, 1, 1, 1]);
    let materialFlags = MaterialFlags.None;

    if (options.alphaTexture) {
      materialFlags |= MaterialFlags.Alpha;
    }

    if (options.normalTexture) {
      materialFlags |= MaterialFlags.Normal;
    }

    if (options.albedoTexture) {
      materialFlags |= MaterialFlags.Albedo;
    }

    const alphaTexture = options.alphaTexture ?? renderer.textureLibrary.getFallback('white');
    const normalTexture = options.normalTexture ?? renderer.textureLibrary.getFallback('normal');
    const albedoTexture = options.albedoTexture ?? renderer.textureLibrary.getFallback('white');
    const sampler = renderer.samplerLibrary.getSampler('linearRepeat');
    if (!sampler) throw new Error('Lambert material sampler not found.');
    const materialUniformsBuffer = createUniformBuffer({
      materialFlags: { type: 'u32', value: materialFlags },
      color: { type: 'vec4<f32>', value: colorToLinear(color) },
      textureRepeatAlbedo: { type: 'vec2<f32>', value: albedoTexture.repeat },
      textureRepeatAlpha: { type: 'vec2<f32>', value: alphaTexture.repeat },
      textureRepeatNormal: { type: 'vec2<f32>', value: normalTexture.repeat },
    });

    const self = createBaseMaterial<LambertMaterialType>({
      type: 'lambert',
      shader: 'lambert',
      transparent: options.transparent ?? false,
      doubleSided: options.doubleSided ?? false,
      depthWrite: options.depthWrite ?? true,
      buffers: [materialUniformsBuffer],
      buildBindGroupEntries(materialBuffers: UniformBuffer[]) {
        const materialUniformsBuffer = materialBuffers[0];
        if (!materialUniformsBuffer?.buffer) return [];
        return [
          { binding: 0, resource: { buffer: materialUniformsBuffer.buffer } },
          { binding: 1, resource: alphaTexture.gpuTextureView },
          { binding: 2, resource: normalTexture.gpuTextureView },
          { binding: 3, resource: albedoTexture.gpuTextureView },
          { binding: 4, resource: sampler },
        ];
      },
    });

    self.color = color;
    self.setColor = (value: ArrayLike<number>) => {
      self.color = new Float32Array(value);
      self.updateUniforms({ color: colorToLinear(self.color) });
    };

    return self;
  }

  return { createLambertMaterial };
}

export { LambertMaterial };
