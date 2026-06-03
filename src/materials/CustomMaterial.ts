import { BaseMaterialFactory } from './BaseMaterialFactory';
import type { UniformBuffer, UniformObject } from '../core/core.types';
import type { CustomMaterial as CustomMaterialType } from './materials.types';
import { TonyModuleContext } from '../TonyGL.types';

export type CustomMaterialOptions = {
  shader: string;
  uniforms?: UniformObject;
  transparent?: boolean;
  doubleSided?: boolean;
  depthWrite?: boolean;
};

function CustomMaterial(context: TonyModuleContext) {
  const { renderer, registerMaterialLayoutDescriptor, createUniformBuffer } = context;

  const { createBaseMaterial } = BaseMaterialFactory(renderer, createUniformBuffer);

  const customMaterialLayoutDescriptor: GPUBindGroupLayoutDescriptor = {
    label: 'CustomMaterial Bind Group Layout',
    entries: [{ binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }],
  };

  registerMaterialLayoutDescriptor('custom', customMaterialLayoutDescriptor);

  function createCustomMaterial(options: CustomMaterialOptions): CustomMaterialType {
    const customMaterial = createBaseMaterial<CustomMaterialType>({
      type: 'custom',
      shader: options.shader,
      transparent: options.transparent ?? false,
      doubleSided: options.doubleSided ?? false,
      depthWrite: options.depthWrite ?? true,
      uniforms: options.uniforms,
      buildBindGroupEntries(materialUniformsBuffer: UniformBuffer | null) {
        if (!materialUniformsBuffer?.buffer) return [];
        return [{ binding: 0, resource: { buffer: materialUniformsBuffer.buffer } }];
      },
    });

    return customMaterial;
  }

  return { createCustomMaterial };
}

export { CustomMaterial };
