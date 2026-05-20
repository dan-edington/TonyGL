import type { Renderer } from '../renderer/configureRenderer';
import type { CreateUniformBufferFunction, UniformBuffer, UniformObject } from '../core/UniformBufferFactory';
import type { BaseMaterial } from './MaterialsFactory';
import { BaseMaterialFactory } from './BaseMaterialFactory';

export type CustomMaterial = BaseMaterial;

export type CustomMaterialOptions = {
  shader: string;
  uniforms?: UniformObject;
  transparent?: boolean;
  doubleSided?: boolean;
  depthWrite?: boolean;
};

function CustomMaterialFactory(renderer: Renderer, createUniformBuffer: CreateUniformBufferFunction) {
  const { createBaseMaterial } = BaseMaterialFactory(renderer, createUniformBuffer);

  function createCustomMaterial(options: CustomMaterialOptions): CustomMaterial {
    return createBaseMaterial({
      type: 'custom',
      shader: options.shader,
      transparent: options.transparent ?? false,
      doubleSided: options.doubleSided ?? false,
      depthWrite: options.depthWrite ?? true,
      uniforms: options.uniforms,
      buildEntries(materialUniformsBuffer: UniformBuffer | null) {
        if (!materialUniformsBuffer?.buffer) return [];
        return [{ binding: 0, resource: { buffer: materialUniformsBuffer.buffer } }];
      },
    });
  }

  return { createCustomMaterial };
}

const customMaterialLayoutDescriptor: GPUBindGroupLayoutDescriptor = {
  label: 'CustomMaterial Bind Group Layout',
  entries: [{ binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }],
};

export { CustomMaterialFactory, customMaterialLayoutDescriptor };
