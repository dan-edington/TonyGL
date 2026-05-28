import { constants } from '../constants/constants';
import type { EntityFactoryFunction, EntityOptions } from '../core/core.types';
import type { Geometry } from '../geometry/geometry.types';
import type { BaseMaterial } from '../materials/materials.types';
import type { CreateUniformBufferFunction } from '../core/core.types';
import type { Mesh } from './sceneObjects.types';
import type { Renderer } from '../renderer/renderer.types';

export type MeshOptions = Omit<EntityOptions, 'type'>;

function MeshFactory(
  renderer: Renderer,
  entityFactory: EntityFactoryFunction,
  createUniformBuffer: CreateUniformBufferFunction,
) {
  return function createMesh(geometry: Geometry, material: BaseMaterial, options?: MeshOptions): Mesh {
    const { entity: self } = entityFactory<Mesh>({
      ...options,
      type: 'Mesh',
    });

    const materialBindGroupLayout = renderer.bindGroupLayouts.materialBindGroupLayouts.get(material.type);

    if (!materialBindGroupLayout) {
      throw new Error(`Material bind group layout missing for type: ${material.type}`);
    }

    const pipeline = renderer.pipelineManager.getOrCreateRenderPipeline({
      label: `MeshPipeline_${material.type}`,
      shaderModule: material.shaderModule,
      topology: geometry.topology,
      format: constants.INTERNAL_COLOR_FORMAT,
      cullMode: material.doubleSided ? 'none' : 'back',
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
        {
          arrayStride: 4 * Float32Array.BYTES_PER_ELEMENT,
          attributes: [{ shaderLocation: 3, offset: 0, format: 'float32x4' }],
        },
      ],
      bindGroupLayouts: [
        renderer.bindGroupLayouts.cameraBindGroupLayout,
        renderer.bindGroupLayouts.sceneBindGroupLayout,
        materialBindGroupLayout,
        renderer.bindGroupLayouts.entityBindGroupLayout,
      ],
      depthStencilState: {
        format: 'depth24plus',
        depthWriteEnabled: material.transparent ? false : material.depthWrite,
        depthCompare: 'less',
      },
      blendState: material.usesAlphaPipeline
        ? {
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add',
            },
            alpha: {
              srcFactor: 'one',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add',
            },
          }
        : undefined,
    });

    const entityUniformsBuffer = createUniformBuffer({
      modelMatrix: { type: 'mat4x4<f32>', value: self.matrixWorld },
    });

    const entityUniformsBindGroup = renderer.device.createBindGroup({
      layout: renderer.bindGroupLayouts.entityBindGroupLayout,
      entries: [{ binding: 0, resource: { buffer: entityUniformsBuffer.buffer! } }],
    });

    const baseUpdateMatrix = self.updateMatrix;

    function updateEntityBufferFromMatrix() {
      entityUniformsBuffer.updateUniforms({ modelMatrix: self.matrixWorld });
    }

    function updateMatrix() {
      baseUpdateMatrix();
      updateEntityBufferFromMatrix();
    }

    function draw(pass: GPURenderPassEncoder): void {
      pass.setPipeline(pipeline);

      pass.setVertexBuffer(0, geometry.vertexBuffer!);
      pass.setVertexBuffer(1, geometry.normalBuffer!);
      pass.setVertexBuffer(2, geometry.uvBuffer!);
      pass.setVertexBuffer(3, geometry.tangentBuffer!);

      material.writeBuffers();
      entityUniformsBuffer.writeUpdatedBufferData();

      pass.setBindGroup(constants.bindGroupIndices.ENTITY, entityUniformsBindGroup);

      if (material.materialUniformsBindGroup) {
        pass.setBindGroup(constants.bindGroupIndices.MATERIAL, material.materialUniformsBindGroup);
      }

      if (geometry.isIndexed && geometry.indexBuffer) {
        pass.setIndexBuffer(geometry.indexBuffer, geometry.indexFormat!);
        pass.drawIndexed(geometry.indexCount);
      } else {
        pass.draw(geometry.vertices.length / 3);
      }
    }

    function destroy() {
      material.destroy();
      entityUniformsBuffer.destroy();
      geometry.destroy();
    }

    self.geometry = geometry;
    self.material = material;
    self.pipeline = pipeline;
    self.entityUniformsBuffer = entityUniformsBuffer;
    self.entityUniformsBindGroup = entityUniformsBindGroup;
    self.updateMatrix = updateMatrix;
    self.draw = draw;
    self.destroy = destroy;

    updateEntityBufferFromMatrix();

    return self;
  };
}

export { MeshFactory };
