import { computeBufferLayout, writeUniformValuesToBuffer } from '../utilities/computeBufferLayout';
import type { Renderer } from '../renderer/renderer.types';
import type { UniformObject, UniformBufferOptions, UniformValueInput, UniformBuffer } from './core.types';

function UniformBufferFactory(renderer: Renderer) {
  return function createUniformBuffer(uniformObject: UniformObject, options?: UniformBufferOptions): UniformBuffer {
    const id = crypto.randomUUID();
    const type = 'UniformBuffer';
    const addressSpace = options?.addressSpace ?? 'uniform';
    const usage =
      options?.usage ??
      (addressSpace === 'storage'
        ? GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        : GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    let needsUpdate = true;

    const { bufferData, layoutEntries } = computeBufferLayout(uniformObject, {
      addressSpace: addressSpace,
    });

    const self: UniformBuffer = {
      id,
      type,
      addressSpace,
      buffer: renderer.device.createBuffer({
        size: bufferData.byteLength,
        usage,
      }),
      uniforms: uniformObject,
      bufferData,
      updateUniforms,
      writeUpdatedBufferData,
      destroy,
    };

    function updateUniforms(updatedUniforms: Record<string, UniformValueInput>) {
      for (const key in updatedUniforms) {
        const currentUniform = self.uniforms[key];
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

      if (!self.bufferData) throw new Error('Uniform buffer data missing');
      writeUniformValuesToBuffer(self.uniforms, self.bufferData, layoutEntries);
      needsUpdate = true;
    }

    function writeUpdatedBufferData() {
      if (needsUpdate) {
        if (!self.buffer || !self.bufferData) throw new Error('Uniform buffer not initialized');
        renderer.device.queue.writeBuffer(self.buffer, 0, self.bufferData);
        needsUpdate = false;
      }
    }

    function destroy() {
      if (self.buffer) {
        self.buffer.destroy();
        self.buffer = null;
      }
      self.bufferData = null;
    }

    writeUpdatedBufferData();

    return self;
  };
}

export { UniformBufferFactory };
