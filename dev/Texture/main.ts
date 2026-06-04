import '../style.css';
import { sphere } from 'primitive-geometry';
import { Pane } from 'tweakpane';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';

import { TonyGL } from '../../src';
import { TextureColorSpace } from '../../src/texture/texture.types';
import { PerspectiveCamera } from '../../src/camera/PerspectiveCamera';
import { OrbitControls } from '../../src/camera/OrbitControls';
import { Geometry } from '../../src/geometry/Geometry';
import { Scene } from '../../src/sceneObjects/Scene';
import { Mesh } from '../../src/sceneObjects/Mesh';
import { PointLight } from '../../src/lights/PointLight';
import { Texture } from '../../src/texture/Texture';
import { LambertMaterial } from '../../src/materials/LambertMaterial';

const container = document.getElementById('app');

const pane = new Pane();
pane.registerPlugin(EssentialsPlugin);

if (container) {
  const t = await TonyGL({
    containerElement: container,
    alpha: true,
    modules: [PerspectiveCamera, OrbitControls, Scene, Geometry, LambertMaterial, PointLight, Mesh, Texture],
  });

  const scene = t.createScene();
  scene.setClearColor([0.25, 0.25, 0.25, 1]);

  const camera = t.createPerspectiveCamera({
    near: 0.1,
    far: 100,
    fov: (60 * Math.PI) / 180,
    aspect: container.clientWidth / container.clientHeight,
  });

  const spherePrimitive = sphere({ radius: 1, nx: 32, ny: 32 });
  function createSphereGeometry() {
    return t.createGeometry({
      vertices: spherePrimitive.positions,
      indices: Uint16Array.from(spherePrimitive.cells),
      normals: spherePrimitive.normals,
      uvs: spherePrimitive.uvs,
    });
  }

  async function loadTexture(url: string, colorSpace: TextureColorSpace = 'srgb') {
    const response = await fetch(url);
    const imageBitmap = await createImageBitmap(await response.blob());
    const texture = t.createTexture({
      textureData: imageBitmap,
      width: imageBitmap.width,
      height: imageBitmap.height,
      colorSpace,
    });
    return texture;
  }

  const albedoTexture = await loadTexture('/albedo.png');
  const alphaTexture = await loadTexture('/alpha.jpg');
  const normalTexture = await loadTexture('/normal.png', 'linear');

  const materialParams = {
    color: { r: 1, g: 1, b: 1, a: 1 },
    useAlbedoMap: true,
    useAlphaMap: false,
    useNormalMap: true,
    albedoRepeatU: 1,
    albedoRepeatV: 1,
    alphaRepeatU: 1,
    alphaRepeatV: 1,
    normalRepeatU: 1,
    normalRepeatV: 1,
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

  function createLambertMaterial() {
    return t.createLambertMaterial({
      transparent: true,
      color: [materialParams.color.r, materialParams.color.g, materialParams.color.b, materialParams.color.a],
      albedoTexture: materialParams.useAlbedoMap ? albedoTexture : t.renderer.textureLibrary.getFallback('white'),
      alphaTexture: materialParams.useAlphaMap ? alphaTexture : t.renderer.textureLibrary.getFallback('white'),
      normalTexture: materialParams.useNormalMap ? normalTexture : t.renderer.textureLibrary.getFallback('normal'),
    });
  }

  let lambertMaterial = createLambertMaterial();

  const pointLight = t.createPointLight({
    color: [lightParams.color.r, lightParams.color.g, lightParams.color.b, lightParams.color.a],
    intensity: lightParams.intensity,
    range: 30,
  });
  pointLight.setPosition([lightParams.x, lightParams.y, lightParams.z]);
  pointLight.visible = lightParams.visible;

  let sphereMesh = t.createMesh(createSphereGeometry(), lambertMaterial);

  function rebuildSphereMesh() {
    scene.remove(sphereMesh);
    lambertMaterial = createLambertMaterial();
    sphereMesh = t.createMesh(createSphereGeometry(), lambertMaterial);
    scene.add(sphereMesh);
  }

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
  const textureMaterialFolder = paneApi.addFolder ? paneApi.addFolder({ title: 'Texture Material' }) : paneApi;

  textureMaterialFolder.addBinding(materialParams, 'color', { color: { type: 'float' } }).on('change', () => {
    const value = materialParams.color;
    lambertMaterial.setColor([value.r, value.g, value.b, value.a]);
  });

  // Albedo texture folder
  const albedoFolder = textureMaterialFolder.addFolder
    ? textureMaterialFolder.addFolder({ title: 'Albedo Map' })
    : textureMaterialFolder;
  albedoFolder.addBinding(materialParams, 'useAlbedoMap', { label: 'Enabled' }).on('change', () => {
    rebuildSphereMesh();
  });
  albedoFolder
    .addBinding(materialParams, 'albedoRepeatU', { label: 'RepeatU', min: 0.1, max: 10, step: 0.1 })
    .on('change', () => {
      albedoTexture.repeat = new Float32Array([materialParams.albedoRepeatU, albedoTexture.repeat[1]]);
      lambertMaterial.updateUniforms({ textureRepeatAlbedo: albedoTexture.repeat });
    });
  albedoFolder
    .addBinding(materialParams, 'albedoRepeatV', { label: 'RepeatV', min: 0.1, max: 10, step: 0.1 })
    .on('change', () => {
      albedoTexture.repeat = new Float32Array([albedoTexture.repeat[0], materialParams.albedoRepeatV]);
      lambertMaterial.updateUniforms({ textureRepeatAlbedo: albedoTexture.repeat });
    });

  // Alpha texture folder
  const alphaFolder = textureMaterialFolder.addFolder
    ? textureMaterialFolder.addFolder({ title: 'Alpha Map' })
    : textureMaterialFolder;
  alphaFolder.addBinding(materialParams, 'useAlphaMap', { label: 'Enabled' }).on('change', () => {
    rebuildSphereMesh();
  });
  alphaFolder
    .addBinding(materialParams, 'alphaRepeatU', { label: 'RepeatU', min: 0.1, max: 10, step: 0.1 })
    .on('change', () => {
      alphaTexture.repeat = new Float32Array([materialParams.alphaRepeatU, alphaTexture.repeat[1]]);
      lambertMaterial.updateUniforms({ textureRepeatAlpha: alphaTexture.repeat });
    });
  alphaFolder
    .addBinding(materialParams, 'alphaRepeatV', { label: 'RepeatV', min: 0.1, max: 10, step: 0.1 })
    .on('change', () => {
      alphaTexture.repeat = new Float32Array([alphaTexture.repeat[0], materialParams.alphaRepeatV]);
      lambertMaterial.updateUniforms({ textureRepeatAlpha: alphaTexture.repeat });
    });

  // Normal texture folder
  const normalFolder = textureMaterialFolder.addFolder
    ? textureMaterialFolder.addFolder({ title: 'Normal Map' })
    : textureMaterialFolder;
  normalFolder.addBinding(materialParams, 'useNormalMap', { label: 'Enabled' }).on('change', () => {
    rebuildSphereMesh();
  });
  normalFolder
    .addBinding(materialParams, 'normalRepeatU', { label: 'RepeatU', min: 0.1, max: 10, step: 0.1 })
    .on('change', () => {
      normalTexture.repeat = new Float32Array([materialParams.normalRepeatU, normalTexture.repeat[1]]);
      lambertMaterial.updateUniforms({ textureRepeatNormal: normalTexture.repeat });
    });
  normalFolder
    .addBinding(materialParams, 'normalRepeatV', { label: 'RepeatV', min: 0.1, max: 10, step: 0.1 })
    .on('change', () => {
      normalTexture.repeat = new Float32Array([normalTexture.repeat[0], materialParams.normalRepeatV]);
      lambertMaterial.updateUniforms({ textureRepeatNormal: normalTexture.repeat });
    });

  const lightFolder = paneApi.addFolder ? paneApi.addFolder({ title: 'Light' }) : paneApi;

  lightFolder.addBinding(lightParams, 'color', { color: { type: 'float' } }).on('change', () => {
    const value = lightParams.color;
    pointLight.setColor([value.r, value.g, value.b, value.a]);
  });

  lightFolder.addBinding(lightParams, 'intensity', { min: 0, max: 30, step: 0.01 }).on('change', () => {
    pointLight.setIntensity(lightParams.intensity);
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
