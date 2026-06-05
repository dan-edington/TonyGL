import { errorMessages } from '../constants/errorMessages';
import {
  Renderer,
  Pass,
  PassContext,
  RegisterPassOptions,
  PassPosition,
  PassManager,
  RenderTarget,
} from './renderer.types';

function PassManagerFactory(renderer: Renderer): PassManager {
  const passes = new Map<string, Pass>();
  const renderTargets = new Map<string, RenderTarget>();
  const passOrder: string[] = [];

  const self: PassManager = {
    scene: null,
    camera: null,
    passOrder,
    registerPass,
    runPass,
    runPasses,
    createRenderTarget,
    getRenderTarget,
    validateRenderTarget,
    resizeRenderTargets,
    destroyRenderTargets,
    setPassPosition,
  };

  function registerPass(options: RegisterPassOptions) {
    const { name, passFactory, passRoute, position } = options;

    const pass = passFactory({
      name,
      renderer,
      passRoute,
    });

    passes.set(name, pass);

    if (position) {
      setPassPosition(name, position);
    } else {
      setPassPosition(name, { before: 'present' });
    }
  }

  function setPassPosition(name: string, position: PassPosition) {
    if (!passes.get(name)) {
      console.warn(`Pass ${name} not found.`);
      return;
    }

    const isBefore = !!position.before;
    const dstName = (position.after || position.before)!;

    // If pass exists in the array it needs removing first
    const srcIndex = self.passOrder.indexOf(name);
    if (srcIndex >= 0) self.passOrder.splice(srcIndex, 1);

    const dstIndex = self.passOrder.indexOf(dstName);

    if (self.passOrder.length === 0) {
      // First item should just be pushed
      self.passOrder.push(name);
      return;
    }

    if (dstIndex === -1) {
      // Destination not found. Add pass before present and show warning
      console.warn(`Pass ${dstName} does not exist in pass list. Adding to end.`);
      self.passOrder.splice(self.passOrder.length - 1, 0, name);
      return;
    }

    if (!isBefore && dstName === 'present') {
      // Attempting to add pass after present. Add pass before present and show warning.
      console.warn(`Cannot add pass ${name} after present pass. Adding before.`);
      self.passOrder.splice(dstIndex - 1, 0, name);
      return;
    }

    self.passOrder.splice(dstIndex + (isBefore ? 0 : 1), 0, name);
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

  function runPasses(commandEncoder: GPUCommandEncoder): void {
    self.passOrder.forEach((passName) => {
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
