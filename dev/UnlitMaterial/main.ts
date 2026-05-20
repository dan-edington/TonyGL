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

  const unlitMaterialParams = {
    color: { r: 1, g: 0, b: 0, a: 1 },
  };

  const unlitMaterial = tony.createUnlitMaterial({
    transparent: true,
    color: [
      unlitMaterialParams.color.r,
      unlitMaterialParams.color.g,
      unlitMaterialParams.color.b,
      unlitMaterialParams.color.a,
    ],
  });

  const sphereMesh = tony.createMesh(sphereGeometry, unlitMaterial);

  scene.add([sphereMesh]);

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
  const unlitMaterialFolder = paneApi.addFolder ? paneApi.addFolder({ title: 'Unlit Material' }) : paneApi;

  unlitMaterialFolder.addBinding(unlitMaterialParams, 'color', { color: { type: 'float' } }).on('change', () => {
    const value = unlitMaterialParams.color;
    unlitMaterial.setColor([value.r, value.g, value.b, value.a]);
  });
}
