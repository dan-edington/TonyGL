import { UniformBuffer } from '../core/core.types';
import type { Renderer } from '../renderer/renderer.types';
import type { MaterialType, BaseMaterial } from './materials.types';

export const enum MaterialFlags {
  None = 0,
  Alpha = 1 << 0,
  Normal = 1 << 1,
  Albedo = 1 << 2,
}

export type BaseMaterialOptions = {
  type: MaterialType;
  shader: string;
  buffers?: UniformBuffer[];
  bindGroupLayout?: GPUBindGroupLayout;
  transparent?: boolean;
  doubleSided?: boolean;
  depthWrite?: boolean;
  buildBindGroupEntries: (materialBuffers: UniformBuffer[]) => GPUBindGroupEntry[];
};

export function BaseMaterialFactory(renderer: Renderer) {
  function createBaseMaterial<T extends BaseMaterial = BaseMaterial>(options: BaseMaterialOptions): T {
    const id = crypto.randomUUID();
    const type = options.type;
    let materialBuffers = options.buffers ?? [];
    const shaderIdentifier =
      type === 'custom' ? renderer.shaderLibrary.buildCustomShader({ shader: options.shader, id }) : options.shader;

    const cachedShader = renderer.shaderLibrary.getShader(shaderIdentifier);
    if (!cachedShader) {
      throw new Error('Could not find shader code for material.');
    }

    const materialBindGroupLayout =
      options.bindGroupLayout ?? renderer.bindGroupLayouts.materialBindGroupLayouts?.get(type) ?? null;
    if (!materialBindGroupLayout) {
      throw new Error(`Material bind group layout missing for type: ${type}`);
    }

    const createMaterialBindGroup = (buffers: UniformBuffer[]) => {
      const entries = options.buildBindGroupEntries(buffers);

      if (entries.length === 0) return null;

      return renderer.device.createBindGroup({
        layout: materialBindGroupLayout,
        entries,
      });
    };

    const self: BaseMaterial = {
      id,
      type,
      shader: shaderIdentifier,
      shaderModule: cachedShader.shaderModule,
      materialBindGroupLayout,
      materialUniformsBuffer: materialBuffers[0] ?? null,
      materialUniformsBindGroup: createMaterialBindGroup(materialBuffers),
      transparent: options.transparent ?? false,
      doubleSided: options.doubleSided ?? false,
      depthWrite: options.depthWrite ?? true,
      usesAlphaPipeline: options.transparent ?? false,
      updateUniforms(updatedUniforms) {
        self.materialUniformsBuffer?.updateUniforms(updatedUniforms);
      },
      rebindBuffers(updatedBuffers) {
        materialBuffers = updatedBuffers;
        self.materialUniformsBuffer = materialBuffers[0] ?? null;
        self.materialUniformsBindGroup = createMaterialBindGroup(materialBuffers);
      },
      writeBuffers() {
        for (const materialBuffer of materialBuffers) {
          materialBuffer.writeUpdatedBufferData();
        }
      },
      destroy() {
        for (const materialBuffer of materialBuffers) {
          materialBuffer.destroy();
        }
        self.materialUniformsBuffer = null;
        self.materialUniformsBindGroup = null;
      },
    };

    return self as T;
  }

  return { createBaseMaterial };
}
