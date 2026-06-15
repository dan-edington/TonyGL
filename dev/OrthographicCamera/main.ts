import '../style.css';
import { sphere } from 'primitive-geometry';
import { Pane } from 'tweakpane';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import { OrthographicCamera } from '../../src/camera/OrthographicCamera';
import { OrbitControls } from '../../src/camera/OrbitControls';
import { Geometry } from '../../src/geometry/Geometry';
import { Scene } from '../../src/sceneObjects/Scene';
import { Mesh } from '../../src/sceneObjects/Mesh';
import { PointLight } from '../../src/lights/PointLight';
import { BlinnPhongMaterial } from '../../src/materials/BlinnPhongMaterial';

import { TonyGL } from '../../src';

const container = document.getElementById('app');

const pane = new Pane();
pane.registerPlugin(EssentialsPlugin);

if (container) {
  const tony = await TonyGL({
    containerElement: container,
    alpha: true,
    modules: [BlinnPhongMaterial, OrthographicCamera, OrbitControls, Geometry, Scene, Mesh, PointLight],
  });
  const scene = tony.createScene();
  scene.setClearColor([0.25, 0.25, 0.25, 1]);

  const orthoBounds = 4;

  const camera = tony.createOrthographicCamera({
    near: 0.1,
    far: 100,
    left: -orthoBounds,
    top: orthoBounds,
    right: orthoBounds,
    bottom: -orthoBounds,
  });

  const spherePrimitive = sphere({ radius: 1, nx: 32, ny: 32 });
  const sphereGeometry = tony.createGeometry({
    vertices: spherePrimitive.positions,
    indices: Uint16Array.from(spherePrimitive.cells),
    normals: spherePrimitive.normals,
    uvs: spherePrimitive.uvs,
  });

  const ambientParams = {
    color: { r: 1, g: 1, b: 1, a: 1 },
    intensity: 0,
  };

  const cameraParams = {
    x: 0,
    y: 0,
    z: 30,
    left: -orthoBounds,
    right: orthoBounds,
    top: orthoBounds,
    bottom: -orthoBounds,
    zoomMultiplier: 1,
  };

  const blinnPhongMaterial = tony.createBlinnPhongMaterial({
    transparent: true,
    color: [1, 0, 0, 1],
    shininess: 48,
    specularColor: [1, 1, 1],
    specularStrength: 1,
  });

  const pointLight = tony.createPointLight({
    color: [1, 1, 1, 1],
    intensity: 4,
    range: 30,
  });
  pointLight.setPosition([2, 2, 2]);
  pointLight.visible = true;

  const sphereMesh = tony.createMesh(sphereGeometry, blinnPhongMaterial);

  scene.add([sphereMesh, pointLight]);
  scene.setAmbientLightColor([
    ambientParams.color.r,
    ambientParams.color.g,
    ambientParams.color.b,
    ambientParams.color.a,
  ]);
  scene.setAmbientLightIntensity(ambientParams.intensity);

  function applyCameraControls() {
    const safeZoomMultiplier = Math.max(cameraParams.zoomMultiplier, 0.01);
    const zoomScale = 1 / safeZoomMultiplier;

    camera.setPosition([cameraParams.x, cameraParams.y, cameraParams.z]);
    camera.left = cameraParams.left * zoomScale;
    camera.right = cameraParams.right * zoomScale;
    camera.top = cameraParams.top * zoomScale;
    camera.bottom = cameraParams.bottom * zoomScale;
  }

  applyCameraControls();
  // camera.lookAt([0, 0, 0]);
  // tony.createOrbitControls({ camera, domElement: tony.renderer.canvasElement });

  function render() {
    tony.render(scene, camera);
    requestAnimationFrame(render);
  }

  render();

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
  });

  const paneApi: any = pane;
  const cameraFolder = paneApi.addFolder ? paneApi.addFolder({ title: 'Camera Controls' }) : paneApi;

  cameraFolder.addBinding(cameraParams, 'x', { min: -50, max: 50, step: 0.01 }).on('change', applyCameraControls);
  cameraFolder.addBinding(cameraParams, 'y', { min: -50, max: 50, step: 0.01 }).on('change', applyCameraControls);
  cameraFolder.addBinding(cameraParams, 'z', { min: -50, max: 50, step: 0.01 }).on('change', applyCameraControls);

  cameraFolder.addBinding(cameraParams, 'left', { min: -50, max: 0, step: 0.01 }).on('change', applyCameraControls);
  cameraFolder.addBinding(cameraParams, 'right', { min: 0, max: 50, step: 0.01 }).on('change', applyCameraControls);
  cameraFolder.addBinding(cameraParams, 'top', { min: 0, max: 50, step: 0.01 }).on('change', applyCameraControls);
  cameraFolder.addBinding(cameraParams, 'bottom', { min: -50, max: 0, step: 0.01 }).on('change', applyCameraControls);
  cameraFolder
    .addBinding(cameraParams, 'zoomMultiplier', { min: 0.1, max: 10, step: 0.01 })
    .on('change', applyCameraControls);
}
