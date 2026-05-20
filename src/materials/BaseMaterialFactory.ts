import { Renderer } from '../renderer/configureRenderer';
import { CreateUniformBufferFunction, UniformBuffer, UniformObject } from '../core/UniformBufferFactory';
import type { MaterialType, BaseMaterial } from './MaterialsFactory';

export function BaseMaterialFactory(renderer: Renderer, createUniformBuffer: CreateUniformBufferFunction) {
  function createBaseMaterial(options: {
    type: MaterialType;
    shader: string;
    uniforms?: UniformObject;
    transparent?: boolean;
    doubleSided?: boolean;
    depthWrite?: boolean;
    buildEntries: (materialUniformsBuffer: UniformBuffer | null) => GPUBindGroupEntry[];
  }): BaseMaterial {
    const id = crypto.randomUUID();
    const type = options.type;
    let shader = options.shader;

    if (type === 'custom') {
      shader = renderer.shaderLibrary.buildCustomShader({ shader: options.shader, id });
    }

    const shaderRef = renderer.shaderLibrary.getShader(shader);

    if (!shaderRef) {
      throw new Error('Could not find shader code for material.');
    }

    const shaderModule = shaderRef.shaderModule;
    const materialUniformsBuffer = options.uniforms ? createUniformBuffer(options.uniforms) : null;
    const materialBindGroupLayout = renderer.bindGroupLayouts.materialBindGroupLayouts.get(type);
    if (!materialBindGroupLayout) {
      throw new Error(`Material bind group layout missing for type: ${type}`);
    }

    const entries = options.buildEntries(materialUniformsBuffer);
    const materialUniformsBindGroup =
      entries.length > 0
        ? renderer.device.createBindGroup({
            layout: materialBindGroupLayout,
            entries,
          })
        : null;

    const material: BaseMaterial = {
      id,
      type,
      shader,
      shaderModule,
      materialUniformsBuffer,
      materialUniformsBindGroup,
      transparent: options.transparent ?? false,
      doubleSided: options.doubleSided ?? false,
      depthWrite: options.depthWrite ?? true,
      usesAlphaPipeline: options.transparent ?? false,
      updateUniforms(updatedUniforms) {
        materialUniformsBuffer?.updateUniform(updatedUniforms);
      },
      writeBuffers() {
        materialUniformsBuffer?.writeUpdatedBufferData();
      },
      destroy() {
        materialUniformsBuffer?.destroy();
      },
    };

    return material;
  }

  return { createBaseMaterial };
}
