import { vec3 } from 'wgpu-matrix';
import type { OrbitControls, PerspectiveCamera } from './camera.types';

export type OrbitControlsOptions = {
  camera: PerspectiveCamera;
  domElement?: HTMLElement;
  target?: ArrayLike<number>;
  rotationSpeed?: number;
};

function OrbitControlsFactory(options: OrbitControlsOptions): OrbitControls {
  const camera = options.camera;
  const domElement = options.domElement ?? document.body;
  const target = new Float32Array(options.target ?? [0, 0, 0]);
  const rotationSpeed = options.rotationSpeed ?? 0.005;

  let radius = 0;
  const currentRotation = new Float32Array([0, 0]);
  const abortController = new AbortController();

  const self: OrbitControls = {
    camera,
    domElement,
    target,
    isDragging: false,
    destroy,
  };

  function updateCurrentRadiusAndRotation() {
    const cameraToTargetVector = vec3.sub(camera.position, target);
    radius = vec3.len(cameraToTargetVector);
    currentRotation[0] = Math.atan2(cameraToTargetVector[0], cameraToTargetVector[2]);
    currentRotation[1] = Math.asin(Math.max(-1, Math.min(1, cameraToTargetVector[1] / radius)));
  }

  function handleDrag(event: PointerEvent) {
    if (!self.isDragging) {
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
    self.isDragging = true;
    updateCurrentRadiusAndRotation();
    domElement.addEventListener('pointermove', handleDrag, { signal: abortController.signal });
  }

  function handleDragEnd() {
    self.isDragging = false;
  }

  domElement.addEventListener('pointerdown', handleDragStart, { signal: abortController.signal });
  domElement.addEventListener('pointerup', handleDragEnd, { signal: abortController.signal });
  domElement.addEventListener('pointerleave', handleDragEnd, { signal: abortController.signal });

  function destroy() {
    abortController.abort();
  }

  return self;
}

export { OrbitControlsFactory };
