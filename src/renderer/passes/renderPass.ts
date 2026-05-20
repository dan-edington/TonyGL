import { constants } from '../../constants/constants';
import { Renderer } from '../configureRenderer';
import { Pass, PassContext, PassOptions, createPass } from './pass';
import { Scene } from '../../sceneObjects/SceneFactory';

type RenderPassOptions = PassOptions & {
  drawEntity(entity: unknown, passEncoder: GPURenderPassEncoder, renderer: Renderer): void;
};

function createRenderPass(options: RenderPassOptions): Pass {
  const { renderer, drawEntity } = options;
  const { name, route } = createPass(options);

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

  function runPass(commandEncoder: GPUCommandEncoder, scene: Scene, camera: unknown, passContext: PassContext): void {
    const cameraWithBindGroup = camera as { cameraUniformsBindGroup: GPUBindGroup };

    const pass = commandEncoder.beginRenderPass(buildRenderPassDescriptor(scene, passContext));
    pass.setBindGroup(constants.bindGroupIndices.CAMERA, cameraWithBindGroup.cameraUniformsBindGroup);
    pass.setBindGroup(constants.bindGroupIndices.SCENE, scene.sceneUniformsBindGroup);

    scene.renderList.forEach((entity) => {
      drawEntity(entity, pass, renderer);
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
