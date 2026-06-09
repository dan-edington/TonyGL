import '../style.css';
import { sphere } from 'primitive-geometry';
import { Pane } from 'tweakpane';
import Stats from 'stats.js';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import { PerspectiveCamera } from '../../src/camera/PerspectiveCamera';
import { OrbitControls } from '../../src/camera/OrbitControls';
import { Geometry } from '../../src/geometry/Geometry';
import { Scene } from '../../src/sceneObjects/Scene';
import { Mesh } from '../../src/sceneObjects/Mesh';
import { PointLight } from '../../src/lights/PointLight';
import mycustomshader from './mycustomshader.wgsl?raw';
import mycomputeshader from './mycomputeshader.wgsl?raw';

import { TonyGL } from '../../src';
import { CustomMaterial } from '../../src/materials/CustomMaterial';
import { ComputeTask } from '../../src/compute/ComputeTask';
import type { ComputePass } from '../../src/renderer/renderer.types';

const container = document.getElementById('app');
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);
const pane = new Pane();
pane.registerPlugin(EssentialsPlugin);

if (container) {
  const tony = await TonyGL({
    containerElement: container,
    alpha: true,
    modules: [PerspectiveCamera, OrbitControls, Geometry, Scene, Mesh, PointLight, CustomMaterial, ComputeTask],
  });

  const scene = tony.createScene();

  scene.setClearColor([0.25, 0.25, 0.25, 1]);

  const camera = tony.createPerspectiveCamera({
    near: 0.1,
    far: 100,
    fov: (60 * Math.PI) / 180,
    aspect: container.clientWidth / container.clientHeight,
  });
  camera.setPosition([0, 0, 4]);

  const s = 128;
  const { positions, normals, uvs, cells } = sphere({ radius: 1, nx: s, ny: s });

  const points = tony.createGeometry({
    vertices: positions,
    topology: 'point-list',
  });

  const particleCount = positions.length / 3;

  const particleBuffer = tony.createUniformBuffer(
    {
      particlePositions: { type: `array<vec3<f32>, ${particleCount}>`, value: positions },
    },
    {
      addressSpace: 'storage',
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.UNIFORM | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    },
  );

  const customMaterialBuffer = tony.createUniformBuffer({
    color: { type: 'vec4f', value: new Float32Array([0, 1, 0, 1]) },
  });

  const material = tony.createCustomMaterial({
    shader: mycustomshader,
    buffers: [particleBuffer, customMaterialBuffer],
  });

  const particlesCompute = tony.createComputeTask({
    name: 'particlesCompute',
    enabled: true,
    shaderCode: mycomputeshader,
    workgroupSize: [64, 1, 1],
    dispatchSize: [particleCount],
    buffers: [particleBuffer],
  });

  const computePass = tony.renderer.passManager.getPass('compute') as ComputePass | undefined;
  if (computePass?.type === 'Compute') {
    computePass.addTask(particlesCompute);
  }

  const m = tony.createMesh(points, material);

  scene.add(m);

  tony.createOrbitControls({ camera, domElement: tony.renderer.canvasElement });

  function render() {
    stats.begin();
    tony.render(scene, camera);
    stats.end();
    requestAnimationFrame(render);
  }

  render();

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
  });
}
