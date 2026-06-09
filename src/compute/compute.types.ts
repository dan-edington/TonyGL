import { UniformBuffer } from '../core/core.types';

export type ComputeTask = {
  name: string;
  enabled: boolean;
  compute(pass: GPUComputePassEncoder): void;
  rebindBuffers(buffers: UniformBuffer[]): void;
};

export type CreateComputeTaskOptions = {
  name: string;
  enabled: boolean;
  shaderCode: string;
  shaderEntryPoint?: string;
  workgroupSize?: [number] | [number, number] | [number, number, number];
  dispatchSize?: [number] | [number, number] | [number, number, number];
  buffers: UniformBuffer[];
};
