import { errorMessages } from '../constants/errorMessages';
import { Renderer, Pass, PassContext, PassFactory, PassManager, PassRoute, RenderTarget } from './renderer.types';

function PassManagerFactory(renderer: Renderer): PassManager {
  const passes = new Map<string, Pass>();
  const renderTargets = new Map<string, RenderTarget>();

  const self: PassManager = {
    scene: null,
    camera: null,
    registerPass,
    runPass,
    runPasses,
    createRenderTarget,
    getRenderTarget,
    validateRenderTarget,
    resizeRenderTargets,
    destroyRenderTargets,
  };

  function registerPass(name: string, passFactory: PassFactory, passRoute?: Partial<PassRoute>) {
    const pass = passFactory({
      name,
      renderer,
      passRoute,
    });

    passes.set(name, pass);
  }

  function getRenderTarget(name: string): RenderTarget | null {
    return renderTargets.get(name) ?? null;
  }

  function createRenderTarget(name: string, width: number, height: number, format: GPUTextureFormat): void {
    getRenderTarget(name)?.texture.destroy();

    const texture = renderer.device.createTexture({
      size: { width, height },
      format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });

    const view = texture.createView();
    renderTargets.set(name, { texture, view, width, height, format });
  }

  function validateRenderTarget(name: string, width: number, height: number, format: GPUTextureFormat): RenderTarget {
    const existingTarget = renderTargets.get(name);

    if (
      existingTarget &&
      existingTarget.width === width &&
      existingTarget.height === height &&
      existingTarget.format === format
    ) {
      return existingTarget;
    }

    createRenderTarget(name, width, height, format);

    return renderTargets.get(name)!;
  }

  function buildPassContext(pass: Pass): PassContext {
    return {
      route: pass.route,
      getRenderTarget,
      getSwapChainView: () => renderer.context.getCurrentTexture().createView(),
      validateRenderTarget,
      width: renderer.canvasElement.width,
      height: renderer.canvasElement.height,
    };
  }

  function runPass(name: string, commandEncoder: GPUCommandEncoder): void {
    const pass = passes.get(name);

    if (!pass) throw new Error(`${errorMessages.missingPass} Pass name: "${name}".`);
    if (!self.scene) throw new Error(errorMessages.missingPassScene);
    if (!self.camera) throw new Error(errorMessages.missingPassCamera);

    pass.runPass(commandEncoder, self.scene, self.camera, buildPassContext(pass));
  }

  function runPasses(passOrder: string[], commandEncoder: GPUCommandEncoder): void {
    passOrder.forEach((passName) => {
      runPass(passName, commandEncoder);
    });
  }

  function resizeRenderTargets(width: number, height: number): void {
    for (const [name, target] of renderTargets.entries()) {
      createRenderTarget(name, width, height, target.format);
    }
  }

  function destroyRenderTargets(): void {
    renderTargets.forEach((target) => {
      target.texture.destroy();
    });

    renderTargets.clear();
  }

  return self;
}

export { PassManagerFactory };
