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
import type { Renderer, WebGPUBase } from './renderer.types';
import type { DrawableEntity } from '../core/core.types';
import type { TonyFullOptions, TonyOptions, TonySetupOnlyOptions } from '../TonyGL.types';

function configureRenderer(options: TonySetupOnlyOptions): Promise<WebGPUBase>;
function configureRenderer(options: TonyFullOptions): Promise<Renderer>;
async function configureRenderer(options: TonyOptions): Promise<Renderer | WebGPUBase> {
  const containerElement = options.containerElement ?? document.body;
  const alpha = options.alpha ?? false;

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

  const webGPUBase: WebGPUBase = {
    containerElement,
    canvasElement,
    context,
    device,
    adapter,
    presentationFormat,
  };

  if (options.webGPUSetupOnly) {
    return webGPUBase;
  }

  const dpr = options.dpr ?? window.devicePixelRatio;
  const msaa = options.multiSampling ?? 4;

  const multiSampleTexture = createMultiSampleTexture(device, canvasElement, msaa);
  const depthTexture = createDepthTexture(device, canvasElement, msaa);

  const { cameraBindGroupLayout, sceneBindGroupLayout, entityBindGroupLayout } = initializeBindGroupLayouts(device);

  const timers = {
    currentTime: 0,
    currentFrame: 0,
    elapsedTime: 0,
    deltaTime: 0,
  };

  const renderer = {
    ...webGPUBase,
    multiSampleTexture,
    depthTexture,
    msaa,
    alpha,
    dpr,
    bindGroupLayouts: {
      cameraBindGroupLayout,
      sceneBindGroupLayout,
      entityBindGroupLayout,
      materialBindGroupLayouts: null,
    },
    timers,
  } as Renderer;

  renderer.samplerLibrary = SamplerLibraryFactory(renderer);
  renderer.textureLibrary = TextureLibraryFactory(renderer);
  renderer.shaderLibrary = ShaderLibraryFactory(renderer);
  renderer.pipelineManager = PipelineManagerFactory(renderer);
  renderer.passManager = PassManagerFactory(renderer);
  renderer.passOrder = ['render', 'postprocessing'];

  const postProcessingShader = renderer.shaderLibrary.getShader('postprocessing');
  if (!postProcessingShader) throw new Error(errorMessages.missingShaderCode);

  const linearClampSampler = renderer.samplerLibrary.getSampler('linearClamp');
  if (!linearClampSampler) throw new Error(errorMessages.missingSamplerLibraryDevice);

  renderer.passManager.registerPass(
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

  renderer.passManager.registerPass(
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
