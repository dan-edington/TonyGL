import { mat4, vec3 } from 'wgpu-matrix';
import { Mesh } from '../sceneObjects/sceneObjects.types';
import type { Ray, RaycastResult, RaycasterObject, RaycasterOptions } from './raycaster.types';

function Raycaster() {
  function createRaycaster(options: RaycasterOptions): RaycasterObject {
    const origin = options.origin;
    const direction = options.direction;
    const near = options.near ?? 0;
    const far = options.far ?? Infinity;

    const EPSILON = 1e-8;

    function set(options: Partial<RaycasterOptions>) {
      self.origin = options.origin ?? self.origin;
      self.direction = options.direction ?? self.direction;
      self.near = options.near ?? self.near;
      self.far = options.far ?? self.far;
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

    function testBoundingSphere(object: Mesh, localRay: Ray) {
      const { radius, center } = object.geometry.boundingSphere;
      const { direction, origin } = localRay;

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

    function testAABB(object: Mesh, localRay: Ray) {
      const { min, max } = object.geometry.boundingBox;
      const { direction, origin } = localRay;

      function getT(axis: 0 | 1 | 2): [number, number] | false {
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

    function testTriangle(options: {
      triangleVertices: Float32Array[];
      triangleIndex: number;
      localRay: Ray;
      objectMatrixWorld: Float32Array;
      culled?: boolean;
    }): RaycastResult | false {
      const { triangleVertices, triangleIndex, localRay, objectMatrixWorld, culled = true } = options;

      let U, V, T;

      const edge1 = vec3.sub(triangleVertices[1], triangleVertices[0]);
      const edge2 = vec3.sub(triangleVertices[2], triangleVertices[0]);
      const pVec = vec3.cross(localRay.direction, edge2);
      const determinant = vec3.dot(edge1, pVec);

      if (culled) {
        // CULLED
        if (determinant < EPSILON) return false;
        const tVec = vec3.sub(localRay.origin, triangleVertices[0]);
        U = vec3.dot(tVec, pVec);
        if (U < 0 || U > determinant) return false;

        const qVec = vec3.cross(tVec, edge1);
        V = vec3.dot(localRay.direction, qVec);
        if (V < 0 || U + V > determinant) return false;

        T = vec3.dot(edge2, qVec);

        const inverseDeterminent = 1 / determinant;

        T *= inverseDeterminent;
        U *= inverseDeterminent;
        V *= inverseDeterminent;

        if (T < self.near || T > self.far) return false;
      } else {
        // NON CULLED
        if (determinant > -EPSILON && determinant < EPSILON) return false;

        const inverseDeterminent = 1 / determinant;

        const tVec = vec3.sub(localRay.origin, triangleVertices[0]);
        U = vec3.dot(tVec, pVec) * inverseDeterminent;
        if (U < 0 || U > 1) return false;

        const qVec = vec3.cross(tVec, edge1);
        V = vec3.dot(localRay.direction, qVec) * inverseDeterminent;
        if (V < 0 || U + V > 1) return false;

        T = vec3.dot(edge2, qVec) * inverseDeterminent;

        if (T < self.near || T > self.far) return false;
      }

      const pointLocal = vec3.add(localRay.origin, vec3.mulScalar(localRay.direction, T));
      const pointWorld = vec3.transformMat4(pointLocal, objectMatrixWorld);
      const distanceWorld = vec3.distance(pointWorld, self.origin);

      return {
        distance: distanceWorld,
        point: pointWorld,
        triangleIndex,
        uv: [U, V],
      };
    }

    function intersect(object: Mesh): RaycastResult[] | null {
      const localRay = rayToObjectLocal(object);

      if (!testBoundingSphere(object, localRay)) return null;
      if (!testAABB(object, localRay)) return null;

      const hits: RaycastResult[] = [];

      if (object.geometry.isIndexed) {
        const { vertices, indices } = object.geometry;

        for (let i = 0; i < indices!.length; i += 3) {
          const i1 = indices![i + 0] * 3;
          const i2 = indices![i + 1] * 3;
          const i3 = indices![i + 2] * 3;

          const v1 = new Float32Array([vertices[i1 + 0], vertices[i1 + 1], vertices[i1 + 2]]);

          const v2 = new Float32Array([vertices[i2 + 0], vertices[i2 + 1], vertices[i2 + 2]]);

          const v3 = new Float32Array([vertices[i3 + 0], vertices[i3 + 1], vertices[i3 + 2]]);

          const result = testTriangle({
            triangleVertices: [v1, v2, v3],
            triangleIndex: i,
            localRay,
            objectMatrixWorld: object.matrixWorld,
          });

          if (result) hits.push(result);
        }
      }

      hits.sort((a, b) => a.distance - b.distance);

      return hits;
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
