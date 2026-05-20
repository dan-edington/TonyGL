import { constants } from '../../constants/constants';
import { postProcessingBindGroupLayoutDescriptor } from '../bindGroupLayouts/postprocessing';
import { GeometryFactory } from '../../geometry/GeometryFactory';
import { PipelineManagerFactory } from '../PipelineManagerFactory';
import { Pass, PassContext, PassOptions, createPass } from './pass';
import { Scene } from '../../sceneObjects/SceneFactory';

type PostProcessingPassOptions = PassOptions & {
  shaderModule: GPUShaderModule;
  sampler: GPUSampler;
};

function createPostProcessingPass(options: PostProcessingPassOptions): Pass {
  const { renderer, shaderModule, sampler } = options;
  const { name, route } = createPass({
    ...options,
    passRoute: {
      renderToSwapchain: true,
      ...options.passRoute,
    },
  });

  const createGeometry = GeometryFactory(renderer);
  const { getOrCreateRenderPipeline } = PipelineManagerFactory(renderer);

  const geometry = createGeometry({
    vertices: new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]),
    uvs: new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]),
    indices: new Uint16Array([0, 1, 2, 2, 1, 3]),
    normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
  });

  const bindGroupLayout = renderer.device.createBindGroupLayout(postProcessingBindGroupLayoutDescriptor);

  const pipeline = getOrCreateRenderPipeline({
    label: 'PostProcessing Pipeline',
    shaderModule,
    topology: 'triangle-list',
    format: renderer.presentationFormat,
    cullMode: 'back',
    vertexBuffers: [
      {
        arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
        attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }],
      },
      {
        arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
        attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x3' }],
      },
      {
        arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
        attributes: [{ shaderLocation: 2, offset: 0, format: 'float32x2' }],
      },
    ],
    bindGroupLayouts: [bindGroupLayout],
    msaa: 1,
  });

  let bindGroup: GPUBindGroup | null = null;
  let boundInputView: GPUTextureView | null = null;

  function buildBindGroup(inputView: GPUTextureView): GPUBindGroup {
    return renderer.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(constants.bindGroupIndices.POSTPROCESSING),
      entries: [
        { binding: 0, resource: sampler },
        { binding: 1, resource: inputView },
      ],
    });
  }

  function buildPassDescriptor(scene: Scene, passContext: PassContext): GPURenderPassDescriptor {
    return {
      label: name,
      colorAttachments: [
        {
          view: passContext.getSwapChainView(),
          loadOp: 'clear',
          storeOp: 'store',
          clearValue: scene.clearColor,
        },
      ],
    };
  }

  function runPass(commandEncoder: GPUCommandEncoder, scene: Scene, _camera: unknown, passContext: PassContext): void {
    const inputName = route.input;

    if (!inputName) {
      throw new Error('PostProcessingPass route.input is not set');
    }

    const inputTarget = passContext.getRenderTarget(inputName);

    if (!inputTarget) {
      throw new Error(`PostProcessingPass: render target "${inputName}" not found`);
    }

    if (!bindGroup || boundInputView !== inputTarget.view) {
      bindGroup = buildBindGroup(inputTarget.view);
      boundInputView = inputTarget.view;
    }

    const pass = commandEncoder.beginRenderPass(buildPassDescriptor(scene, passContext));

    pass.setPipeline(pipeline);
    pass.setBindGroup(constants.bindGroupIndices.POSTPROCESSING, bindGroup);

    pass.setVertexBuffer(0, geometry.vertexBuffer);
    pass.setVertexBuffer(1, geometry.normalBuffer);
    pass.setVertexBuffer(2, geometry.uvBuffer);

    if (!geometry.indexBuffer || !geometry.indexFormat) {
      throw new Error('PostProcessing geometry index data missing');
    }

    pass.setIndexBuffer(geometry.indexBuffer, geometry.indexFormat);
    pass.drawIndexed(geometry.indexCount);
    pass.end();
  }

  return {
    name,
    route,
    runPass,
  };
}

export { createPostProcessingPass };
