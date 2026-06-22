import { mat4, vec3 } from 'wgpu-matrix';
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
  intersect: (object: Mesh) => boolean;
};

export type Ray = {
  direction: ArrayLike<number>;
  origin: ArrayLike<number>;
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

    function rayToObjectLocal(object: Mesh): Ray {
      const inverseMatrixWorld = mat4.inverse(object.matrixWorld);

      const originLocal = vec3.transformMat4(self.origin, inverseMatrixWorld);

      const worldEnd = vec3.add(self.origin, self.direction);

      const localEnd = vec3.transformMat4(worldEnd, inverseMatrixWorld);

      const directionLocal = vec3.normalize(vec3.sub(localEnd, originLocal));

      return {
        origin: originLocal,
        direction: directionLocal,
      };
    }

    function testBoundingSphere(object: Mesh, ray: Ray) {
      const { radius, center } = object.geometry.boundingSphere;
      const { direction, origin } = ray;

      const oc = [center[0] - origin[0], center[1] - origin[1], center[2] - origin[2]];
      const t = oc[0] * direction[0] + oc[1] * direction[1] + oc[2] * direction[2];

      if (t < self.near || t > self.far) {
        return false;
      }

      const n = [origin[0] + direction[0] * t, origin[1] + direction[1] * t, origin[2] + direction[2] * t];

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

    function testAABB(object: Mesh, ray: Ray) {
      const { min, max } = object.geometry.boundingBox;
      const { direction, origin } = ray;

      function getT(axis: 0 | 1 | 2): [number, number] | false {
        const EPSILON = 1e-8;
        let tMin, tMax;

        if (Math.abs(direction[axis]) < EPSILON) {
          if (origin[axis] < min[axis] || origin[axis] > max[axis]) {
            return false;
          }
          tMin = -Infinity;
          tMax = Infinity;
        } else {
          tMin = (min[axis] - origin[axis]) / direction[axis];
          tMax = (max[axis] - origin[axis]) / direction[axis];
        }

        const t: [number, number] = tMin > tMax ? [tMax, tMin] : [tMin, tMax];

        return t;
      }

      const tX = getT(0);
      if (!tX) return false;

      const tY = getT(1);
      if (!tY) return false;

      const tZ = getT(2);
      if (!tZ) return false;

      const entry = Math.max(tX[0], tY[0], tZ[0]);
      const exit = Math.min(tX[1], tY[1], tZ[1]);

      return entry <= exit;
    }

    function intersect(object: Mesh) {
      const localRay = rayToObjectLocal(object);

      if (!testBoundingSphere(object, localRay)) return false;
      if (!testAABB(object, localRay)) return false;

      // TODO: Test Triangles (Möller–Trumbore)

      return true;
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
