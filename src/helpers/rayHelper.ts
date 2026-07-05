import { Mesh } from '../sceneObjects/Mesh';
import { LambertMaterial } from '../materials/LambertMaterial';
import { Geometry } from '../geometry/Geometry';
import type { Scene } from '../sceneObjects/sceneObjects.types';
import type { RaycasterObject } from '../raycaster/raycaster.types';
import type { ModulesToObject, Tony, TonyModuleContext, TonyModuleFactoryWithDependencies } from '../TonyGL.types';

const RayHelper = ((
  context: TonyModuleContext<Tony & ModulesToObject<[typeof Mesh, typeof Geometry, typeof LambertMaterial]>>,
) => {
  const { tony } = context;

  function createRayHelper(raycaster: RaycasterObject, scene: Scene) {
    const { origin, direction, near, far } = raycaster;

    const minFar = Math.min(far, Number.MAX_SAFE_INTEGER);

    const rayMaterial = tony.createLambertMaterial({
      color: [1, 1, 1, 1],
    });

    const rayGeometry = tony.createGeometry({
      topology: 'line-list',
      vertices: new Float32Array([
        origin[0] + near,
        origin[1] + near,
        origin[2] + near,
        origin[0] + near + direction[0] * minFar,
        origin[1] + near + direction[1] * minFar,
        origin[2] + near + direction[2] * minFar,
      ]),
    });

    const rayMesh = tony.createMesh(rayGeometry, rayMaterial);

    scene.add(rayMesh);
  }

  return {
    createRayHelper,
    __dependencies: [Mesh, Geometry, LambertMaterial],
  };
}) satisfies TonyModuleFactoryWithDependencies<[typeof Mesh, typeof Geometry, typeof LambertMaterial]>;

export { RayHelper };
