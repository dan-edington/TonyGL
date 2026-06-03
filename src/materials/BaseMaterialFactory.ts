import { CreateUniformBufferFunction, UniformBuffer, UniformObject } from '../core/core.types';
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
  uniforms?: UniformObject;
  transparent?: boolean;
  doubleSided?: boolean;
  depthWrite?: boolean;
  buildBindGroupEntries: (materialUniformsBuffer: UniformBuffer | null) => GPUBindGroupEntry[];
};

export function BaseMaterialFactory(renderer: Renderer, createUniformBuffer: CreateUniformBufferFunction) {
  function createBaseMaterial<T extends BaseMaterial = BaseMaterial>(options: BaseMaterialOptions): T {
    const id = crypto.randomUUID();
    const type = options.type;
    const materialUniformsBuffer = options.uniforms ? createUniformBuffer(options.uniforms) : null;
    const shaderIdentifier =
      type === 'custom' ? renderer.shaderLibrary.buildCustomShader({ shader: options.shader, id }) : options.shader;

    const cachedShader = renderer.shaderLibrary.getShader(shaderIdentifier);
    if (!cachedShader) {
      throw new Error('Could not find shader code for material.');
    }

    const materialBindGroupLayout = renderer.bindGroupLayouts.materialBindGroupLayouts?.get(type);
    if (!materialBindGroupLayout) {
      throw new Error(`Material bind group layout missing for type: ${type}`);
    }

    const entries = options.buildBindGroupEntries(materialUniformsBuffer);

    const materialUniformsBindGroup =
      entries.length > 0
        ? renderer.device.createBindGroup({
            layout: materialBindGroupLayout,
            entries,
          })
        : null;

    const self: BaseMaterial = {
      id,
      type,
      shader: shaderIdentifier,
      shaderModule: cachedShader.shaderModule,
      materialUniformsBuffer,
      materialUniformsBindGroup,
      transparent: options.transparent ?? false,
      doubleSided: options.doubleSided ?? false,
      depthWrite: options.depthWrite ?? true,
      usesAlphaPipeline: options.transparent ?? false,
      updateUniforms(updatedUniforms) {
        self.materialUniformsBuffer?.updateUniforms(updatedUniforms);
      },
      writeBuffers() {
        self.materialUniformsBuffer?.writeUpdatedBufferData();
      },
      destroy() {
        self.materialUniformsBuffer?.destroy();
        self.materialUniformsBuffer = null;
        self.materialUniformsBindGroup = null;
      },
    };

    return self as T;
  }

  return { createBaseMaterial };
}
