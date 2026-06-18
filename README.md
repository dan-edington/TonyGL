# 🐶 TonyGL

> 🚧 **Work In Progress / Under Construction** 🚧
>
> TonyGL is a personal WebGPU project that is still finding its final shape. APIs may change, documentation is growing, and npm publishing will come later once the project reaches a clearer milestone.

TonyGL is a small TypeScript WebGPU rendering library named after my dog, Tony.

It started as a way to learn WebGPU properly, but it is also a playground for building the kind of rendering engine I want to use: smaller than three.js, modular by default, and shaped around functional factory-style modules rather than large JavaScript object hierarchies.

## What?

TonyGL is a lightweight rendering library for experimenting with WebGPU scenes, cameras, geometry, materials, lighting, textures, compute tasks, and multipass rendering.

The core idea is that you opt in to the pieces you need. Modules are passed into `TonyGL(...)`, and the returned engine instance exposes the creation helpers supplied by those modules.

```ts
import { TonyGL } from './src';
import {
  Geometry,
  Mesh,
  PerspectiveCamera,
  Scene,
  UnlitMaterial,
} from './src/modules';

const container = document.getElementById('app');

if (!container) {
  throw new Error('Missing #app element');
}

const tony = await TonyGL({
  containerElement: container,
  modules: [Scene, PerspectiveCamera, Geometry, Mesh, UnlitMaterial],
});

const scene = tony.createScene();
const camera = tony.createPerspectiveCamera({
  near: 0.1,
  far: 100,
  fov: (60 * Math.PI) / 180,
  aspect: container.clientWidth / container.clientHeight,
});

// Build geometry, create materials, add meshes, and render.
// See the dev demos for complete working examples.
```

## Why?

I made TonyGL because I wanted to learn WebGPU by building with it directly, not just reading about it.

I also wanted to explore an alternative to three.js that is much smaller in scope. TonyGL is not trying to be a drop-in replacement. It is a personal, hands-on graphics project where I can experiment with renderer architecture, TypeScript API design, shader workflows, and WebGPU rendering techniques.

The goal is for the codebase to show how I think as both a graphics programmer and a TypeScript engineer: practical, curious, modular, and not afraid to get close to the GPU.

Also, it is named after Tony, my dog. That is obviously very important.

## Features

TonyGL currently supports:

- Scene graph
- Perspective and orthographic cameras
- Indexed and non-indexed geometry
- Instancing
- Compute tasks
- Geometry tangent generation
- Lambertian, Blinn Phong, unlit, normal, and custom shader materials
- Alpha maps, albedo maps, and normal maps
- Multisampling
- Sorted alpha blending
- Point, directional, and spot lights
- Scene-level ambient light
- Texture resource handling
- Multipass rendering
- Linear to sRGB workflow
- ACES tonemapping
- Modular factory-style API design

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

- Improve docs and examples as the API settles
- Keep expanding the demo suite in `dev/`
- Tighten the module system and factory API
- Add npm publishing once a suitable milestone is reached
- Continue exploring WebGPU rendering features, material workflows, and renderer architecture

## License

License details are still to be added.