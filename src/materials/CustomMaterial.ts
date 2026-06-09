import { BaseMaterialFactory } from './BaseMaterialFactory';
import type { UniformBuffer } from '../core/core.types';
import type { CustomMaterial as CustomMaterialType } from './materials.types';
import { TonyModuleContext } from '../TonyGL.types';

export type CustomMaterialOptions = {
  shader: string;
  buffers?: UniformBuffer[];
  transparent?: boolean;
  doubleSided?: boolean;
  depthWrite?: boolean;
};

function CustomMaterial(context: TonyModuleContext) {
  const { renderer } = context;

  const { createBaseMaterial } = BaseMaterialFactory(renderer);

  function createCustomMaterial(options: CustomMaterialOptions): CustomMaterialType {
    const buffers = options.buffers ?? [];

    const bindGroupLayout = renderer.device.createBindGroupLayout({
      label: 'CustomMaterial Bind Group Layout',
      entries: buffers.map((buffer, index) => ({
        binding: index,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: {
          type:
            buffer.addressSpace === 'storage'
              ? ('read-only-storage' as GPUBufferBindingType)
              : ('uniform' as GPUBufferBindingType),
        },
      })),
    });

    const customMaterial = createBaseMaterial<CustomMaterialType>({
      type: 'custom',
      shader: options.shader,
      transparent: options.transparent ?? false,
      doubleSided: options.doubleSided ?? false,
      depthWrite: options.depthWrite ?? true,
      buffers,
      bindGroupLayout,
      buildBindGroupEntries(materialBuffers: UniformBuffer[]) {
        return materialBuffers
          .filter((buffer) => buffer.buffer !== null)
          .map((buffer, index) => ({ binding: index, resource: { buffer: buffer.buffer! } }));
      },
    });

    return customMaterial;
  }

  return { createCustomMaterial };
}

export { CustomMaterial };
