import { createMultiSampleTexture, createDepthTexture } from './internalTextures';
import type { Renderer } from './renderer.types';

function setupRendererEventListeners(renderer: Renderer) {
  const rendererEventsAbortController = new AbortController();

  window.addEventListener('resize', updateCanvasSize, { signal: rendererEventsAbortController.signal });

  updateCanvasSize();

  function updateCanvasSize() {
    const { device, canvasElement, containerElement, dpr, msaa } = renderer;

    canvasElement.width = Math.floor(containerElement.clientWidth * dpr);
    canvasElement.height = Math.floor(containerElement.clientHeight * dpr);

    renderer.multiSampleTexture.texture.destroy();
    renderer.multiSampleTexture = createMultiSampleTexture(device, renderer.canvasElement, msaa);

    renderer.depthTexture.texture.destroy();
    renderer.depthTexture = createDepthTexture(device, renderer.canvasElement, msaa);

    renderer.passManager.resizeRenderTargets(canvasElement.width, canvasElement.height);
  }

  return rendererEventsAbortController;
}

export { setupRendererEventListeners };
