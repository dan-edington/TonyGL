import '../style.css';
import { plane } from 'primitive-geometry';
import { Pane } from 'tweakpane';
import Stats from 'stats.js';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import { PerspectiveCamera } from '../../src/camera/PerspectiveCamera';
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

const params = {
  gridSize: 100,
  timeStepMs: 64,
};

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
    modules: [PerspectiveCamera, Geometry, Scene, Mesh, PointLight, CustomMaterial, ComputeTask],
  });

  const scene = tony.createScene();
  scene.setClearColor([0.25, 0.25, 0.25, 1]);
  const camera = tony.createPerspectiveCamera({
    near: 0.1,
    far: 100,
    fov: (60 * Math.PI) / 180,
    aspect: container.clientWidth / container.clientHeight,
  });

  const grid = createGrid(params.gridSize, params.gridSize);

  const cx = Math.floor(params.gridSize / 2);
  const cy = Math.floor(params.gridSize / 2);

  type GridPattern = [number, number][];

  function setGridPattern(pattern: GridPattern) {
    grid.gridArray.fill(0);

    for (let i = 0; i < pattern.length; i++) {
      const x = pattern[i][0];
      const y = pattern[i][1];
      grid.setGridPosition(x, y, 1);
    }
  }

  const rPentomino: GridPattern = [
    [cx, cy - 1],
    [cx + 1, cy - 1],
    [cx - 1, cy],
    [cx, cy],
    [cx, cy + 1],
  ];

  const blinker: GridPattern = [
    [cx - 1, cy],
    [cx, cy],
    [cx + 1, cy],
  ];

  const glider: GridPattern = [
    [cx, cy - 1],
    [cx + 1, cy],
    [cx - 1, cy + 1],
    [cx, cy + 1],
    [cx + 1, cy + 1],
  ];

  const lightweightSpaceship: GridPattern = [
    [cx - 1, cy - 1],
    [cx + 2, cy - 1],
    [cx - 2, cy],
    [cx - 2, cy + 1],
    [cx + 2, cy + 1],
    [cx - 2, cy + 2],
    [cx - 1, cy + 2],
    [cx, cy + 2],
    [cx + 1, cy + 2],
  ];

  const diehard: GridPattern = [
    [cx + 2, cy - 1],
    [cx - 4, cy],
    [cx - 3, cy],
    [cx - 3, cy + 1],
    [cx + 1, cy + 1],
    [cx + 2, cy + 1],
    [cx + 3, cy + 1],
  ];

  const acorn: GridPattern = [
    [cx - 2, cy - 1],
    [cx, cy],
    [cx - 3, cy + 1],
    [cx - 2, cy + 1],
    [cx + 1, cy + 1],
    [cx + 2, cy + 1],
    [cx + 3, cy + 1],
  ];

  const bHeptomino: GridPattern = [
    [cx - 1, cy - 1],
    [cx, cy - 1],
    [cx, cy],
    [cx + 1, cy],
    [cx - 1, cy + 1],
    [cx, cy + 1],
    [cx - 1, cy + 2],
  ];

  const piHeptomino: GridPattern = [
    [cx - 1, cy - 1],
    [cx, cy - 1],
    [cx + 1, cy - 1],
    [cx - 1, cy],
    [cx + 1, cy],
    [cx - 1, cy + 1],
    [cx + 1, cy + 1],
  ];

  const rabbit: GridPattern = [
    [cx - 3, cy - 1],
    [cx + 1, cy - 1],
    [cx + 2, cy - 1],
    [cx + 3, cy - 1],
    [cx - 3, cy],
    [cx - 2, cy],
    [cx - 1, cy],
    [cx + 2, cy],
    [cx - 2, cy + 1],
  ];

  const pulsar: GridPattern = [
    [cx - 4, cy - 6],
    [cx - 3, cy - 6],
    [cx - 2, cy - 6],
    [cx + 2, cy - 6],
    [cx + 3, cy - 6],
    [cx + 4, cy - 6],

    [cx - 6, cy - 4],
    [cx - 1, cy - 4],
    [cx + 1, cy - 4],
    [cx + 6, cy - 4],
    [cx - 6, cy - 3],
    [cx - 1, cy - 3],
    [cx + 1, cy - 3],
    [cx + 6, cy - 3],
    [cx - 6, cy - 2],
    [cx - 1, cy - 2],
    [cx + 1, cy - 2],
    [cx + 6, cy - 2],

    [cx - 4, cy - 1],
    [cx - 3, cy - 1],
    [cx - 2, cy - 1],
    [cx + 2, cy - 1],
    [cx + 3, cy - 1],
    [cx + 4, cy - 1],

    [cx - 4, cy + 1],
    [cx - 3, cy + 1],
    [cx - 2, cy + 1],
    [cx + 2, cy + 1],
    [cx + 3, cy + 1],
    [cx + 4, cy + 1],

    [cx - 6, cy + 2],
    [cx - 1, cy + 2],
    [cx + 1, cy + 2],
    [cx + 6, cy + 2],
    [cx - 6, cy + 3],
    [cx - 1, cy + 3],
    [cx + 1, cy + 3],
    [cx + 6, cy + 3],
    [cx - 6, cy + 4],
    [cx - 1, cy + 4],
    [cx + 1, cy + 4],
    [cx + 6, cy + 4],

    [cx - 4, cy + 6],
    [cx - 3, cy + 6],
    [cx - 2, cy + 6],
    [cx + 2, cy + 6],
    [cx + 3, cy + 6],
    [cx + 4, cy + 6],
  ];

  const gosperGliderGun: GridPattern = [
    [cx + 6, cy - 4],
    [cx + 4, cy - 3],
    [cx + 6, cy - 3],

    [cx - 6, cy - 2],
    [cx - 5, cy - 2],
    [cx + 2, cy - 2],
    [cx + 3, cy - 2],
    [cx + 16, cy - 2],
    [cx + 17, cy - 2],

    [cx - 7, cy - 1],
    [cx - 3, cy - 1],
    [cx + 2, cy - 1],
    [cx + 3, cy - 1],
    [cx + 16, cy - 1],
    [cx + 17, cy - 1],

    [cx - 18, cy],
    [cx - 17, cy],
    [cx - 8, cy],
    [cx - 2, cy],
    [cx + 2, cy],
    [cx + 3, cy],

    [cx - 18, cy + 1],
    [cx - 17, cy + 1],
    [cx - 8, cy + 1],
    [cx - 4, cy + 1],
    [cx - 2, cy + 1],
    [cx - 1, cy + 1],
    [cx + 4, cy + 1],
    [cx + 6, cy + 1],

    [cx - 8, cy + 2],
    [cx - 2, cy + 2],
    [cx + 6, cy + 2],

    [cx - 7, cy + 3],
    [cx - 3, cy + 3],

    [cx - 6, cy + 4],
    [cx - 5, cy + 4],
  ];

  const toad: GridPattern = [
    [cx - 1, cy],
    [cx, cy],
    [cx + 1, cy],
    [cx - 2, cy + 1],
    [cx - 1, cy + 1],
    [cx, cy + 1],
  ];

  const allConfigs = new Map<string, GridPattern>([
    ['rPentomino', rPentomino],
    ['blinker', blinker],
    ['glider', glider],
    ['lightweightSpaceship', lightweightSpaceship],
    ['diehard', diehard],
    ['acorn', acorn],
    ['bHeptomino', bHeptomino],
    ['piHeptomino', piHeptomino],
    ['rabbit', rabbit],
    ['pulsar', pulsar],
    ['gosperGliderGun', gosperGliderGun],
    ['toad', toad],
  ]);

  setGridPattern(piHeptomino);

  const gridBufferA = tony.createUniformBuffer(
    {
      gridSize: { type: 'u32', value: params.gridSize },
      grid: { type: `array<u32, ${params.gridSize * params.gridSize}>`, value: grid.gridArray },
    },
    {
      addressSpace: 'storage',
    },
  );

  const gridBufferB = tony.createUniformBuffer(
    {
      gridSize: { type: 'u32', value: params.gridSize },
      grid: { type: `array<u32, ${params.gridSize * params.gridSize}>`, value: grid.gridArray },
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
    dispatchSize: [params.gridSize, params.gridSize, 1],
    enabled: true,
  });

  const computePass = tony.renderer.passManager.getPass('compute') as ComputePass;

  if (computePass) {
    computePass.addTask(gameOfLifeComputeTask);
  }

  const planeSize = 2.5;

  const { positions, uvs, normals, cells } = plane({
    sx: planeSize,
    sy: planeSize,
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

  // Adjust camera so plane takes up full viewport
  const cameraFitDistanceZ = Math.tan(camera.fov) * (planeSize / 2);
  camera.setPosition([0, 0, cameraFitDistanceZ]);

  const gameOfLifeMaterial = tony.createCustomMaterial({
    shader: gameOfLifeShader,
    buffers: [writeGridBuffer],
  });

  const gameOfLifeMesh = tony.createMesh(planeGeometry, gameOfLifeMaterial);

  scene.add(gameOfLifeMesh);

  let currentFrameTime = 0;

  function render() {
    stats.begin();

    currentFrameTime += tony.renderer.timers.deltaTime;

    tony.render(scene, camera);

    if (currentFrameTime >= params.timeStepMs) {
      // flip buffers
      [readGridBuffer, writeGridBuffer] = [writeGridBuffer, readGridBuffer];

      gameOfLifeComputeTask.rebindBuffers([readGridBuffer, writeGridBuffer]);
      gameOfLifeMaterial.rebindBuffers([writeGridBuffer]);

      currentFrameTime = 0;
    }

    stats.end();

    requestAnimationFrame(render);
  }

  render();

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
  });

  pane
    .addBinding(params, 'timeStepMs', {
      min: 0,
      max: 1000,
      step: 1,
    })
    .on('change', () => {
      currentFrameTime = 0;
    });

  pane
    .addBlade({
      view: 'list',
      label: 'configuration',
      options: [
        { text: 'r-pentomino', value: 'rPentomino' },
        { text: 'blinker', value: 'blinker' },
        { text: 'toad', value: 'toad' },
        { text: 'glider', value: 'glider' },
        { text: 'lightweightSpaceship', value: 'lightweightSpaceship' },
        { text: 'diehard', value: 'diehard' },
        { text: 'acorn', value: 'acorn' },
        { text: 'bHeptomino', value: 'bHeptomino' },
        { text: 'piHeptomino', value: 'piHeptomino' },
        { text: 'rabbit', value: 'rabbit' },
        { text: 'pulsar', value: 'pulsar' },
        { text: 'gosperGliderGun', value: 'gosperGliderGun' },
      ],
      value: 'rPentomino',
    })
    .on('change', (evt: any) => {
      setGridPattern(allConfigs.get(evt.value)!);

      readGridBuffer.updateUniforms({
        grid: grid.gridArray,
      });
      readGridBuffer.writeUpdatedBufferData();

      writeGridBuffer.updateUniforms({
        grid: grid.gridArray,
      });
      writeGridBuffer.writeUpdatedBufferData();

      gameOfLifeComputeTask.rebindBuffers([readGridBuffer, writeGridBuffer]);
      gameOfLifeMaterial.rebindBuffers([writeGridBuffer]);

      currentFrameTime = 0;
    });
}
