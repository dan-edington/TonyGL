import { constants } from '../constants/constants';
import type { EntityOptions } from '../core/core.types';
import type { Geometry } from '../geometry/geometry.types';
import type { BaseMaterial } from '../materials/materials.types';
import type { Mesh } from './sceneObjects.types';
import { TonyModuleContext } from '../TonyGL.types';

export type MeshOptions = Omit<EntityOptions, 'type'>;

function Mesh(context: TonyModuleContext) {
  const { renderer, createUniformBuffer, entityFactory } = context;

  function createMesh(geometry: Geometry, material: BaseMaterial, options?: MeshOptions): Mesh {
    const { entity: self, subscribe } = entityFactory<Mesh>({
      ...options,
      type: 'Mesh',
    });

    const materialBindGroupLayout =
      material.materialBindGroupLayout ?? renderer.bindGroupLayouts.materialBindGroupLayouts?.get(material.type);

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
        // Position
        {
          arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
          attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }],
        },
        // Normal
        {
          arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
          attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x3' }],
        },
        // UV
        {
          arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
          attributes: [{ shaderLocation: 2, offset: 0, format: 'float32x2' }],
        },
        // Tangent
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

    const entityUniformsBuffer = createUniformBuffer(
      {
        modelMatrix: { type: 'array<mat4x4<f32>, 1>', value: self.matrixWorld },
      },
      { addressSpace: 'storage' },
    );

    const entityUniformsBindGroup = renderer.device.createBindGroup({
      layout: renderer.bindGroupLayouts.entityBindGroupLayout,
      entries: [{ binding: 0, resource: { buffer: entityUniformsBuffer.buffer! } }],
    });

    function updateEntityBufferFromMatrix() {
      entityUniformsBuffer.updateUniforms({ modelMatrix: self.matrixWorld });
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
    self.draw = draw;
    self.destroy = destroy;

    // Keep GPU model matrix in sync with entity transforms and hierarchy changes.
    subscribe('onMatrixUpdated', updateEntityBufferFromMatrix);

    updateEntityBufferFromMatrix();

    return self;
  }

  return {
    createMesh,
  };
}

export { Mesh };
