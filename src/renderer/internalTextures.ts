import { constants } from '../constants/constants';
import { TextureAndView } from './configureRenderer';

type CreateTextureFunction = (device: GPUDevice, canvasTexture: GPUTexture, msaa: number) => TextureAndView;

const createDepthTexture: CreateTextureFunction = function (device, canvasTexture, msaa) {
  const depthTexture = device.createTexture({
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
    size: [canvasTexture.width, canvasTexture.height],
    sampleCount: msaa,
  });

  const depthTextureView = depthTexture.createView();

  return {
    texture: depthTexture,
    view: depthTextureView,
  };
};

const createMultiSampleTexture: CreateTextureFunction = function (device, canvasTexture, msaa) {
  const multiSampleTexture = device.createTexture({
    format: constants.INTERNAL_COLOR_FORMAT,
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
    size: [canvasTexture.width, canvasTexture.height],
    sampleCount: msaa,
  });

  const multiSampleTextureView = multiSampleTexture.createView();

  return {
    texture: multiSampleTexture,
    view: multiSampleTextureView,
  };
};

export { createDepthTexture, createMultiSampleTexture };
