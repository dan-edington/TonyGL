import type { DrawableEntity, Entity, UniformBuffer } from '../core/core.types';
import type { Geometry } from '../geometry/geometry.types';
import type { LightManager } from '../lights/lights.types';
import type { BaseMaterial } from '../materials/materials.types';
import type { Renderer } from '../renderer/renderer.types';

export type Group = Entity;

export type Mesh = Entity & {
  geometry: Geometry;
  material: BaseMaterial;
  pipeline: GPURenderPipeline;
  entityUniformsBuffer: UniformBuffer;
  entityUniformsBindGroup: GPUBindGroup;
  draw(pass: GPURenderPassEncoder, renderer: Renderer): void;
  destroy(): void;
};

export type Scene = Entity & {
  isScene: true;
  renderList: DrawableEntity[];
  renderListNeedsUpdate: boolean;
  sceneUniformsBuffer: UniformBuffer | null;
  sceneUniformsBindGroup: GPUBindGroup | null;
  clearColor: GPUColor;
  clearColorSRGB: GPUColor;
  lightManager: LightManager;
  setClearColor(color: ArrayLike<number>): void;
  setAmbientLightColor(color: ArrayLike<number>): void;
  setAmbientLightIntensity(intensity: number): void;
  updateRenderList(): void;
  updateLights(): void;
};
