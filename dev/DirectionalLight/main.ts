import '../style.css';
import { sphere } from 'primitive-geometry';
import { Pane } from 'tweakpane';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';

import { TonyGL } from '../../src';

const container = document.getElementById('app');

const pane = new Pane();
pane.registerPlugin(EssentialsPlugin);

if (container) {
  const tony = await TonyGL({ containerElement: container, alpha: true });
  const scene = tony.createScene();
  scene.setClearColor([0.25, 0.25, 0.25, 1]);

  const camera = tony.createPerspectiveCamera({
    near: 0.1,
    far: 100,
    fov: (60 * Math.PI) / 180,
    aspect: container.clientWidth / container.clientHeight,
  });

  const spherePrimitive = sphere({ radius: 1, nx: 32, ny: 32 });
  const sphereGeometry = tony.createGeometry({
    vertices: spherePrimitive.positions,
    indices: Uint16Array.from(spherePrimitive.cells),
    normals: spherePrimitive.normals,
    uvs: spherePrimitive.uvs,
  });

  const lambertMaterialParams = {
    color: { r: 1, g: 0, b: 0, a: 1 },
  };

  const lightParams = {
    color: { r: 1, g: 1, b: 1, a: 1 },
    intensity: 4,
    x: 2,
    y: 2,
    z: 2,
    visible: true,
  };

  const ambientParams = {
    color: { r: 1, g: 1, b: 1, a: 1 },
    intensity: 0,
  };

  const directionalLight = tony.createDirectionalLight({
    direction: [lightParams.x, lightParams.y, lightParams.z],
    color: [lightParams.color.r, lightParams.color.g, lightParams.color.b, lightParams.color.a],
    intensity: lightParams.intensity,
  });
  directionalLight.visible = lightParams.visible;

  const lambertMaterial = tony.createLambertMaterial({
    transparent: true,
    color: [
      lambertMaterialParams.color.r,
      lambertMaterialParams.color.g,
      lambertMaterialParams.color.b,
      lambertMaterialParams.color.a,
    ],
  });

  const sphereMesh = tony.createMesh(sphereGeometry, lambertMaterial);

  scene.add([sphereMesh, directionalLight]);
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

  lightFolder.addBinding(lightParams, 'color', { color: { type: 'float' } }).on('change', () => {
    const value = lightParams.color;
    directionalLight.setColor([value.r, value.g, value.b, value.a]);
  });

  lightFolder.addBinding(lightParams, 'intensity', { min: 0, max: 30, step: 0.01 }).on('change', () => {
    directionalLight.setIntensity(lightParams.intensity);
  });

  lightFolder.addBinding(lightParams, 'x', { min: -10, max: 10, step: 0.01 }).on('change', () => {
    directionalLight.setDirection([lightParams.x, lightParams.y, lightParams.z]);
  });
  lightFolder.addBinding(lightParams, 'y', { min: -10, max: 10, step: 0.01 }).on('change', () => {
    directionalLight.setDirection([lightParams.x, lightParams.y, lightParams.z]);
  });
  lightFolder.addBinding(lightParams, 'z', { min: -10, max: 10, step: 0.01 }).on('change', () => {
    directionalLight.setDirection([lightParams.x, lightParams.y, lightParams.z]);
  });

  lightFolder.addBinding(lightParams, 'visible').on('change', () => {
    directionalLight.visible = lightParams.visible;
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
