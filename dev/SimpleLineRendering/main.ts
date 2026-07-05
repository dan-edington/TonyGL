import '../style.css';
import { PerspectiveCamera } from '../../src/camera/PerspectiveCamera';
import { OrbitControls } from '../../src/camera/OrbitControls';
import { Geometry } from '../../src/geometry/Geometry';
import { Scene } from '../../src/sceneObjects/Scene';
import { Mesh } from '../../src/sceneObjects/Mesh';
import { LambertMaterial } from '../../src/materials/LambertMaterial';

import { TonyGL } from '../../src';

const container = document.getElementById('app');

if (container) {
  const tony = await TonyGL({
    containerElement: container,
    alpha: true,
    modules: [LambertMaterial, PerspectiveCamera, OrbitControls, Geometry, Scene, Mesh],
  });
  const scene = tony.createScene();
  scene.setClearColor([0.25, 0.25, 0.25, 1]);

  const camera = tony.createPerspectiveCamera({
    near: 0.1,
    far: 100,
    fov: (60 * Math.PI) / 180,
    aspect: container.clientWidth / container.clientHeight,
  });

  const lineGeometry = tony.createGeometry({
    topology: 'line-list',
    vertices: new Float32Array([0, 0, 0, 0, 1, 0, 1, 1, 0]),
    indices: new Uint16Array([0, 1, 1, 2]),
  });

  const lineMaterial = tony.createLambertMaterial({
    color: [1, 0, 0, 1],
  });

  const lineMesh = tony.createMesh(lineGeometry, lineMaterial);

  scene.add([lineMesh]);
  scene.setAmbientLightIntensity(1);

  camera.setPosition([0, 0, 5]);
  camera.lookAt([0, 0, 0]);
  tony.createOrbitControls({ camera, domElement: tony.renderer.canvasElement });

  function render() {
    tony.render(scene, camera);
    requestAnimationFrame(render);
  }

  render();

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
  });
}
