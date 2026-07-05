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
  TonyFullOptions,
  Tony,
  TonyModuleFactory,
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
import { createPresentPass } from './renderer/passes/presentPass';
import { errorMessages } from './constants/errorMessages';
import { createComputePass } from './renderer/passes/computePass';
import { installModulesRecursively } from './installModulesRecursively';

function TonyGL(options: TonySetupOnlyOptions): Promise<WebGPUBase>;
function TonyGL<const M extends readonly TonyModuleFactory[]>(options: TonyFullOptions<M>): Promise<TonyWithModules<M>>;
async function TonyGL<const M extends readonly TonyModuleFactory[]>(
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
  const tony = {
    renderer,
    createUniformBuffer,
    render,
    destroy,
  } as Tony & Record<string, any>;

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
    const fullOptions = options as TonyFullOptions<M>;
    const context: TonyModuleContext = {
      renderer,
      createUniformBuffer,
      entityFactory,
      registerMaterialLayoutDescriptor,
      tony,
    };

    const installedModules = installModulesRecursively(fullOptions.modules, context);
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
      passFactory: createScenePass(renderer),
      passRoute: {
        input: null,
        output: 'scene',
      },
    });

    renderer.passManager.registerPass({
      name: 'present',
      passFactory: createPresentPass(presentShader.shaderModule, linearClampSampler),
      passRoute: {
        input: 'scene',
        output: 'present',
      },
      position: {
        after: 'scene',
      },
    });

    renderer.passManager.registerPass({
      name: 'compute',
      passFactory: createComputePass(),
      position: {
        before: 'scene',
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

  installModules();

  const output = tony as TonyWithModules<M>;

  return output;
}

export { TonyGL, getAdapterInfo };
