import { PerspectiveCamera } from './camera/camera.types';
import {
  CreateUniformBufferFunction,
  EntityFactoryFunction,
  UniformBuffer,
  UniformBufferOptions,
  UniformObject,
} from './core/core.types';
import { MaterialType } from './materials/materials.types';
import { Renderer } from './renderer/renderer.types';
import { Scene } from './sceneObjects/sceneObjects.types';

export type TonyFullOptions = {
  webGPUSetupOnly?: false;
  containerElement?: HTMLElement;
  dpr?: number;
  alpha?: boolean;
  multiSampling?: number;
  requiredFeatures?: GPUFeatureName[];
  requiredLimits?: Record<string, number>;
  modules?: TonyModuleFactory[];
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

export type TonyModule = Record<string, any>;

export type TonyModuleContext = {
  renderer: Renderer;
  entityFactory: EntityFactoryFunction;
  createUniformBuffer: CreateUniformBufferFunction;
  registerMaterialLayoutDescriptor: (name: MaterialType, descriptor: GPUBindGroupLayoutDescriptor) => void;
};

export type TonyOptions = TonyFullOptions | TonySetupOnlyOptions;

export type Tony = {
  renderer: Renderer;
  createUniformBuffer: (uniformObject: UniformObject, options?: UniformBufferOptions) => UniformBuffer;
  render: (scene: Scene, camera: PerspectiveCamera) => void;
  destroy: () => void;
};
