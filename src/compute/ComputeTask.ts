import { UniformBuffer } from '../core/core.types';
import { TonyModuleContext } from '../TonyGL.types';
import type { ComputeTask, CreateComputeTaskOptions } from './compute.types';

function ComputeTask(context: TonyModuleContext) {
  const { renderer } = context;

  function createComputeTask(options: CreateComputeTaskOptions): ComputeTask {
    const {
      name,
      enabled = false,
      shaderCode,
      shaderEntryPoint = 'main',
      workgroupSize = [1, 1, 1],
      dispatchSize = [1, 1, 1],
      buffers = [],
    } = options;

    const self = {
      name,
      enabled,
      writeBuffers,
      compute,
      rebindBuffers,
    };

    const computeShaderModule = createShaderModule(name, shaderCode);
    const computePipeline = createComputePipeline(name, computeShaderModule, shaderEntryPoint);
    let computeBuffers = buffers;
    let computeBindGroup = createComputeBindGroup(name, computeBuffers, computePipeline);

    if (workgroupSize.length < 3) workgroupSize.push(...Array(3 - workgroupSize.length).fill(1));
    if (dispatchSize.length < 3) dispatchSize.push(...Array(3 - dispatchSize.length).fill(1));

    function compute(pass: GPUComputePassEncoder) {
      pass.setPipeline(computePipeline);
      pass.setBindGroup(0, computeBindGroup);
      pass.dispatchWorkgroups(
        Math.ceil(dispatchSize[0] / workgroupSize[0]),
        Math.ceil(dispatchSize[1]! / workgroupSize[1]!),
        Math.ceil(dispatchSize[2]! / workgroupSize[2]!),
      );
    }

    function writeBuffers() {
      for (const computeBuffer of computeBuffers) {
        computeBuffer.writeUpdatedBufferData();
      }
    }

    function rebindBuffers(nextBuffers: UniformBuffer[]) {
      computeBuffers = nextBuffers;
      computeBindGroup = createComputeBindGroup(name, nextBuffers, computePipeline);
    }

    return self;
  }

  function createShaderModule(name: string, shaderCode: string) {
    const shaderModule = renderer.device.createShaderModule({
      label: `${name} compute shader module`,
      code: shaderCode,
    });

    return shaderModule;
  }

  function createComputePipeline(name: string, computeShaderModule: GPUShaderModule, shaderEntryPoint: string) {
    const computePipeline = renderer.device.createComputePipeline({
      label: `${name} compute pipeline`,
      layout: 'auto',
      compute: {
        module: computeShaderModule,
        entryPoint: shaderEntryPoint,
      },
    });

    return computePipeline;
  }

  function createComputeBindGroup(name: string, buffers: UniformBuffer[], pipeline: GPUComputePipeline) {
    const entries: GPUBindGroupEntry[] = [];

    buffers.forEach((buffer, index) => {
      if (!buffer.buffer) return;

      entries.push({
        binding: index,
        resource: { buffer: buffer.buffer },
      });
    });

    const computeBindGroup = renderer.device.createBindGroup({
      label: `${name} compute bind group`,
      layout: pipeline.getBindGroupLayout(0),
      entries,
    });

    return computeBindGroup;
  }

  return {
    createComputeTask,
  };
}

export { ComputeTask };
