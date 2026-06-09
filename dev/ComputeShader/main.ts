import '../style.css';
import { plane } from 'primitive-geometry';
import { Pane } from 'tweakpane';
import Stats from 'stats.js';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import { PerspectiveCamera } from '../../src/camera/PerspectiveCamera';
import { OrbitControls } from '../../src/camera/OrbitControls';
import { Geometry } from '../../src/geometry/Geometry';
import { Scene } from '../../src/sceneObjects/Scene';
import { Mesh } from '../../src/sceneObjects/Mesh';
import { PointLight } from '../../src/lights/PointLight';
import gameOfLifeShader from './gameOfLifeShader.wgsl?raw';
import gameOfLifeShaderCompute from './gameOfLifeShaderCompute.wgsl?raw';
import { createGrid } from './grid';
import { TonyGL } from '../../src';
import { CustomMaterial } from '../../src/materials/CustomMaterial';
import { ComputeTask } from '../../src/compute/ComputeTask';
import type { ComputePass } from '../../src/renderer/renderer.types';

const gridSize = 500;
const timeStepMs = 16;

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
  camera.setPosition([0, 0, 2]);
  tony.createOrbitControls({ camera, domElement: tony.renderer.canvasElement });

  const grid = createGrid(gridSize, gridSize);

  const cx = Math.floor(gridSize / 2);
  const cy = Math.floor(gridSize / 2);
  grid.setGridPosition(cx, cy - 1, 1);
  grid.setGridPosition(cx + 1, cy - 1, 1);
  grid.setGridPosition(cx - 1, cy, 1);
  grid.setGridPosition(cx, cy, 1);
  grid.setGridPosition(cx, cy + 1, 1);

  const gridBufferA = tony.createUniformBuffer(
    {
      gridSize: { type: 'u32', value: gridSize },
      grid: { type: `array<u32, ${gridSize * gridSize}>`, value: grid.gridArray },
    },
    {
      addressSpace: 'storage',
    },
  );

  const gridBufferB = tony.createUniformBuffer(
    {
      gridSize: { type: 'u32', value: gridSize },
      grid: { type: `array<u32, ${gridSize * gridSize}>`, value: grid.gridArray },
    },
    {
      addressSpace: 'storage',
    },
  );

  let readGridBuffer = gridBufferA;
  let writeGridBuffer = gridBufferB;

  const gameOfLifeComputeTask = tony.createComputeTask({
    name: 'Game Of Life',
    shaderCode: gameOfLifeShaderCompute,
    buffers: [readGridBuffer, writeGridBuffer],
    workgroupSize: [8, 8, 1],
    dispatchSize: [gridSize, gridSize, 1],
    enabled: true,
  });

  const computePass = tony.renderer.passManager.getPass('compute') as ComputePass;

  if (computePass) {
    computePass.addTask(gameOfLifeComputeTask);
  }

  const { positions, uvs, normals, cells } = plane({
    sx: 2.5,
    sy: 2.5,
    nx: 1,
    ny: 1,
    direction: 'z',
    quads: false,
  });

  const planeGeometry = tony.createGeometry({
    vertices: positions,
    uvs,
    normals,
    indices: new Uint16Array(cells),
  });

  const gameOfLifeMaterial = tony.createCustomMaterial({
    shader: gameOfLifeShader,
    buffers: [writeGridBuffer],
  });

  const gameOfLifeMesh = tony.createMesh(planeGeometry, gameOfLifeMaterial);

  scene.add(gameOfLifeMesh);

  let t = 0;

  (function render() {
    stats.begin();

    t += tony.renderer.timers.deltaTime;

    tony.render(scene, camera);

    if (t >= timeStepMs) {
      // flip buffers
      [readGridBuffer, writeGridBuffer] = [writeGridBuffer, readGridBuffer];

      gameOfLifeComputeTask.rebindBuffers([readGridBuffer, writeGridBuffer]);
      gameOfLifeMaterial.rebindBuffers([writeGridBuffer]);

      t = 0;
    }

    stats.end();

    requestAnimationFrame(render);
  })();

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
  });
}
