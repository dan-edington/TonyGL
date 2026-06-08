import { createPass } from './pass';
import type { PassOptions, ComputePass, PassPosition } from '../renderer.types';
import { ComputeTask } from '../../compute/compute.types';

function createComputePass() {
  return (options: PassOptions): ComputePass => {
    const { name, route } = createPass({
      ...options,
      passRoute: {
        ...options.passRoute,
      },
    });

    const computeTasks = new Map<string, ComputeTask>();
    const computeTasksOrder: string[] = [];

    function runPass(commandEncoder: GPUCommandEncoder): void {
      // const pass = commandEncoder.beginComputePass({ label: name });
      // pass.end();
    }

    function addTask(computeTask: ComputeTask, position?: PassPosition) {
      const { name: taskName } = computeTask;

      if (computeTasks.has(taskName)) {
        console.warn(`Compute Pass ${name} already has a task named ${taskName}. ${taskName} will be overwritten.`);
        computeTasksOrder.splice(computeTasksOrder.indexOf(taskName), 1);
      }

      if (position) {
        const target = (position.before || position.after)!;
        const targetIndex = computeTasksOrder.indexOf(target);
        if (targetIndex > -1) {
          computeTasksOrder.splice(targetIndex + (position.after ? 1 : 0), 0, taskName);
        } else {
          computeTasksOrder.push(taskName);
        }
      } else {
        computeTasksOrder.push(taskName);
      }

      computeTasks.set(taskName, computeTask);
    }

    function removeTask(taskName: string) {
      computeTasks.delete(taskName);
      computeTasksOrder.splice(computeTasksOrder.indexOf(taskName), 1);
    }

    return {
      name,
      route,
      runPass,
      addTask,
      removeTask,
      type: 'Compute',
      computeTasksOrder,
      computeTasks,
    };
  };
}

export { createComputePass };
