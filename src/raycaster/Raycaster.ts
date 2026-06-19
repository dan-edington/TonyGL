import { Mesh } from '../sceneObjects/sceneObjects.types';
import { TonyModuleContext } from '../TonyGL.types';

export type RaycasterOptions = {
  origin: Float32Array;
  direction: Float32Array;
  near?: number;
  far?: number;
};

export type RaycastResult = {};

export type RaycasterObject = {
  origin: Float32Array;
  direction: Float32Array;
  near: number;
  far: number;
  set: (options: Partial<RaycasterOptions>) => void;
  intersect: (objects: Mesh | Mesh[]) => void;
};

function Raycaster(_context: TonyModuleContext) {
  function createRaycaster(options: RaycasterOptions): RaycasterObject {
    const origin = options.origin;
    const direction = options.direction;
    const near = options.near ?? 0;
    const far = options.far ?? Infinity;

    function set(options: Partial<RaycasterOptions>) {
      self.origin = options.origin ?? origin;
      self.direction = options.direction ?? direction;
      self.near = options.near ?? near;
      self.far = options.far ?? far;
    }

    function testObjectAgainstBoundingSphere(object: Mesh) {
      const { radius, center } = object.geometry.boundingSphere;

      const oc = [center[0] - self.origin[0], center[1] - self.origin[1], center[2] - self.origin[2]];
      const t = oc[0] * self.direction[0] + oc[1] * self.direction[1] + oc[2] * self.direction[2];

      if (t < self.near || t > self.far) {
        return false;
      }

      const n = [
        self.origin[0] + self.direction[0] * t,
        self.origin[1] + self.direction[1] * t,
        self.origin[2] + self.direction[2] * t,
      ];

      const dx = center[0] - n[0];
      const dy = center[1] - n[1];
      const dz = center[2] - n[2];

      const distanceSq = dx * dx + dy * dy + dz * dz;
      const radiusSq = radius * radius;

      if (distanceSq <= radiusSq) {
        return true;
      }

      return false;
    }

    function intersect(objects: Mesh | Mesh[]) {
      if (Array.isArray(objects)) {
        objects.map(testObjectAgainstBoundingSphere);
      } else {
        testObjectAgainstBoundingSphere(objects);
      }
    }

    const self: RaycasterObject = {
      origin,
      direction,
      near,
      far,
      set,
      intersect,
    };

    return self;
  }

  return {
    createRaycaster,
  };
}

export { Raycaster };
