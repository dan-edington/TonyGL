import type { Entity, EntityOptions, UniformBuffer } from '../core/core.types';
import type { Renderer } from '../renderer/renderer.types';
import type { LightFlag } from './LightManagerFactory';

export type LightOptions = Omit<EntityOptions, 'type'> & {
  color?: ArrayLike<number>;
  intensity?: number;
  range?: number;
};

export type Light = Entity & {
  isLight: boolean;
  flags: LightFlag;
  color: Float32Array;
  intensity: number;
  range: number;
  setColor(value: ArrayLike<number>): void;
  setIntensity(value: number): void;
  setRange(value: number): void;
};

export type PointLight = Light;

export type DirectionalLight = Light & {
  direction: Float32Array;
  setDirection(value: ArrayLike<number>): void;
};

export type SpotLight = DirectionalLight & {
  angle: number;
  penumbra: number;
  setAngle(value: number): void;
  setPenumbra(value: number): void;
};

export type CreateLightBaseFunction = (type: string, options?: LightOptions, flags?: LightFlag) => Light;

export type LightFactoryFunction = ((options?: LightOptions) => Light) & {
  createLightBase: CreateLightBaseFunction;
};

export type DirectionalLightLike = Light & {
  direction: ArrayLike<number>;
};

export type SpotLightLike = Light & {
  direction: ArrayLike<number>;
  angle: number;
  penumbra: number;
};

export type LightManager = {
  lightUniformsBuffer: UniformBuffer | null;
  ambientLight: {
    color: Float32Array;
    intensity: number;
  };
  lights: Light[];
  lightsNeedUpdate: boolean;
  sceneUniformsBindGroup: GPUBindGroup | null;
  setAmbientLightColor(color: ArrayLike<number>): void;
  setAmbientLightIntensity(intensity: number): void;
  setAmbientLight(ambientLight: { color: ArrayLike<number>; intensity: number }): void;
  updateLights(rootEntity: Entity): void;
  createSceneUniformsBindGroup(rendererInstance: Renderer): void;
  destroy(): void;
};
