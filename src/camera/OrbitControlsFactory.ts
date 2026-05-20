import { vec3 } from 'wgpu-matrix';
import type { PerspectiveCamera } from './PerspectiveCameraFactory';

export type OrbitControlsOptions = {
  camera: PerspectiveCamera;
  domElement?: HTMLElement;
  target?: ArrayLike<number>;
  rotationSpeed?: number;
};

export type OrbitControls = {
  camera: PerspectiveCamera;
  domElement: HTMLElement;
  target: Float32Array;
  isDragging: boolean;
  destroy(): void;
};

function OrbitControlsFactory(options: OrbitControlsOptions): OrbitControls {
  const camera = options.camera;
  const domElement = options.domElement ?? document.body;
  const target = new Float32Array(options.target ?? [0, 0, 0]);
  const rotationSpeed = options.rotationSpeed ?? 0.005;

  let isDragging = false;
  let radius = 0;
  const currentRotation = new Float32Array([0, 0]);
  const abortController = new AbortController();

  function updateCurrentRadiusAndRotation() {
    const cameraToTargetVector = vec3.sub(camera.position, target);
    radius = vec3.len(cameraToTargetVector);
    currentRotation[0] = Math.atan2(cameraToTargetVector[0], cameraToTargetVector[2]);
    currentRotation[1] = Math.asin(Math.max(-1, Math.min(1, cameraToTargetVector[1] / radius)));
  }

  function handleDrag(event: PointerEvent) {
    if (!isDragging) {
      domElement.removeEventListener('pointermove', handleDrag);
      return;
    }

    currentRotation[0] -= event.movementX * rotationSpeed;
    currentRotation[1] = Math.max(
      -Math.PI / 2 + 0.01,
      Math.min(Math.PI / 2 - 0.01, currentRotation[1] + event.movementY * rotationSpeed),
    );

    const cosVertical = Math.cos(currentRotation[1]);
    const cameraX = target[0] + radius * Math.sin(currentRotation[0]) * cosVertical;
    const cameraY = target[1] + radius * Math.sin(currentRotation[1]);
    const cameraZ = target[2] + radius * Math.cos(currentRotation[0]) * cosVertical;

    camera.setPosition([cameraX, cameraY, cameraZ]);
    camera.lookAt(target);
  }

  function handleDragStart() {
    isDragging = true;
    updateCurrentRadiusAndRotation();
    domElement.addEventListener('pointermove', handleDrag, { signal: abortController.signal });
  }

  function handleDragEnd() {
    isDragging = false;
  }

  domElement.addEventListener('pointerdown', handleDragStart, { signal: abortController.signal });
  domElement.addEventListener('pointerup', handleDragEnd, { signal: abortController.signal });
  domElement.addEventListener('pointerleave', handleDragEnd, { signal: abortController.signal });

  function destroy() {
    abortController.abort();
  }

  return {
    camera,
    domElement,
    target,
    get isDragging() {
      return isDragging;
    },
    destroy,
  };
}

export { OrbitControlsFactory };
