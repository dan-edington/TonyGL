import { constants } from '../constants/constants';
import type { CreateTextureFunction } from './renderer.types';

const createDepthTexture: CreateTextureFunction = function (device, canvasElement, msaa) {
  const depthTexture = device.createTexture({
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
    size: [canvasElement.width, canvasElement.height],
    sampleCount: msaa,
  });

  const depthTextureView = depthTexture.createView();

  return {
    texture: depthTexture,
    view: depthTextureView,
  };
};

const createMultiSampleTexture: CreateTextureFunction = function (device, canvasElement, msaa) {
  const multiSampleTexture = device.createTexture({
    format: constants.INTERNAL_COLOR_FORMAT,
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
    size: [canvasElement.width, canvasElement.height],
    sampleCount: msaa,
  });

  const multiSampleTextureView = multiSampleTexture.createView();

  return {
    texture: multiSampleTexture,
    view: multiSampleTextureView,
  };
};

export { createDepthTexture, createMultiSampleTexture };
