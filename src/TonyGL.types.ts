import type { Camera } from './camera/camera.types';
import type {
  CreateUniformBufferFunction,
  EntityFactoryFunction,
  UniformBuffer,
  UniformBufferOptions,
  UniformObject,
} from './core/core.types';
import type { MaterialType } from './materials/materials.types';
import type { Renderer } from './renderer/renderer.types';
import type { Scene } from './sceneObjects/sceneObjects.types';

type UnionToIntersection<U> = (U extends unknown ? (arg: U) => void : never) extends (arg: infer I) => void ? I : never;

export type TonyFullOptions<M extends readonly TonyModuleFactory[] = readonly TonyModuleFactory[]> = {
  webGPUSetupOnly?: false;
  containerElement?: HTMLElement;
  dpr?: number;
  alpha?: boolean;
  multiSampling?: number;
  requiredFeatures?: GPUFeatureName[];
  requiredLimits?: Record<string, number>;
  modules?: M;
};

export type TonySetupOnlyOptions = {
  webGPUSetupOnly: true;
  containerElement?: HTMLElement;
  requiredFeatures?: GPUFeatureName[];
  requiredLimits?: Record<string, number>;
  alpha?: boolean;
  dpr?: never;
  multiSampling?: never;
};

export type TonyModuleFactory = (context: TonyModuleContext) => TonyModule;

export type TonyModule = Record<string, unknown>;

export type TonyModuleContext = {
  renderer: Renderer;
  entityFactory: EntityFactoryFunction;
  createUniformBuffer: CreateUniformBufferFunction;
  registerMaterialLayoutDescriptor: (name: MaterialType, descriptor: GPUBindGroupLayoutDescriptor) => void;
};

export type TonyOptions<M extends readonly TonyModuleFactory[] = readonly TonyModuleFactory[]> =
  | TonyFullOptions<M>
  | TonySetupOnlyOptions;

export type Tony = {
  renderer: Renderer;
  createUniformBuffer: (uniformObject: UniformObject, options?: UniformBufferOptions) => UniformBuffer;
  render: (scene: Scene, camera: Camera) => void;
  destroy: () => void;
};

export type ModulesToObject<M extends readonly TonyModuleFactory[]> = UnionToIntersection<ReturnType<M[number]>>;

export type TonyWithModules<M extends readonly TonyModuleFactory[]> = Tony & ModulesToObject<M>;
