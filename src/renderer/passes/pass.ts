import { Renderer } from '../configureRenderer';
import { Scene } from '../../sceneObjects/SceneFactory';

export type RenderTarget = {
  texture: GPUTexture;
  view: GPUTextureView;
  width: number;
  height: number;
  format: GPUTextureFormat;
};

export type PassRoute = {
  input: string | null;
  output: string | null;
  renderToSwapchain: boolean;
};

export type PassContext = {
  route: PassRoute;
  getRenderTarget: (name: string) => RenderTarget | null;
  getSwapChainView: () => GPUTextureView;
  validateRenderTarget: (name: string, width: number, height: number, format: GPUTextureFormat) => RenderTarget;
  width: number;
  height: number;
};

export type Pass = {
  name: string;
  route: PassRoute;
  runPass(commandEncoder: GPUCommandEncoder, scene: Scene, camera: unknown, passContext: PassContext): void;
};

export type PassOptions = {
  name: string;
  renderer: Renderer;
  passRoute?: Partial<PassRoute>;
};

export type PassFactory = (options: PassOptions) => Pass;

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
