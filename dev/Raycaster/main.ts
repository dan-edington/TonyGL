import '../style.css';
import { plane } from 'primitive-geometry';
import { PerspectiveCamera } from '../../src/camera/PerspectiveCamera';
import { OrbitControls } from '../../src/camera/OrbitControls';
import { Geometry } from '../../src/geometry/Geometry';
import { Scene } from '../../src/sceneObjects/Scene';
import { Group } from '../../src/sceneObjects/Group';
import { Mesh } from '../../src/sceneObjects/Mesh';
import { PointLight } from '../../src/lights/PointLight';
import { BlinnPhongMaterial } from '../../src/materials/BlinnPhongMaterial';
import { Raycaster } from '../../src/raycaster/Raycaster';
import { RayHelper } from '../../src/helpers/rayHelper';

import { TonyGL } from '../../src';

const container = document.getElementById('app');

if (container) {
  const info = document.createElement('pre');
  info.style.position = 'fixed';
  info.style.top = '8px';
  info.style.left = '8px';
  info.style.padding = '10px 12px';
  info.style.margin = '0';
  info.style.background = 'rgba(0, 0, 0, 0.55)';
  info.style.color = '#f4f7ff';
  info.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, monospace';
  info.style.fontSize = '12px';
  info.style.lineHeight = '1.5';
  info.style.borderRadius = '8px';
  info.style.zIndex = '20';
  info.style.pointerEvents = 'none';
  container.append(info);

  const tony = await TonyGL({
    containerElement: container,
    alpha: true,
    modules: [
      BlinnPhongMaterial,
      RayHelper,
      PerspectiveCamera,
      OrbitControls,
      Geometry,
      Scene,
      Group,
      Mesh,
      PointLight,
      Raycaster,
    ],
  });
  const scene = tony.createScene();
  scene.setClearColor([0.25, 0.25, 0.25, 1]);

  const camera = tony.createPerspectiveCamera({
    near: 0.1,
    far: 100,
    fov: (60 * Math.PI) / 180,
    aspect: container.clientWidth / container.clientHeight,
  });

  const planePrimitive = plane({ sx: 1.4, sy: 1.4, nx: 1, ny: 1 });

  const planeGeometry = tony.createGeometry({
    vertices: planePrimitive.positions,
    indices: Uint16Array.from(planePrimitive.cells),
    normals: planePrimitive.normals,
    uvs: planePrimitive.uvs,
  });

  const redMaterial = tony.createBlinnPhongMaterial({
    transparent: false,
    color: [1, 0.2, 0.2, 1],
    shininess: 40,
    specularColor: [1, 1, 1],
    specularStrength: 0.9,
  });
  const greenMaterial = tony.createBlinnPhongMaterial({
    transparent: false,
    color: [0.2, 1, 0.2, 1],
    shininess: 40,
    specularColor: [1, 1, 1],
    specularStrength: 0.9,
  });
  const blueMaterial = tony.createBlinnPhongMaterial({
    transparent: false,
    color: [0.2, 0.6, 1, 1],
    shininess: 40,
    specularColor: [1, 1, 1],
    specularStrength: 0.9,
  });

  const pointLight = tony.createPointLight({
    color: [1, 1, 1, 1],
    intensity: 4,
    range: 30,
  });
  pointLight.setPosition([2, 2, 2]);
  pointLight.visible = true;

  const rootTarget = tony.createMesh(planeGeometry, redMaterial, { name: 'root-target-z0' });
  rootTarget.setPosition([0, 0, 0]);

  const rayGroup = tony.createGroup({ name: 'ray-group' });
  rayGroup.setPosition([0, 0, -2]);

  const childNear = tony.createMesh(planeGeometry, greenMaterial, { name: 'group-child-near-z-2' });
  childNear.setPosition([0, 0, 0]);

  const childFar = tony.createMesh(planeGeometry, blueMaterial, { name: 'group-child-far-z-4' });
  childFar.setPosition([0, 0, -2]);

  rayGroup.add([childNear, childFar]);

  scene.add([rootTarget, rayGroup, pointLight]);
  scene.setAmbientLightColor([1, 1, 1, 1]);
  scene.setAmbientLightIntensity(0.2);

  camera.setPosition([0, 0, 5]);
  camera.lookAt([0, 0, 0]);
  tony.createOrbitControls({ camera, domElement: tony.renderer.canvasElement });

  const raycaster = tony.createRaycaster({
    origin: new Float32Array([0, 0, 5]),
    direction: new Float32Array([0, 0, -1]),
    near: 0,
    far: 10,
  });

  // The helper visualizes the ray as a line mesh in-scene.
  tony.createRayHelper(raycaster, scene, { color: [1, 1, 0.3, 1], maxDistance: 12 });

  let hasLoggedApiExamples = false;

  function normalize2(x: number, z: number) {
    const length = Math.hypot(x, z) || 1;
    return [x / length, z / length] as const;
  }

  function getNearestName(hits: ReturnType<typeof raycaster.intersect>) {
    if (!hits || hits.length === 0) return 'none';
    return hits[0].object.name ?? hits[0].object.id;
  }

  function getNearestDistance(hits: ReturnType<typeof raycaster.intersect>) {
    if (!hits || hits.length === 0) return 'n/a';
    return hits[0].distance.toFixed(3);
  }

  function render() {
    const time = performance.now() * 0.001;
    const originX = Math.sin(time * 0.7) * 0.45;
    const [dirX, dirZ] = normalize2(-originX * 0.35, -1);
    const far = 3 + (Math.sin(time * 0.85) * 0.5 + 0.5) * 7;

    raycaster.set({
      origin: new Float32Array([originX, 0, 5]),
      direction: new Float32Array([dirX, 0, dirZ]),
      near: 0,
      far,
    });

    const singleHits = raycaster.intersect(rootTarget);
    const arrayHits = raycaster.intersect([rootTarget, childNear, childFar]);
    const groupRecursiveHits = raycaster.intersect(rayGroup, { recursive: true });
    const groupNonRecursiveHits = raycaster.intersect(rayGroup, { recursive: false });

    info.textContent = [
      'Raycaster Demo API Coverage',
      '',
      `ray.set: origin=[${raycaster.origin[0].toFixed(2)}, ${raycaster.origin[1].toFixed(2)}, ${raycaster.origin[2].toFixed(2)}]`,
      `         dir=[${raycaster.direction[0].toFixed(2)}, ${raycaster.direction[1].toFixed(2)}, ${raycaster.direction[2].toFixed(2)}] near=${raycaster.near.toFixed(2)} far=${raycaster.far.toFixed(2)}`,
      '',
      `intersect(single): count=${singleHits?.length ?? 0} nearest=${getNearestName(singleHits)} distance=${getNearestDistance(singleHits)}`,
      `intersect(array):  count=${arrayHits?.length ?? 0} nearest=${getNearestName(arrayHits)} distance=${getNearestDistance(arrayHits)}`,
      `intersect(group, recursive:true):  count=${groupRecursiveHits?.length ?? 0} nearest=${getNearestName(groupRecursiveHits)}`,
      `intersect(group, recursive:false): count=${groupNonRecursiveHits?.length ?? 0} (expected 0: group has no geometry)`,
      '',
      'RayHelper: visible white debug ray is created via tony.createRayHelper(raycaster, scene)',
      'Tip: orbit camera and watch counts/distances change as the ray sweeps and far changes.',
    ].join('\n');

    if (!hasLoggedApiExamples) {
      hasLoggedApiExamples = true;
      console.log('Raycaster API sample results', {
        singleHits,
        arrayHits,
        groupRecursiveHits,
        groupNonRecursiveHits,
      });
    }

    tony.render(scene, camera);
    requestAnimationFrame(render);
  }

  render();

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
  });
}
