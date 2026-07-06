# 🐶 TonyGL

> 🚧 **Work In Progress / Under Construction** 🚧
>
> TonyGL is a personal WebGPU project that is still finding its final shape. APIs may change, documentation is growing, and npm publishing will come later once the project reaches a clearer milestone.

TonyGL is a small TypeScript WebGPU rendering library named after my dog, Tony (naming things is HARD!).

It started as a way to learn WebGPU properly, but it is also a playground for building the kind of rendering library I want to use: smaller than three.js, modular by default, and shaped around functional factory-style modules rather than large JavaScript object hierarchies.

## What?

TonyGL is a lightweight rendering library for experimenting with WebGPU scenes, cameras, geometry, materials, lighting, textures, compute tasks, and multipass rendering.

The core idea is that you opt in to the pieces you need. Modules are passed into `TonyGL(...)`, and the returned engine instance exposes the creation helpers supplied by those modules.

Unlike libraries such as three.js, there are no built in math helpers. Internally, TonyGL uses [wgpu-matrix](https://wgpu-matrix.org/) and this is the recommended choice for your applications using TonyGL.

Similarly, there are no built in geometries. For these, it's recommended using a library like [primitive-geometry](https://www.npmjs.com/package/primitive-geometry).

```ts
import { TonyGL } from './src';
import { Geometry, Mesh, PerspectiveCamera, Scene, BlinnPhongMaterial, PointLight, OrbitControls } from './src/modules';

import { sphere } from 'primitive-geometry';

const container = document.getElementById('app');

if (!container) {
  throw new Error('Missing container element');
}

// Create a TonyGL instance and pass in imported modules
const tony = await TonyGL({
  containerElement: container,
  modules: [Scene, PerspectiveCamera, Geometry, Mesh, BlinnPhongMaterial, PointLight, OrbitControls],
});

export type TonyInstance = typeof tony;

// Create a perspective camera and orbit controls
const camera = tony.createPerspectiveCamera({
  near: 0.1,
  far: 100,
  fov: (60 * Math.PI) / 180,
  aspect: container.clientWidth / container.clientHeight,
});

camera.setPosition([0, 0, 5]);
camera.lookAt([0, 0, 0]);
tony.createOrbitControls({ camera, domElement: tony.renderer.canvasElement });

// Create a sphere mesh from vertices, indices, normals and uvs
// Geometry + Material = Mesh

const spherePrimitive = sphere({ radius: 1, nx: 32, ny: 32 });

const sphereGeometry = tony.createGeometry({
  vertices: spherePrimitive.positions,
  indices: Uint16Array.from(spherePrimitive.cells), // convert to Uint16Array
  normals: spherePrimitive.normals,
  uvs: spherePrimitive.uvs,
});

const blinnPhongMaterial = tony.createBlinnPhongMaterial({
  transparent: true,
  color: [1, 0, 0, 1],
  shininess: 50,
  specularColor: [1, 1, 1],
  specularStrength: 1,
});

const sphereMesh = tony.createMesh(sphereGeometry, blinnPhongMaterial);

// Create a PointLight
const pointLight = tony.createPointLight({
  color: [1, 1, 1, 1],
  intensity: 5,
  range: 30,
});

pointLight.setPosition([2, 2, 2]);

// Create a scene, set the clear colour and add objects
const scene = tony.createScene();
scene.setClearColor([0.25, 0.25, 0.25, 1]);
scene.add(pointLight, sphereMesh);

// Render loop
(function render() {
  tony.render(scene, camera);

  requestAnimationFrame(render);
})();

// Update camera aspect on resize
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
});
```

## Why?

I made TonyGL because I wanted to learn WebGPU by building with it directly, not just reading about it - I'm a firm believer in learning by doing.

I also wanted to explore an alternative to three.js that is much smaller in scope. TonyGL is not trying to be a drop-in replacement. It is a personal, hands-on graphics project where I can experiment with renderer architecture, TypeScript API design, shader workflows, and WebGPU rendering techniques.

Also, it is named after Tony, my dog. That is obviously very important.

## Features

TonyGL currently supports:

- WebGPU-only mode (bootstraps a simple WebGPU app without the rest of the library)
- Forward renderer
- Scene graph with world / local coordinate system
- Perspective and orthographic cameras
- Indexed and non-indexed geometry support
- Mesh instancing
- Compute tasks
- Geometry tangent generation
- Lambertian, Blinn-Phong, Unlit, Normal, and Custom Shader materials
- Support for alpha maps, albedo maps, and normal maps
- Multisampling
- Sorted alpha blending
- Point, directional, and spot lights as well as scene level ambient lighting
- Texture resource handling
- Multipass rendering
- Linear to sRGB workflow
- ACES tonemapping
- Raycaster

## Quick Start

TonyGL is not published to npm yet. For now, clone the repo and run it locally.

```sh
git clone https://github.com/dan-edington/TonyGL.git
cd TonyGL
pnpm install
pnpm run dev
```

The dev server opens the `dev` workspace. The landing page lists the available demo folders, so you can jump into examples for materials, lights, instancing, custom shaders, and other work-in-progress features.

Useful scripts:

```sh
pnpm run dev    # start the Vite dev server and demo index
pnpm run build  # build the library output
pnpm run test   # run the test suite
```

## Roadmap

TonyGL is still very much under construction, but the rough direction is:

- Add a deferred rendering path
- PBR material
- Proper documentation
- More thorough test suite
- Shadows
- MIP maps
- Video texture support
- Wireframe rendering
