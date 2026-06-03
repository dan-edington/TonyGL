import '../style.css';
import { plane } from 'primitive-geometry';
import { Pane } from 'tweakpane';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';

import { TonyGL } from '../../src';
import { PerspectiveCamera } from '../../src/camera/PerspectiveCamera';
import { OrbitControls } from '../../src/camera/OrbitControls';
import { Geometry } from '../../src/geometry/Geometry';
import { Scene } from '../../src/sceneObjects/Scene';
import { Mesh } from '../../src/sceneObjects/Mesh';
import { SpotLight } from '../../src/lights/SpotLight';
import { LambertMaterial } from '../../src/materials/LambertMaterial';

const container = document.getElementById('app');

const pane = new Pane();
pane.registerPlugin(EssentialsPlugin);

if (container) {
  const tony = await TonyGL({
    containerElement: container,
    alpha: true,
    modules: [PerspectiveCamera, OrbitControls, Geometry, Scene, Mesh, SpotLight, LambertMaterial],
  });
  const scene = tony.createScene();
  scene.setClearColor([0.25, 0.25, 0.25, 1]);

  const camera = tony.createPerspectiveCamera({
    near: 0.1,
    far: 100,
    fov: (60 * Math.PI) / 180,
    aspect: container.clientWidth / container.clientHeight,
  });

  const planePrimitive = plane({ sx: 5, sy: 5 });
  const planeGeometry = tony.createGeometry({
    vertices: planePrimitive.positions,
    indices: Uint16Array.from(planePrimitive.cells),
    normals: planePrimitive.normals,
    uvs: planePrimitive.uvs,
  });

  const lambertMaterialParams = {
    color: { r: 1, g: 0, b: 0, a: 1 },
  };

  const lightParams = {
    color: { r: 1, g: 1, b: 1, a: 1 },
    intensity: 4,
    position: { x: 0, y: 0, z: 2.5 },
    direction: { x: 0, y: 0, z: 1 },
    angle: Math.PI / 5,
    penumbra: 0.2,
    visible: true,
  };

  const ambientParams = {
    color: { r: 1, g: 1, b: 1, a: 1 },
    intensity: 0,
  };

  const spotLight = tony.createSpotLight({
    position: [lightParams.position.x, lightParams.position.y, lightParams.position.z],
    direction: [lightParams.direction.x, lightParams.direction.y, lightParams.direction.z],
    angle: lightParams.angle,
    penumbra: lightParams.penumbra,
    color: [lightParams.color.r, lightParams.color.g, lightParams.color.b, lightParams.color.a],
    intensity: lightParams.intensity,
  });
  spotLight.setPosition([lightParams.position.x, lightParams.position.y, lightParams.position.z]);
  spotLight.visible = lightParams.visible;

  const lambertMaterial = tony.createLambertMaterial({
    transparent: true,
    color: [
      lambertMaterialParams.color.r,
      lambertMaterialParams.color.g,
      lambertMaterialParams.color.b,
      lambertMaterialParams.color.a,
    ],
  });

  const sphereMesh = tony.createMesh(planeGeometry, lambertMaterial);

  scene.add([sphereMesh, spotLight]);

  scene.setAmbientLightColor([
    ambientParams.color.r,
    ambientParams.color.g,
    ambientParams.color.b,
    ambientParams.color.a,
  ]);

  scene.setAmbientLightIntensity(ambientParams.intensity);

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

  const paneApi: any = pane;
  const lambertMaterialFolder = paneApi.addFolder ? paneApi.addFolder({ title: 'Lambert Material' }) : paneApi;

  lambertMaterialFolder.addBinding(lambertMaterialParams, 'color', { color: { type: 'float' } }).on('change', () => {
    const value = lambertMaterialParams.color;
    lambertMaterial.setColor([value.r, value.g, value.b, value.a]);
  });

  const lightFolder = paneApi.addFolder ? paneApi.addFolder({ title: 'Light' }) : paneApi;

  // Color
  lightFolder.addBinding(lightParams, 'color', { color: { type: 'float' } }).on('change', () => {
    const value = lightParams.color;
    spotLight.setColor([value.r, value.g, value.b, value.a]);
  });

  // Intensity
  lightFolder.addBinding(lightParams, 'intensity', { min: 0, max: 30, step: 0.01 }).on('change', () => {
    spotLight.setIntensity(lightParams.intensity);
  });

  // Position with custom labels
  lightFolder
    .addBinding(lightParams.position, 'x', { min: -10, max: 10, step: 0.01, label: 'pos x' })
    .on('change', () => {
      spotLight.setPosition([lightParams.position.x, lightParams.position.y, lightParams.position.z]);
    });
  lightFolder
    .addBinding(lightParams.position, 'y', { min: -10, max: 10, step: 0.01, label: 'pos y' })
    .on('change', () => {
      spotLight.setPosition([lightParams.position.x, lightParams.position.y, lightParams.position.z]);
    });
  lightFolder
    .addBinding(lightParams.position, 'z', { min: -10, max: 10, step: 0.01, label: 'pos z' })
    .on('change', () => {
      spotLight.setPosition([lightParams.position.x, lightParams.position.y, lightParams.position.z]);
    });

  // Direction with custom labels
  lightFolder
    .addBinding(lightParams.direction, 'x', { min: -1, max: 1, step: 0.01, label: 'dir x' })
    .on('change', () => {
      spotLight.setDirection([lightParams.direction.x, lightParams.direction.y, lightParams.direction.z]);
    });
  lightFolder
    .addBinding(lightParams.direction, 'y', { min: -1, max: 1, step: 0.01, label: 'dir y' })
    .on('change', () => {
      spotLight.setDirection([lightParams.direction.x, lightParams.direction.y, lightParams.direction.z]);
    });
  lightFolder
    .addBinding(lightParams.direction, 'z', { min: -1, max: 1, step: 0.01, label: 'dir z' })
    .on('change', () => {
      spotLight.setDirection([lightParams.direction.x, lightParams.direction.y, lightParams.direction.z]);
    });

  // Angle (outer cone)
  lightFolder.addBinding(lightParams, 'angle', { min: 0, max: Math.PI / 2, step: 0.01 }).on('change', () => {
    spotLight.setAngle(lightParams.angle);
  });

  // Penumbra
  lightFolder.addBinding(lightParams, 'penumbra', { min: 0, max: 1, step: 0.01 }).on('change', () => {
    spotLight.setPenumbra(lightParams.penumbra);
  });

  // Visible
  lightFolder.addBinding(lightParams, 'visible').on('change', () => {
    spotLight.visible = lightParams.visible;
  });

  const ambientFolder = paneApi.addFolder ? paneApi.addFolder({ title: 'Ambient Light' }) : paneApi;

  ambientFolder.addBinding(ambientParams, 'color', { color: { type: 'float' } }).on('change', () => {
    const value = ambientParams.color;
    scene.setAmbientLightColor([value.r, value.g, value.b, value.a]);
  });

  ambientFolder.addBinding(ambientParams, 'intensity', { min: 0, max: 1, step: 0.01 }).on('change', () => {
    scene.setAmbientLightIntensity(ambientParams.intensity);
  });
}
