import { Renderer } from './configureRenderer';
import { createMultiSampleTexture, createDepthTexture } from './internalTextures';

function setupRendererEventListeners(renderer: Renderer) {
  const abortController = new AbortController();

  window.addEventListener('resize', updateCanvasSize, { signal: abortController.signal });

  updateCanvasSize();

  function updateCanvasSize() {
    const { device, canvasElement, containerElement, dpr, msaa } = renderer;

    canvasElement.width = Math.floor(containerElement.clientWidth * dpr);
    canvasElement.height = Math.floor(containerElement.clientHeight * dpr);

    renderer.canvasTexture = renderer.context.getCurrentTexture();

    renderer.multiSampleTexture.texture.destroy();
    renderer.multiSampleTexture = createMultiSampleTexture(device, renderer.canvasTexture, msaa);

    renderer.depthTexture.texture.destroy();
    renderer.depthTexture = createDepthTexture(device, renderer.canvasTexture, msaa);

    renderer.passManager.resizeRenderTargets(canvasElement.width, canvasElement.height);
  }

  return {
    rendererEventsAbortController: abortController,
  };
}

export { setupRendererEventListeners };
