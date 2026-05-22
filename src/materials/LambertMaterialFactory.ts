import { CreateUniformBufferFunction, UniformBuffer } from '../core/core.types';
import { colorToLinear } from '../utilities/colorUtilities';
import { BaseMaterialFactory, MaterialFlags } from './BaseMaterialFactory';
import type { Renderer } from '../renderer/renderer.types';
import type { LambertMaterial } from './materials.types';

export type LambertMaterialOptions = {
  color?: ArrayLike<number>;
  albedoTexture?: any | null;
  normalTexture?: any | null;
  alphaTexture?: any | null;
  transparent?: boolean;
  doubleSided?: boolean;
  depthWrite?: boolean;
};

function LambertMaterialFactory(renderer: Renderer, createUniformBuffer: CreateUniformBufferFunction) {
  const { createBaseMaterial } = BaseMaterialFactory(renderer, createUniformBuffer);

  function createLambertMaterial(options: LambertMaterialOptions = {}): LambertMaterial {
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

    const lambertMaterial = createBaseMaterial<LambertMaterial>({
      type: 'lambert',
      shader: 'lambert',
      transparent: options.transparent ?? false,
      doubleSided: options.doubleSided ?? false,
      depthWrite: options.depthWrite ?? true,
      uniforms: {
        materialFlags: { type: 'u32', value: materialFlags },
        color: { type: 'vec4<f32>', value: colorToLinear(color) },
        textureRepeatAlbedo: { type: 'vec2<f32>', value: albedoTexture.repeat },
        textureRepeatAlpha: { type: 'vec2<f32>', value: alphaTexture.repeat },
        textureRepeatNormal: { type: 'vec2<f32>', value: normalTexture.repeat },
      },
      buildBindGroupEntries(materialUniformsBuffer: UniformBuffer | null) {
        if (!materialUniformsBuffer?.buffer) return [];
        return [
          { binding: 0, resource: { buffer: materialUniformsBuffer.buffer } },
          { binding: 1, resource: alphaTexture.getView() },
          { binding: 2, resource: normalTexture.getView() },
          { binding: 3, resource: albedoTexture.getView() },
          { binding: 4, resource: sampler },
        ];
      },
    });

    lambertMaterial.color = color;
    lambertMaterial.setColor = (value: ArrayLike<number>) => {
      lambertMaterial.color = new Float32Array(value);
      lambertMaterial.updateUniforms({ color: colorToLinear(lambertMaterial.color) });
    };

    return lambertMaterial;
  }

  return { createLambertMaterial };
}

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

export { LambertMaterialFactory, lambertMaterialLayoutDescriptor };
