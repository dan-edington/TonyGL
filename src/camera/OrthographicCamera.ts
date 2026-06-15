import { mat4 } from 'wgpu-matrix';
import type { OrthographicCamera, OrthographicCameraOptions } from './camera.types';
import { TonyModuleContext } from '../TonyGL.types';

function OrthographicCamera(context: TonyModuleContext) {
  const { renderer, entityFactory, createUniformBuffer } = context;

  function createOrthographicCamera(options?: OrthographicCameraOptions): OrthographicCamera {
    const { entity: self, subscribe } = entityFactory<OrthographicCamera>({
      ...options,
      type: 'OrthographicCamera',
    });

    let near = options?.near ?? 0.1;
    let far = options?.far ?? 1000;
    let top = options?.top ?? 1;
    let right = options?.right ?? 1;
    let bottom = options?.bottom ?? -1;
    let left = options?.left ?? -1;
    let aspect = renderer.canvasElement.width / renderer.canvasElement.height;

    const projectionMatrix = mat4.ortho<Float32Array>(left * aspect, right * aspect, bottom, top, near, far);
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
      const aspect = renderer.canvasElement.width / renderer.canvasElement.height;
      mat4.ortho<Float32Array>(left * aspect, right * aspect, bottom, top, near, far, projectionMatrix);
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
      left: {
        enumerable: true,
        configurable: true,
        get() {
          return left;
        },
        set(value: number) {
          if (left === value) return;
          left = value;
          updateProjectionMatrix();
        },
      },
      right: {
        enumerable: true,
        configurable: true,
        get() {
          return right;
        },
        set(value: number) {
          if (right === value) return;
          right = value;
          updateProjectionMatrix();
        },
      },
      top: {
        enumerable: true,
        configurable: true,
        get() {
          return top;
        },
        set(value: number) {
          if (top === value) return;
          top = value;
          updateProjectionMatrix();
        },
      },
      bottom: {
        enumerable: true,
        configurable: true,
        get() {
          return bottom;
        },
        set(value: number) {
          if (bottom === value) return;
          bottom = value;
          updateProjectionMatrix();
        },
      },
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
  }

  return {
    createOrthographicCamera,
  };
}

export { OrthographicCamera };
