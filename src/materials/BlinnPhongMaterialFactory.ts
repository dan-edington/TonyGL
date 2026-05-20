import { colorToLinear } from '../utilities/colorUtilities';
import type { Renderer } from '../renderer/configureRenderer';
import type { CreateUniformBufferFunction, UniformBuffer } from '../core/UniformBufferFactory';
import { MaterialFlags } from './MaterialsFactory';
import type { BaseMaterial } from './MaterialsFactory';
import { BaseMaterialFactory } from './BaseMaterialFactory';

export type BlinnPhongMaterial = BaseMaterial & {
  color: Float32Array;
  setColor(value: ArrayLike<number>): void;
  shininess: number;
  setShininess(value: number): void;
  specularColor: Float32Array;
  setSpecularColor(value: ArrayLike<number>): void;
  specularStrength: number;
  setSpecularStrength(value: number): void;
};

export type BlinnPhongMaterialOptions = {
  name?: string;
  color?: ArrayLike<number>;
  albedoTexture?: any | null;
  normalTexture?: any | null;
  alphaTexture?: any | null;
  transparent?: boolean;
  shininess?: number;
  specularColor?: ArrayLike<number>;
  specularStrength?: number;
  doubleSided?: boolean;
  depthWrite?: boolean;
};

function BlinnPhongMaterialFactory(renderer: Renderer, createUniformBuffer: CreateUniformBufferFunction) {
  const { createBaseMaterial } = BaseMaterialFactory(renderer, createUniformBuffer);

  function createBlinnPhongMaterial(options: BlinnPhongMaterialOptions = {}): BlinnPhongMaterial {
    let color = new Float32Array(options.color ?? [1, 1, 1, 1]);
    let shininess = options.shininess ?? 1;
    let specularColor = new Float32Array(options.specularColor ?? [1, 1, 1]);
    let specularStrength = options.specularStrength ?? 1;
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
    if (!sampler) {
      throw new Error('BlinnPhong material sampler not found.');
    }
    const base = createBaseMaterial({
      type: 'blinnphong',
      shader: 'blinnphong',
      transparent: options.transparent ?? false,
      doubleSided: options.doubleSided ?? false,
      depthWrite: options.depthWrite ?? true,
      uniforms: {
        materialFlags: { type: 'u32', value: materialFlags },
        color: { type: 'vec4<f32>', value: colorToLinear(color) },
        textureRepeatAlbedo: { type: 'vec2<f32>', value: albedoTexture.repeat },
        textureRepeatAlpha: { type: 'vec2<f32>', value: alphaTexture.repeat },
        textureRepeatNormal: { type: 'vec2<f32>', value: normalTexture.repeat },
        shininess: { type: 'f32', value: shininess },
        specularColor: { type: 'vec3<f32>', value: colorToLinear(specularColor) },
        specularStrength: { type: 'f32', value: specularStrength },
      },
      buildEntries(materialUniformsBuffer: UniformBuffer | null) {
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
    base.usesAlphaPipeline = base.transparent || color[3] < 1;
    const material = base as BlinnPhongMaterial;
    material.color = color;
    material.setColor = (value: ArrayLike<number>) => {
      material.color = new Float32Array(value);
      material.updateUniforms({ color: colorToLinear(material.color) });
      material.usesAlphaPipeline = material.transparent || material.color[3] < 1;
    };
    material.shininess = shininess;
    material.setShininess = (value: number) => {
      material.shininess = value;
      material.updateUniforms({ shininess: material.shininess });
    };
    material.specularColor = specularColor;
    material.setSpecularColor = (value: ArrayLike<number>) => {
      material.specularColor = new Float32Array(value);
      material.updateUniforms({ specularColor: colorToLinear(material.specularColor) });
    };
    material.specularStrength = specularStrength;
    material.setSpecularStrength = (value: number) => {
      material.specularStrength = value;
      material.updateUniforms({ specularStrength: material.specularStrength });
    };
    return material;
  }

  return { createBlinnPhongMaterial };
}

const blinnPhongMaterialLayoutDescriptor: GPUBindGroupLayoutDescriptor = {
  label: 'BlinnPhongMaterial Bind Group Layout',
  entries: [
    { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
    { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} },
    { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {} },
    { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: {} },
    { binding: 4, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
  ],
};

export { BlinnPhongMaterialFactory, blinnPhongMaterialLayoutDescriptor };
