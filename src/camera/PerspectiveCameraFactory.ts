import { mat4 } from 'wgpu-matrix';
import type { PerspectiveCamera } from './camera.types';
import type { CreateUniformBufferFunction, EntityFactoryFunction, EntityOptions } from '../core/core.types';
import type { Renderer } from '../renderer/renderer.types';

export type PerspectiveCameraOptions = Omit<EntityOptions, 'type'> & {
  near?: number;
  far?: number;
  fov?: number;
  aspect?: number;
};

function PerspectiveCameraFactory(
  renderer: Renderer,
  entityFactory: EntityFactoryFunction,
  createUniformBuffer: CreateUniformBufferFunction,
) {
  return function createPerspectiveCamera(options?: PerspectiveCameraOptions): PerspectiveCamera {
    const { entity: self, subscribe } = entityFactory<PerspectiveCamera>({
      ...options,
      type: 'PerspectiveCamera',
    });

    let near = options?.near ?? 0.1;
    let far = options?.far ?? 1000;
    let fov = options?.fov ?? 75;
    let aspect = options?.aspect ?? 1;

    const projectionMatrix = mat4.perspective<Float32Array>(fov, aspect, near, far);
    const viewMatrix = mat4.inverse(self.matrix);
    const viewProjectionMatrix = mat4.multiply(projectionMatrix, viewMatrix);

    const cameraUniformsBuffer = createUniformBuffer({
      viewProjectionMatrix: { type: 'mat4x4<f32>', value: viewProjectionMatrix },
      worldPosition: { type: 'vec3<f32>', value: self.position },
    });

    const cameraUniformsBindGroup = renderer.device.createBindGroup({
      layout: renderer.bindGroupLayouts.cameraBindGroupLayout,
      entries: [{ binding: 0, resource: { buffer: cameraUniformsBuffer.buffer! } }],
    });

    let bufferNeedsUpdate = false;

    function syncViewProjectionFromEntityMatrix() {
      mat4.inverse(self.matrix, viewMatrix);
      mat4.multiply(projectionMatrix, viewMatrix, viewProjectionMatrix);
      bufferNeedsUpdate = true;
    }

    function lookAt(target: ArrayLike<number>, up: ArrayLike<number> = [0, 1, 0]) {
      mat4.lookAt(self.position, target, up, viewMatrix);
      mat4.inverse(viewMatrix, self.matrix);

      if (self.parent) {
        mat4.multiply(self.parent.matrixWorld, self.matrix, self.matrixWorld);
      } else {
        mat4.copy(self.matrix, self.matrixWorld);
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

      cameraUniformsBuffer.updateUniforms({
        viewProjectionMatrix,
        worldPosition: self.position,
      });

      cameraUniformsBuffer.writeUpdatedBufferData();
      bufferNeedsUpdate = false;
    }

    function destroy() {
      cameraUniformsBuffer.destroy();
    }

    self.projectionMatrix = projectionMatrix;
    self.viewMatrix = viewMatrix;
    self.viewProjectionMatrix = viewProjectionMatrix;
    self.cameraUniformsBuffer = cameraUniformsBuffer;
    self.cameraUniformsBindGroup = cameraUniformsBindGroup;
    self.lookAt = lookAt;
    self.updateProjectionMatrix = updateProjectionMatrix;
    self.updateCameraUniforms = updateCameraUniforms;
    self.destroy = destroy;

    subscribe('onTransformChanged', syncViewProjectionFromEntityMatrix);

    Object.defineProperties(self, {
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

    return self;
  };
}

export { PerspectiveCameraFactory };
