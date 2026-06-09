import { constants } from '../constants/constants';
import { mat4 } from 'wgpu-matrix';
import type { EntityOptions } from '../core/core.types';
import type { Geometry } from '../geometry/geometry.types';
import type { BaseMaterial } from '../materials/materials.types';
import type { InstanceMesh } from './sceneObjects.types';
import type { TonyModuleContext } from '../TonyGL.types';

export type InstanceMeshOptions = Omit<EntityOptions, 'type'>;

function InstanceMesh(context: TonyModuleContext) {
  const { renderer, createUniformBuffer, entityFactory } = context;

  function createInstanceMesh(
    geometry: Geometry,
    material: BaseMaterial,
    instanceCount: number = 1,
    options?: InstanceMeshOptions,
  ): InstanceMesh {
    const { entity: self, subscribe } = entityFactory<InstanceMesh>({
      ...options,
      type: 'InstanceMesh',
    });

    let instanceMatricesNeedUpload = true;
    let baseMatrixChanged = true;

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
        depthWriteEnabled: true,
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

    const matrixSize = self.matrixWorld.length;
    const instanceLocalMatrices = new Float32Array(matrixSize * instanceCount);
    const instanceWorldMatrices = new Float32Array(matrixSize * instanceCount);

    const identity = mat4.identity();
    for (let i = 0; i < instanceLocalMatrices.length; i += matrixSize) {
      instanceLocalMatrices.set(identity, i);
    }

    const entityUniformsBuffer = createUniformBuffer(
      {
        modelMatrix: { type: `array<mat4x4<f32>, ${instanceCount}>`, value: instanceWorldMatrices },
      },
      { addressSpace: 'storage' },
    );

    const entityUniformsBindGroup = renderer.device.createBindGroup({
      layout: renderer.bindGroupLayouts.entityBindGroupLayout,
      entries: [{ binding: 0, resource: { buffer: entityUniformsBuffer.buffer! } }],
    });

    function updateInstanceWorldMatrixAtIndex(index: number) {
      const offset = index * matrixSize;
      const local = instanceLocalMatrices.subarray(offset, offset + matrixSize);
      const world = instanceWorldMatrices.subarray(offset, offset + matrixSize);

      // Instance world matrix = InstanceMesh world matrix * per-instance local matrix.
      mat4.multiply(self.matrixWorld, local, world);
    }

    function updateAllInstanceWorldMatrices() {
      for (let i = 0; i < instanceCount; i++) {
        updateInstanceWorldMatrixAtIndex(i);
      }

      baseMatrixChanged = false;
      instanceMatricesNeedUpload = true;
    }

    function setMatrixAtIndex(matrix: ArrayLike<number>, index: number) {
      if (index < 0 || index >= instanceCount) {
        throw new Error(`Instance index ${index} out of bounds for count ${instanceCount}.`);
      }

      const offset = index * matrixSize;
      instanceLocalMatrices.set(matrix, offset);

      if (baseMatrixChanged) {
        // Base transform changed; defer full recomposition to the next draw.
        instanceMatricesNeedUpload = true;
        return;
      }

      updateInstanceWorldMatrixAtIndex(index);
      instanceMatricesNeedUpload = true;
    }

    function draw(pass: GPURenderPassEncoder): void {
      pass.setPipeline(pipeline);

      pass.setVertexBuffer(0, geometry.vertexBuffer!);
      pass.setVertexBuffer(1, geometry.normalBuffer!);
      pass.setVertexBuffer(2, geometry.uvBuffer!);
      pass.setVertexBuffer(3, geometry.tangentBuffer!);

      material.writeBuffers();

      if (baseMatrixChanged) {
        updateAllInstanceWorldMatrices();
      }

      if (instanceMatricesNeedUpload) {
        instanceMatricesNeedUpload = false;
        entityUniformsBuffer.updateUniforms({ modelMatrix: instanceWorldMatrices });
      }

      entityUniformsBuffer.writeUpdatedBufferData();

      pass.setBindGroup(constants.bindGroupIndices.ENTITY, entityUniformsBindGroup);

      if (material.materialUniformsBindGroup) {
        pass.setBindGroup(constants.bindGroupIndices.MATERIAL, material.materialUniformsBindGroup);
      }

      if (geometry.isIndexed && geometry.indexBuffer) {
        pass.setIndexBuffer(geometry.indexBuffer, geometry.indexFormat!);
        pass.drawIndexed(geometry.indexCount, instanceCount);
      } else {
        pass.draw(geometry.vertices.length / 3, instanceCount);
      }
    }

    function destroy() {
      material.destroy();
      entityUniformsBuffer.destroy();
      geometry.destroy();
    }

    self.geometry = geometry;
    self.material = material;
    self.instanceCount = instanceCount;
    self.pipeline = pipeline;
    self.entityUniformsBuffer = entityUniformsBuffer;
    self.entityUniformsBindGroup = entityUniformsBindGroup;
    self.setMatrixAtIndex = setMatrixAtIndex;
    self.draw = draw;
    self.destroy = destroy;

    // Recompose all instance matrices when the base entity transform changes.
    subscribe('onMatrixUpdated', () => {
      baseMatrixChanged = true;
      instanceMatricesNeedUpload = true;
    });

    updateAllInstanceWorldMatrices();
    entityUniformsBuffer.updateUniforms({ modelMatrix: instanceWorldMatrices });

    return self;
  }

  return {
    createInstanceMesh,
  };
}

export { InstanceMesh };
