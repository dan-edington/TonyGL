import '../style.css';
import { sphere } from 'primitive-geometry';
import { Pane } from 'tweakpane';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import { PerspectiveCamera } from '../../src/camera/PerspectiveCamera';
import { OrbitControls } from '../../src/camera/OrbitControls';
import { Geometry } from '../../src/geometry/Geometry';
import { Scene } from '../../src/sceneObjects/Scene';
import { Mesh } from '../../src/sceneObjects/Mesh';
import { PointLight } from '../../src/lights/PointLight';
import { BlinnPhongMaterial } from '../../src/materials/BlinnPhongMaterial';

import { TonyGL } from '../../src/TonyGL';

const container = document.getElementById('app');
const pane = new Pane();
pane.registerPlugin(EssentialsPlugin);

if (container) {
  const t = await TonyGL({
    containerElement: container,
    alpha: true,
    modules: [PerspectiveCamera, OrbitControls, Geometry, Scene, Mesh, PointLight, BlinnPhongMaterial],
  });

  const scene = t.createScene();
  scene.setClearColor([1, 0.25, 0.25, 1]);

  const camera = t.createPerspectiveCamera({
    near: 0.1,
    far: 100,
    fov: (60 * Math.PI) / 180,
    aspect: container.clientWidth / container.clientHeight,
  });

  const spherePrimitive = sphere({ radius: 1, nx: 32, ny: 32 });

  const sphereGeometry = t.createGeometry({
    name: 'Sphere',
    vertices: spherePrimitive.positions,
    indices: Uint16Array.from(spherePrimitive.cells),
    normals: spherePrimitive.normals,
    uvs: spherePrimitive.uvs,
  });

  const blinnPhongMaterialParams = {
    color: { r: 1, g: 0, b: 0, a: 1 },
    shininess: 48,
    specularColor: { r: 1, g: 1, b: 1, a: 1 },
    specularStrength: 1,
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

  const blinnPhongMaterial = t.createBlinnPhongMaterial({
    transparent: true,
    color: [
      blinnPhongMaterialParams.color.r,
      blinnPhongMaterialParams.color.g,
      blinnPhongMaterialParams.color.b,
      blinnPhongMaterialParams.color.a,
    ],
    shininess: blinnPhongMaterialParams.shininess,
    specularColor: [
      blinnPhongMaterialParams.specularColor.r,
      blinnPhongMaterialParams.specularColor.g,
      blinnPhongMaterialParams.specularColor.b,
    ],
    specularStrength: blinnPhongMaterialParams.specularStrength,
  });

  const sphereMesh = t.createMesh(sphereGeometry, blinnPhongMaterial);

  const pointLight = t.createPointLight({
    color: [lightParams.color.r, lightParams.color.g, lightParams.color.b, lightParams.color.a],
    intensity: lightParams.intensity,
    range: 30,
  });

  pointLight.setPosition([lightParams.x, lightParams.y, lightParams.z]);
  pointLight.visible = lightParams.visible;

  scene.add([sphereMesh, pointLight]);
  scene.setAmbientLightColor([
    ambientParams.color.r,
    ambientParams.color.g,
    ambientParams.color.b,
    ambientParams.color.a,
  ]);
  scene.setAmbientLightIntensity(ambientParams.intensity);

  camera.setPosition([0, 0, 5]);
  camera.lookAt([0, 0, 0]);

  t.createOrbitControls({ camera, domElement: t.renderer.canvasElement });

  function render() {
    t.render(scene, camera);
    requestAnimationFrame(render);
  }

  render();

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
  });

  const paneApi: any = pane;
  const blinnPhongMaterialFolder = paneApi.addFolder ? paneApi.addFolder({ title: 'BlinnPhong Material' }) : paneApi;

  blinnPhongMaterialFolder
    .addBinding(blinnPhongMaterialParams, 'color', { color: { type: 'float' } })
    .on('change', () => {
      const value = blinnPhongMaterialParams.color;
      blinnPhongMaterial.setColor([value.r, value.g, value.b, value.a]);
    });

  blinnPhongMaterialFolder
    .addBinding(blinnPhongMaterialParams, 'shininess', { min: 0, max: 1000, step: 0.1 })
    .on('change', () => {
      blinnPhongMaterial.setShininess(blinnPhongMaterialParams.shininess);
    });

  blinnPhongMaterialFolder
    .addBinding(blinnPhongMaterialParams, 'specularStrength', { min: 0, max: 1, step: 0.1 })
    .on('change', () => {
      blinnPhongMaterial.setSpecularStrength(blinnPhongMaterialParams.specularStrength);
    });

  blinnPhongMaterialFolder
    .addBinding(blinnPhongMaterialParams, 'specularColor', { color: { type: 'float' } })
    .on('change', () => {
      const value = blinnPhongMaterialParams.specularColor;
      blinnPhongMaterial.setSpecularColor([value.r, value.g, value.b]);
    });

  const lightFolder = paneApi.addFolder ? paneApi.addFolder({ title: 'Light' }) : paneApi;

  lightFolder.addBinding(lightParams, 'color', { color: { type: 'float' } }).on('change', () => {
    const value = lightParams.color;
    pointLight.setColor([value.r, value.g, value.b, value.a]);
  });

  lightFolder.addBinding(lightParams, 'intensity', { min: 0, max: 30, step: 0.01 }).on('change', () => {
    pointLight.intensity = lightParams.intensity;
  });

  lightFolder.addBinding(lightParams, 'x', { min: -10, max: 10, step: 0.01 }).on('change', () => {
    pointLight.setPosition([lightParams.x, lightParams.y, lightParams.z]);
  });

  lightFolder.addBinding(lightParams, 'y', { min: -10, max: 10, step: 0.01 }).on('change', () => {
    pointLight.setPosition([lightParams.x, lightParams.y, lightParams.z]);
  });

  lightFolder.addBinding(lightParams, 'z', { min: -10, max: 10, step: 0.01 }).on('change', () => {
    pointLight.setPosition([lightParams.x, lightParams.y, lightParams.z]);
  });

  lightFolder.addBinding(lightParams, 'visible').on('change', () => {
    pointLight.visible = lightParams.visible;
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
