import { errorMessages } from '../constants/errorMessages';
import { initializeBindGroupLayouts } from './initializeBindGroupLayouts';
import { createDepthTexture, createMultiSampleTexture } from './internalTextures';
import { PipelineManagerFactory, PipelineManager } from './PipelineManagerFactory';
import { PassManagerFactory, PassManager } from './PassManagerFactory';
import { SamplerLibraryFactory, SamplerLibrary } from './SamplerLibraryFactory';
import { TextureLibraryFactory, TextureLibrary } from './TextureLibraryFactory';
import { ShaderLibraryFactory, ShaderLibrary } from './ShaderLibraryFactory';
import { createRenderPass } from './passes/renderPass';
import { createPostProcessingPass } from './passes/postProcessingPass';
import type { RendererOptions } from '../TonyGL';

export type TextureAndView = {
  texture: GPUTexture;
  view: GPUTextureView;
};

export type Renderer = {
  containerElement: HTMLElement;
  canvasElement: HTMLCanvasElement;
  context: GPUCanvasContext;
  device: GPUDevice;
  adapter: GPUAdapter;
  presentationFormat: GPUTextureFormat;
  canvasTexture: GPUTexture;
  multiSampleTexture: TextureAndView;
  depthTexture: TextureAndView;
  msaa: number;
  alpha: boolean;
  dpr: number;
  bindGroupLayouts: {
    cameraBindGroupLayout: GPUBindGroupLayout;
    sceneBindGroupLayout: GPUBindGroupLayout;
    entityBindGroupLayout: GPUBindGroupLayout;
    materialBindGroupLayouts: Map<string, GPUBindGroupLayout>;
  };
  pipelineManager: PipelineManager;
  passManager: PassManager;
  passOrder: string[];
  samplerLibrary: SamplerLibrary;
  textureLibrary: TextureLibrary;
  shaderLibrary: ShaderLibrary;
  timers: {
    currentTime: number;
    currentFrame: number;
    elapsedTime: number;
    deltaTime: number;
  };
};

async function configureRenderer(options: RendererOptions): Promise<Renderer> {
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

  const baseRenderer = {
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

  const activePipelineManager = PipelineManagerFactory(baseRenderer);
  const createPassManager = PassManagerFactory(baseRenderer);
  const activePassManager = createPassManager();

  const samplerLibrary = SamplerLibraryFactory(baseRenderer);
  const textureLibrary = TextureLibraryFactory(baseRenderer);
  const shaderLibrary = ShaderLibraryFactory(baseRenderer);

  baseRenderer.pipelineManager = activePipelineManager;
  baseRenderer.passManager = activePassManager;
  baseRenderer.passOrder = ['render', 'postprocessing'];
  baseRenderer.samplerLibrary = samplerLibrary;
  baseRenderer.textureLibrary = textureLibrary;
  baseRenderer.shaderLibrary = shaderLibrary;

  const postProcessingShader = shaderLibrary.getShader('postprocessing');
  if (!postProcessingShader) throw new Error(errorMessages.missingShaderCode);

  const linearClampSampler = samplerLibrary.getSampler('linearClamp');
  if (!linearClampSampler) throw new Error(errorMessages.missingSamplerLibraryDevice);

  activePassManager.registerPass(
    'render',
    (passOptions) =>
      createRenderPass({
        ...passOptions,
        drawEntity(entity, passEncoder, rendererInstance) {
          const drawableEntity = entity as {
            draw?: (pass: GPURenderPassEncoder, renderer: Renderer) => void;
          };

          if (drawableEntity.draw) {
            drawableEntity.draw(passEncoder, rendererInstance);
          }
        },
      }),
    {
      input: null,
      output: 'scene',
      renderToSwapchain: false,
    },
  );

  activePassManager.registerPass(
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

  return baseRenderer;
}

export { configureRenderer };
