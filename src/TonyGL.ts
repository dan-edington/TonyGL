import { getAdapterInfo } from './renderer/getAdapterInfo';
import { configureRenderer } from './renderer/configureRenderer';
import { registerMaterialLayoutDescriptor } from './renderer/bindGroupLayouts/materials';
import { setupRendererEventListeners } from './renderer/setupRendererEventListeners';
import { PipelineManagerFactory } from './renderer/PipelineManagerFactory';
import { EntityFactory } from './core/EntityFactory';
import { UniformBufferFactory } from './core/UniformBufferFactory';
import { initialiseFrameTimers } from './renderer/frameTimers';
import type { WebGPUBase } from './renderer/renderer.types';
import type { Scene } from './sceneObjects/sceneObjects.types';
import type { PerspectiveCamera } from './camera/camera.types';
import type {
  Tony,
  TonyFullOptions,
  TonyModule,
  TonyModuleContext,
  TonyOptions,
  TonySetupOnlyOptions,
} from './TonyGL.types';
import { initializeMaterialBindGroupLayouts } from './renderer/initializeBindGroupLayouts';

function TonyGL(options: TonySetupOnlyOptions): Promise<WebGPUBase>;
function TonyGL(options: TonyFullOptions): Promise<Tony>;
async function TonyGL(options: TonyOptions): Promise<Tony | WebGPUBase> {
  if (options.webGPUSetupOnly) {
    return await configureRenderer(options);
  }

  // Setup Renderer
  const renderer = await configureRenderer(options);
  const frameTimers = initialiseFrameTimers();
  const { rendererEventsAbortController } = setupRendererEventListeners(renderer);
  const { clearPipelineCache } = PipelineManagerFactory(renderer);

  // Setup re-usable Factories
  const createUniformBuffer = UniformBufferFactory(renderer);
  const entityFactory = EntityFactory;

  function render(scene: Scene, camera: PerspectiveCamera) {
    renderer.timers = frameTimers.updateFrameTimers();

    scene.updateRenderList();
    scene.updateLights();

    scene.sceneUniformsBuffer?.writeUpdatedBufferData();
    scene.lightManager.lightUniformsBuffer?.writeUpdatedBufferData();
    camera.updateCameraUniforms();

    const commandEncoder = renderer.device.createCommandEncoder();

    renderer.passManager.scene = scene;
    renderer.passManager.camera = camera;
    renderer.passManager.runPasses(renderer.passOrder, commandEncoder);

    renderer.device.queue.submit([commandEncoder.finish()]);
  }

  function destroy() {
    rendererEventsAbortController.abort();
    renderer.depthTexture.texture.destroy();
    renderer.multiSampleTexture.texture.destroy();
    renderer.passManager.destroyRenderTargets();
    renderer.textureLibrary.destroy();
    clearPipelineCache();
  }

  function installModules(): TonyModule[] {
    const context: TonyModuleContext = {
      renderer,
      createUniformBuffer,
      entityFactory,
      registerMaterialLayoutDescriptor,
    };

    let installedModules: TonyModule[] = [];

    if (!options.webGPUSetupOnly && options.modules) {
      installedModules = options.modules.map((moduleFactory) => {
        const module = moduleFactory(context);
        return module;
      });
    }

    postModuleInstall();

    return installedModules;
  }

  function postModuleInstall() {
    // Create material bind group layouts
    renderer.bindGroupLayouts.materialBindGroupLayouts = initializeMaterialBindGroupLayouts(renderer.device);
  }

  const coreModules = {
    renderer,
    createUniformBuffer,
    render,
    destroy,
  };

  const output = Object.assign(coreModules, ...installModules());

  return output;
}

export { TonyGL, getAdapterInfo };
