import '../style.css';
import { sphere } from 'primitive-geometry';
import mycustomshader from './mycustomshader.wgsl?raw';

import { TonyGL } from '../../src';

const container = document.getElementById('app');

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

  const customMaterial = tony.createCustomMaterial({
    shader: mycustomshader,
    transparent: true,
    uniforms: {
      color: { type: 'vec4f', value: new Float32Array([1, 0, 1, 1]) },
      time: { type: 'f32', value: 0 },
    },
  });

  const sphereMesh = tony.createMesh(sphereGeometry, customMaterial);

  scene.add([sphereMesh]);
  scene.setAmbientLightIntensity(0.0);

  camera.setPosition([0, 0, 5]);
  camera.lookAt([0, 0, 0]);
  tony.createOrbitControls({ camera, domElement: tony.renderer.canvasElement });

  function render() {
    customMaterial.updateUniforms({ time: performance.now() * 0.001 });
    tony.render(scene, camera);
    requestAnimationFrame(render);
  }

  render();

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
  });
}
