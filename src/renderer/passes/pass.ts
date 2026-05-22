import type { Pass, PassOptions } from '../renderer.types';

function createPass(options: PassOptions): Pick<Pass, 'name' | 'route'> {
  return {
    name: options.name,
    route: {
      input: options.passRoute?.input ?? null,
      output: options.passRoute?.output ?? null,
      renderToSwapchain: options.passRoute?.renderToSwapchain ?? false,
    },
  };
}

export { createPass };
