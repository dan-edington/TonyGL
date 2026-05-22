import { computeBufferLayout, writeUniformValuesToBuffer } from '../utilities/computeBufferLayout';
import type { Renderer } from '../renderer/renderer.types';
import type { UniformObject, UniformBufferOptions, UniformValueInput, UniformBuffer } from './core.types';

function UniformBufferFactory(renderer: Renderer) {
  return function createUniformBuffer(uniformObject: UniformObject, options?: UniformBufferOptions): UniformBuffer {
    const id = crypto.randomUUID();
    const type = 'UniformBuffer';
    const uniforms = uniformObject;
    const addressSpace = options?.addressSpace ?? 'uniform';
    const usage =
      options?.usage ??
      (addressSpace === 'storage'
        ? GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        : GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    let needsUpdate = true;

    const { bufferData, layoutEntries } = computeBufferLayout(uniforms, {
      addressSpace: addressSpace,
    });

    let buffer: GPUBuffer | null = renderer.device.createBuffer({
      size: bufferData.byteLength,
      usage,
    });

    writeUpdatedBufferData();

    function updateUniforms(updatedUniforms: Record<string, UniformValueInput>) {
      for (const key in updatedUniforms) {
        const currentUniform = uniforms[key];
        if (!currentUniform) {
          continue;
        }

        const nextValue = updatedUniforms[key];

        if (typeof currentUniform.value === 'number') {
          if (typeof nextValue !== 'number') throw new Error(`Uniform '${key}' expects a number value.`);

          currentUniform.value = nextValue;
          continue;
        }

        if (typeof nextValue === 'number') {
          if (currentUniform.value.length !== 1)
            throw new Error(`Uniform '${key}' expects ${currentUniform.value.length} values, got scalar.`);

          currentUniform.value[0] = nextValue;
          continue;
        }

        if (nextValue.length !== currentUniform.value.length)
          throw new Error(`Uniform '${key}' expects ${currentUniform.value.length} values, got ${nextValue.length}.`);

        currentUniform.value.set(nextValue);
      }

      writeUniformValuesToBuffer(uniforms, bufferData, layoutEntries);
      needsUpdate = true;
    }

    function writeUpdatedBufferData() {
      if (needsUpdate) {
        if (!buffer || !bufferData) throw new Error('Uniform buffer not initialized');
        renderer.device.queue.writeBuffer(buffer, 0, bufferData);
        needsUpdate = false;
      }
    }

    function destroy() {
      if (buffer) {
        buffer.destroy();
        buffer = null;
      }
    }

    return {
      id,
      type,
      buffer,
      uniforms,
      bufferData,
      updateUniforms,
      writeUpdatedBufferData,
      destroy,
    };
  };
}

export { UniformBufferFactory };
