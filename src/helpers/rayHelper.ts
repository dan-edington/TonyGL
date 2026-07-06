import { Mesh } from '../sceneObjects/Mesh';
import { LambertMaterial } from '../materials/LambertMaterial';
import { Geometry } from '../geometry/Geometry';
import type { Mesh as MeshObject, Scene } from '../sceneObjects/sceneObjects.types';
import type { RaycasterObject } from '../raycaster/raycaster.types';
import type { ModulesToObject, Tony, TonyModuleContext, TonyModuleFactoryWithDependencies } from '../TonyGL.types';

export type RayHelperOptions = {
  color?: ArrayLike<number>;
  maxDistance?: number;
};

export type RayHelperObject = {
  mesh: MeshObject;
  update: () => void;
  destroy: () => void;
};

const RayHelper = ((
  context: TonyModuleContext<Tony & ModulesToObject<[typeof Mesh, typeof Geometry, typeof LambertMaterial]>>,
) => {
  const { tony, renderer } = context;

  function createRayHelper(raycaster: RaycasterObject, scene: Scene, options: RayHelperOptions = {}): RayHelperObject {
    const maxDistance = options.maxDistance ?? 100;
    const vertices = new Float32Array(6);

    function getFiniteFarDistance() {
      if (!Number.isFinite(raycaster.far)) return maxDistance;
      return Math.min(raycaster.far, maxDistance);
    }

    function writeRayVertices() {
      const { origin, direction, near } = raycaster;
      const farDistance = getFiniteFarDistance();

      vertices[0] = origin[0] + direction[0] * near;
      vertices[1] = origin[1] + direction[1] * near;
      vertices[2] = origin[2] + direction[2] * near;
      vertices[3] = origin[0] + direction[0] * farDistance;
      vertices[4] = origin[1] + direction[1] * farDistance;
      vertices[5] = origin[2] + direction[2] * farDistance;
    }

    writeRayVertices();

    const rayMaterial = tony.createLambertMaterial({
      color: options.color ?? [1, 1, 1, 1],
    });

    const rayGeometry = tony.createGeometry({
      topology: 'line-list',
      vertices: vertices.slice(),
    });

    const rayMesh = tony.createMesh(rayGeometry, rayMaterial);

    scene.add(rayMesh);

    const originalSet = raycaster.set.bind(raycaster);
    const reactiveProps = ['origin', 'direction', 'near', 'far'] as const;
    const originalPropertyDescriptors = new Map<string, PropertyDescriptor | undefined>();

    function update() {
      writeRayVertices();
      rayGeometry.vertices.set(vertices);

      if (rayGeometry.vertexBuffer) {
        renderer.device.queue.writeBuffer(rayGeometry.vertexBuffer, 0, rayGeometry.vertices.buffer);
      }
    }

    raycaster.set = (nextOptions) => {
      originalSet(nextOptions);
      update();
    };

    reactiveProps.forEach((prop) => {
      const descriptor = Object.getOwnPropertyDescriptor(raycaster, prop);
      originalPropertyDescriptors.set(prop, descriptor);

      let currentValue = raycaster[prop];

      Object.defineProperty(raycaster, prop, {
        configurable: true,
        enumerable: true,
        get() {
          return currentValue;
        },
        set(nextValue) {
          currentValue = nextValue;
          update();
        },
      });
    });

    function destroy() {
      raycaster.set = originalSet;

      reactiveProps.forEach((prop) => {
        const latestValue = raycaster[prop];
        const originalDescriptor = originalPropertyDescriptors.get(prop);

        if (originalDescriptor) {
          Object.defineProperty(raycaster, prop, {
            ...originalDescriptor,
            ...(Object.prototype.hasOwnProperty.call(originalDescriptor, 'value') ? { value: latestValue } : {}),
          });
          return;
        }

        Object.defineProperty(raycaster, prop, {
          configurable: true,
          enumerable: true,
          writable: true,
          value: latestValue,
        });
      });

      scene.remove(rayMesh);
      rayMesh.destroy();
    }

    return {
      mesh: rayMesh,
      update,
      destroy,
    };
  }

  return {
    createRayHelper,
    __dependencies: [Mesh, Geometry, LambertMaterial],
  };
}) satisfies TonyModuleFactoryWithDependencies<[typeof Mesh, typeof Geometry, typeof LambertMaterial]>;

export { RayHelper };
