import { errorMessages } from '../constants/errorMessages';
import { initializeBindGroupLayouts } from './initializeBindGroupLayouts';
import { createDepthTexture, createMultiSampleTexture } from './internalTextures';
import { PipelineManagerFactory } from './PipelineManagerFactory';
import { PassManagerFactory } from './PassManagerFactory';
import { SamplerLibraryFactory } from './SamplerLibraryFactory';
import { TextureLibraryFactory } from './TextureLibraryFactory';
import { ShaderLibraryFactory } from './ShaderLibraryFactory';
import { createRenderPass } from './passes/renderPass';
import { createPostProcessingPass } from './passes/postProcessingPass';
import type { TonyOptions } from '../TonyGL';
import type { Renderer } from './renderer.types';
import type { DrawableEntity } from '../core/core.types';

async function configureRenderer(options: TonyOptions): Promise<Renderer> {
  const containerElement = options.containerElement ?? document.body;
  const dpr = options.dpr ?? window.devicePixelRatio;
  const alpha = options.alpha ?? false;
  const msaa = options.multiSampling ?? 4;

  const canvasElement = document.createElement('canvas');
  containerElement.appendChild(canvasElement);

  const context = canvasElement.getContext('webgpu');
  if (!context) throw new Error(errorMessages.contextRequest);

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error(errorMessages.adapterRequest);

  const device = await adapter.requestDevice({
    requiredFeatures: options.requiredFeatures,
    requiredLimits: options.requiredLimits,
  });
  if (!device) throw new Error(errorMessages.deviceRequest);

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  if (!presentationFormat) throw new Error(errorMessages.presentationFormatRequest);

  context.configure({
    device,
    format: presentationFormat,
    alphaMode: alpha ? 'premultiplied' : 'opaque',
  });

  const canvasTexture = context.getCurrentTexture();
  const multiSampleTexture = createMultiSampleTexture(device, canvasTexture, msaa);
  const depthTexture = createDepthTexture(device, canvasTexture, msaa);

  const { cameraBindGroupLayout, sceneBindGroupLayout, entityBindGroupLayout, materialBindGroupLayouts } =
    initializeBindGroupLayouts(device);

  const timers = {
    currentTime: 0,
    currentFrame: 0,
    elapsedTime: 0,
    deltaTime: 0,
  };

  const renderer = {
    containerElement,
    canvasElement,
    context,
    device,
    adapter,
    presentationFormat,
    canvasTexture,
    multiSampleTexture,
    depthTexture,
    msaa,
    alpha,
    dpr,
    bindGroupLayouts: {
      cameraBindGroupLayout,
      sceneBindGroupLayout,
      entityBindGroupLayout,
      materialBindGroupLayouts,
    },
    timers,
  } as Renderer;

  const activePipelineManager = PipelineManagerFactory(renderer);
  const createPassManager = PassManagerFactory(renderer);
  const passManager = createPassManager();

  const samplerLibrary = SamplerLibraryFactory(renderer);
  const textureLibrary = TextureLibraryFactory(renderer);
  const shaderLibrary = ShaderLibraryFactory(renderer);

  renderer.pipelineManager = activePipelineManager;
  renderer.passManager = passManager;
  renderer.passOrder = ['render', 'postprocessing'];
  renderer.samplerLibrary = samplerLibrary;
  renderer.textureLibrary = textureLibrary;
  renderer.shaderLibrary = shaderLibrary;

  const postProcessingShader = shaderLibrary.getShader('postprocessing');
  if (!postProcessingShader) throw new Error(errorMessages.missingShaderCode);

  const linearClampSampler = samplerLibrary.getSampler('linearClamp');
  if (!linearClampSampler) throw new Error(errorMessages.missingSamplerLibraryDevice);

  passManager.registerPass(
    'render',
    (passOptions) =>
      createRenderPass({
        ...passOptions,
        drawEntity(entity: DrawableEntity, passEncoder: GPURenderPassEncoder, rendererInstance: Renderer) {
          entity.draw(passEncoder, rendererInstance);
        },
      }),
    {
      input: null,
      output: 'scene',
      renderToSwapchain: false,
    },
  );

  passManager.registerPass(
    'postprocessing',
    (passOptions) =>
      createPostProcessingPass({
        ...passOptions,
        shaderModule: postProcessingShader.shaderModule,
        sampler: linearClampSampler,
      }),
    {
      input: 'scene',
      output: 'postprocess',
      renderToSwapchain: true,
    },
  );

  return renderer;
}

export { configureRenderer };
