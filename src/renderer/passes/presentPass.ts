import { constants } from '../../constants/constants';
import { presentPassBindGroupLayoutDescriptor } from '../bindGroupLayouts/present';
import { PipelineManagerFactory } from '../PipelineManagerFactory';
import { createPass } from './pass';
import type { Scene } from '../../sceneObjects/sceneObjects.types';
import type { RenderPass, PassContext, PassOptions } from '../renderer.types';

type PresentPassOptions = PassOptions & {
  shaderModule: GPUShaderModule;
  sampler: GPUSampler;
};

function createPresentPass(options: PresentPassOptions): RenderPass {
  const { renderer, shaderModule, sampler } = options;
  const { name, route } = createPass({
    ...options,
    passRoute: {
      renderToSwapchain: true,
      ...options.passRoute,
    },
  });

  const { getOrCreateRenderPipeline } = PipelineManagerFactory(renderer);

  const geometry = {
    vertices: new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]),
    uvs: new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]),
    indices: new Uint16Array([0, 1, 2, 2, 1, 3]),
    normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
  };

  const vertexBuffer = renderer.device.createBuffer({
    size: geometry.vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  renderer.device.queue.writeBuffer(vertexBuffer, 0, geometry.vertices.buffer);

  const indexBuffer = renderer.device.createBuffer({
    size: geometry.indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  renderer.device.queue.writeBuffer(indexBuffer, 0, geometry.indices.buffer);

  const uvBuffer = renderer.device.createBuffer({
    size: geometry.uvs.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  renderer.device.queue.writeBuffer(uvBuffer, 0, geometry.uvs.buffer);

  const normalBuffer = renderer.device.createBuffer({
    size: geometry.normals.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  renderer.device.queue.writeBuffer(normalBuffer, 0, geometry.normals.buffer);

  const bindGroupLayout = renderer.device.createBindGroupLayout(presentPassBindGroupLayoutDescriptor);

  const pipeline = getOrCreateRenderPipeline({
    label: 'Present Pass Pipeline',
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
      layout: pipeline.getBindGroupLayout(constants.bindGroupIndices.PRESENT),
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
      throw new Error('Present Pass route.input is not set');
    }

    const inputTarget = passContext.getRenderTarget(inputName);

    if (!inputTarget) {
      throw new Error(`Present Pass: render target "${inputName}" not found`);
    }

    if (!bindGroup || boundInputView !== inputTarget.view) {
      bindGroup = buildBindGroup(inputTarget.view);
      boundInputView = inputTarget.view;
    }

    const pass = commandEncoder.beginRenderPass(buildPassDescriptor(scene, passContext));

    pass.setPipeline(pipeline);
    pass.setBindGroup(constants.bindGroupIndices.PRESENT, bindGroup);

    pass.setVertexBuffer(0, vertexBuffer);
    pass.setVertexBuffer(1, normalBuffer);
    pass.setVertexBuffer(2, uvBuffer);

    pass.setIndexBuffer(indexBuffer, 'uint16');

    pass.drawIndexed(geometry.indices.length);

    pass.end();
  }

  return {
    name,
    route,
    runPass,
    type: 'Render',
  };
}

export { createPresentPass };
