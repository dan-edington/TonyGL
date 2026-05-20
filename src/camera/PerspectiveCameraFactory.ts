import { mat4 } from 'wgpu-matrix';
import { Renderer } from '../renderer/configureRenderer';
import { Entity, EntityFactoryFunction, EntityOptions } from '../core/EntityFactory';
import { CreateUniformBufferFunction, UniformBuffer } from '../core/UniformBufferFactory';

export type PerspectiveCameraOptions = Omit<EntityOptions, 'type'> & {
  near?: number;
  far?: number;
  fov?: number;
  aspect?: number;
};

export type PerspectiveCamera = Entity & {
  near: number;
  far: number;
  fov: number;
  aspect: number;
  projectionMatrix: Float32Array;
  viewMatrix: Float32Array;
  viewProjectionMatrix: Float32Array;
  cameraUniformsBuffer: UniformBuffer;
  cameraUniformsBindGroup: GPUBindGroup;
  lookAt(target: ArrayLike<number>, up?: ArrayLike<number>): void;
  updateCameraUniforms(): void;
  updateProjectionMatrix(): void;
  destroy(): void;
};

function PerspectiveCameraFactory(
  renderer: Renderer,
  entityFactory: EntityFactoryFunction,
  createUniformBuffer: CreateUniformBufferFunction,
) {
  return function createPerspectiveCamera(options?: PerspectiveCameraOptions): PerspectiveCamera {
    const { entity, subscribe } = entityFactory({
      ...options,
      type: 'PerspectiveCamera',
    });

    let near = options?.near ?? 0.1;
    let far = options?.far ?? 1000;
    let fov = options?.fov ?? 75;
    let aspect = options?.aspect ?? 1;

    const projectionMatrix = mat4.perspective<Float32Array>(fov, aspect, near, far);
    const viewMatrix = mat4.inverse(entity.matrix);
    const viewProjectionMatrix = mat4.multiply(projectionMatrix, viewMatrix);

    const cameraUniformsBuffer = createUniformBuffer({
      viewProjectionMatrix: { type: 'mat4x4<f32>', value: viewProjectionMatrix },
      worldPosition: { type: 'vec3<f32>', value: entity.position },
    });

    const cameraUniformsBindGroup = renderer.device.createBindGroup({
      layout: renderer.bindGroupLayouts.cameraBindGroupLayout,
      entries: [{ binding: 0, resource: { buffer: cameraUniformsBuffer.buffer! } }],
    });

    let bufferNeedsUpdate = false;

    function syncViewProjectionFromEntityMatrix() {
      mat4.inverse(entity.matrix, viewMatrix);
      mat4.multiply(projectionMatrix, viewMatrix, viewProjectionMatrix);
      bufferNeedsUpdate = true;
    }

    function lookAt(target: ArrayLike<number>, up: ArrayLike<number> = [0, 1, 0]) {
      mat4.lookAt(entity.position, target, up, viewMatrix);
      mat4.inverse(viewMatrix, entity.matrix);

      if (entity.parent) {
        mat4.multiply(entity.parent.matrixWorld, entity.matrix, entity.matrixWorld);
      } else {
        mat4.copy(entity.matrix, entity.matrixWorld);
      }

      mat4.multiply(projectionMatrix, viewMatrix, viewProjectionMatrix);
      bufferNeedsUpdate = true;
    }

    function updateProjectionMatrix() {
      mat4.perspective<Float32Array>(fov, aspect, near, far, projectionMatrix);
      mat4.multiply(projectionMatrix, viewMatrix, viewProjectionMatrix);
      bufferNeedsUpdate = true;
    }

    function updateCameraUniforms() {
      if (!bufferNeedsUpdate) return;

      cameraUniformsBuffer.updateUniform({
        viewProjectionMatrix,
        worldPosition: entity.position,
      });

      cameraUniformsBuffer.writeUpdatedBufferData();
      bufferNeedsUpdate = false;
    }

    function destroy() {
      cameraUniformsBuffer.destroy();
    }

    const camera = Object.assign(entity, {
      projectionMatrix,
      viewMatrix,
      viewProjectionMatrix,
      cameraUniformsBuffer,
      cameraUniformsBindGroup,
      lookAt,
      updateProjectionMatrix,
      updateCameraUniforms,
      destroy,
    }) as PerspectiveCamera;

    subscribe('onTransformChanged', syncViewProjectionFromEntityMatrix);

    Object.defineProperties(camera, {
      near: {
        enumerable: true,
        configurable: true,
        get() {
          return near;
        },
        set(value: number) {
          if (near === value) return;
          near = value;
          updateProjectionMatrix();
        },
      },
      far: {
        enumerable: true,
        configurable: true,
        get() {
          return far;
        },
        set(value: number) {
          if (far === value) return;
          far = value;
          updateProjectionMatrix();
        },
      },
      fov: {
        enumerable: true,
        configurable: true,
        get() {
          return fov;
        },
        set(value: number) {
          if (fov === value) return;
          fov = value;
          updateProjectionMatrix();
        },
      },
      aspect: {
        enumerable: true,
        configurable: true,
        get() {
          return aspect;
        },
        set(value: number) {
          if (aspect === value) return;
          aspect = value;
          updateProjectionMatrix();
        },
      },
    });

    return camera;
  };
}

export { PerspectiveCameraFactory };
