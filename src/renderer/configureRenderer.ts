import { errorMessages } from '../constants/errorMessages';
import { initializeBindGroupLayouts } from './initializeBindGroupLayouts';
import { createDepthTexture, createMultiSampleTexture } from './internalTextures';
import type { Renderer, WebGPUBase } from './renderer.types';
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

  return renderer;
}

export { configureRenderer };
