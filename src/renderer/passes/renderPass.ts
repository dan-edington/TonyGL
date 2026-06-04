import { constants } from '../../constants/constants';
import { createPass } from './pass';
import type { Scene } from '../../sceneObjects/sceneObjects.types';
import type { Pass, PassContext, PassOptions, Renderer } from '../renderer.types';
import type { PerspectiveCamera } from '../../camera/camera.types';
import type { DrawableEntity } from '../../core/core.types';

type RenderPassOptions = PassOptions & {
  drawEntity(
    entity: DrawableEntity,
    passEncoder: GPURenderPassEncoder,
    renderer: Renderer,
    camera: PerspectiveCamera,
  ): void;
};

function createRenderPass(options: RenderPassOptions): Pass {
  const { renderer, drawEntity } = options;
  const { name, route } = createPass(options);

  function sortTransparentRenderListBackToFront(scene: Scene, camera: PerspectiveCamera) {
    if (!camera.position || camera.position.length < 3) {
      return;
    }

    const cx = camera.position[0];
    const cy = camera.position[1];
    const cz = camera.position[2];

    scene.transparentRenderList.sort((a, b) => {
      const adx = a.matrixWorld[12] - cx;
      const ady = a.matrixWorld[13] - cy;
      const adz = a.matrixWorld[14] - cz;
      const aDistSq = adx * adx + ady * ady + adz * adz;

      const bdx = b.matrixWorld[12] - cx;
      const bdy = b.matrixWorld[13] - cy;
      const bdz = b.matrixWorld[14] - cz;
      const bDistSq = bdx * bdx + bdy * bdy + bdz * bdz;

      // Draw far-to-near for alpha blending.
      return bDistSq - aDistSq;
    });
  }

  function buildRenderPassDescriptor(scene: Scene, passContext: PassContext): GPURenderPassDescriptor {
    const outputName = passContext.route.output;

    if (!outputName) {
      throw new Error('RenderPass route.output is not defined.');
    }

    const msaaEnabled = renderer.msaa > 1;

    const outputTarget = passContext.validateRenderTarget(
      outputName,
      passContext.width,
      passContext.height,
      constants.INTERNAL_COLOR_FORMAT,
    );

    const colorView = msaaEnabled ? renderer.multiSampleTexture.view : outputTarget.view;
    const resolveTarget = msaaEnabled ? outputTarget.view : undefined;

    return {
      label: name,
      colorAttachments: [
        {
          view: colorView,
          resolveTarget,
          loadOp: 'clear',
          storeOp: 'store',
          clearValue: scene.clearColor,
        },
      ],
      depthStencilAttachment: {
        view: renderer.depthTexture.view,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    };
  }

  function runPass(
    commandEncoder: GPUCommandEncoder,
    scene: Scene,
    camera: PerspectiveCamera,
    passContext: PassContext,
  ): void {
    const cameraWithBindGroup = camera as PerspectiveCamera;

    const pass = commandEncoder.beginRenderPass(buildRenderPassDescriptor(scene, passContext));
    pass.setBindGroup(constants.bindGroupIndices.CAMERA, cameraWithBindGroup.cameraUniformsBindGroup);
    pass.setBindGroup(constants.bindGroupIndices.SCENE, scene.sceneUniformsBindGroup);

    scene.opaqueRenderList.forEach((entity) => {
      drawEntity(entity, pass, renderer, camera);
    });

    sortTransparentRenderListBackToFront(scene, camera);

    scene.transparentRenderList.forEach((entity) => {
      drawEntity(entity, pass, renderer, camera);
    });

    pass.end();
  }

  return {
    name,
    route,
    runPass,
  };
}

export { createRenderPass };
