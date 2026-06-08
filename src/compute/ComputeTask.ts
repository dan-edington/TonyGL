import type { ComputeTask } from './compute.types';

type CreateComputeTaskOptions = {
  name: string;
};

function ComputeTask() {
  function createComputeTask(options: CreateComputeTaskOptions): ComputeTask {
    const { name } = options;

    return {
      name,
    };
  }

  function createComputePipeline() {}

  return {
    createComputeTask,
  };
}

export { ComputeTask };
