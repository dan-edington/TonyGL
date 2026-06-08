import { getAdapterInfo } from './renderer/getAdapterInfo';
import { configureRenderer } from './renderer/configureRenderer';
import { registerMaterialLayoutDescriptor } from './renderer/bindGroupLayouts/materials';
import { setupRendererEventListeners } from './renderer/setupRendererEventListeners';
import { PipelineManagerFactory } from './renderer/PipelineManagerFactory';
import { EntityFactory } from './core/EntityFactory';
import { UniformBufferFactory } from './core/UniformBufferFactory';
import { initialiseFrameTimers } from './renderer/frameTimers';
import type { Renderer, WebGPUBase } from './renderer/renderer.types';
import type { Scene } from './sceneObjects/sceneObjects.types';
import type { PerspectiveCamera } from './camera/camera.types';
import type {
  TonyFullOptions,
  TonyModule,
  TonyModuleContext,
  TonySetupOnlyOptions,
  TonyWithModules,
} from './TonyGL.types';
import { initializeMaterialBindGroupLayouts } from './renderer/initializeBindGroupLayouts';
import { ShaderLibraryFactory } from './renderer/ShaderLibraryFactory';
import { SamplerLibraryFactory } from './renderer/SamplerLibraryFactory';
import { TextureLibraryFactory } from './renderer/TextureLibraryFactory';
import { PassManagerFactory } from './renderer/PassManagerFactory';
import { createScenePass } from './renderer/passes/scenePass';
import { DrawableEntity } from './core/core.types';
import { createPresentPass } from './renderer/passes/presentPass';
import { errorMessages } from './constants/errorMessages';

function TonyGL(options: TonySetupOnlyOptions): Promise<WebGPUBase>;
function TonyGL<const M extends readonly ((context: TonyModuleContext) => TonyModule)[]>(
  options: TonyFullOptions<M>,
): Promise<TonyWithModules<M>>;
async function TonyGL<const M extends readonly ((context: TonyModuleContext) => TonyModule)[]>(
  options: TonySetupOnlyOptions | TonyFullOptions<M>,
): Promise<WebGPUBase | TonyWithModules<M>> {
  if (options.webGPUSetupOnly) {
    return await configureRenderer(options);
  }

  // Setup Renderer
  const renderer = await configureRenderer(options);
  const frameTimers = initialiseFrameTimers();
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
    renderer.passManager.runPasses(commandEncoder);

    renderer.device.queue.submit([commandEncoder.finish()]);
  }

  function destroy() {
    renderer.rendererEventsAbortController.abort();
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

    postModuleInstall(installedModules);

    return installedModules;
  }

  function registerBasePasses() {
    const presentShader = renderer.shaderLibrary.getShader('present');
    if (!presentShader) throw new Error(errorMessages.missingShaderCode);

    const linearClampSampler = renderer.samplerLibrary.getSampler('linearClamp');
    if (!linearClampSampler) throw new Error(errorMessages.missingSamplerLibraryDevice);

    renderer.passManager.registerPass({
      name: 'scene',
      passFactory: (passOptions) =>
        createScenePass({
          ...passOptions,
          drawEntity(entity: DrawableEntity, passEncoder: GPURenderPassEncoder, rendererInstance: Renderer) {
            entity.draw(passEncoder, rendererInstance);
          },
        }),
      passRoute: {
        input: null,
        output: 'scene',
      },
    });

    renderer.passManager.registerPass({
      name: 'present',
      passFactory: (passOptions) =>
        createPresentPass({
          ...passOptions,
          shaderModule: presentShader.shaderModule,
          sampler: linearClampSampler,
        }),
      passRoute: {
        input: 'scene',
        output: 'present',
      },
      position: {
        after: 'scene',
      },
    });
  }

  function postModuleInstall(_installedModules: TonyModule[]) {
    // Libraries and managers
    renderer.shaderLibrary = ShaderLibraryFactory(renderer);
    renderer.samplerLibrary = SamplerLibraryFactory(renderer);
    renderer.textureLibrary = TextureLibraryFactory(renderer);
    renderer.pipelineManager = PipelineManagerFactory(renderer);
    renderer.passManager = PassManagerFactory(renderer);

    // Create material bind group layouts
    renderer.bindGroupLayouts.materialBindGroupLayouts = initializeMaterialBindGroupLayouts(renderer.device);

    // Register passes
    registerBasePasses();

    // Setup events
    renderer.rendererEventsAbortController = setupRendererEventListeners(renderer);
  }

  const coreModules = {
    renderer,
    createUniformBuffer,
    render,
    destroy,
  };

  const output = Object.assign(coreModules, ...installModules()) as TonyWithModules<M>;

  return output;
}

export { TonyGL, getAdapterInfo };
