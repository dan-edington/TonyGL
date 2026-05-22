import { CreateUniformBufferFunction, UniformBuffer } from '../core/core.types';
import { Renderer } from '../renderer/renderer.types';
import { colorToLinear } from '../utilities/colorUtilities';
import { BaseMaterialFactory, MaterialFlags } from './BaseMaterialFactory';
import { BlinnPhongMaterial } from './materials.types';

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

    const self = createBaseMaterial<BlinnPhongMaterial>({
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
      buildBindGroupEntries(materialUniformsBuffer: UniformBuffer | null) {
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

    self.shininess = shininess;
    self.setShininess = (value: number) => {
      self.shininess = value;
      self.updateUniforms({ shininess: self.shininess });
    };

    self.specularColor = specularColor;
    self.setSpecularColor = (value: ArrayLike<number>) => {
      self.specularColor = new Float32Array(value);
      self.updateUniforms({ specularColor: colorToLinear(self.specularColor) });
    };

    self.specularStrength = specularStrength;
    self.setSpecularStrength = (value: number) => {
      self.specularStrength = value;
      self.updateUniforms({ specularStrength: self.specularStrength });
    };

    return self;
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
