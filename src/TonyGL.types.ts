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

type AnyTonyModule = {
  [k: string]: unknown;
  __dependencies?: readonly TonyAnyModuleFactory[];
};

export type TonyAnyModuleFactory = TonyModuleFactory<any, AnyTonyModule>;

type ModuleDependencies<TModule> = TModule extends {
  __dependencies?: infer TDependencies extends readonly TonyAnyModuleFactory[];
}
  ? TDependencies
  : readonly [];

type Includes<TItems extends readonly unknown[], TValue> = TItems extends readonly [infer THead, ...infer TTail]
  ? [TValue] extends [THead]
    ? true
    : Includes<TTail, TValue>
  : false;

type RecursiveModuleReturns<
  TFactories extends readonly TonyAnyModuleFactory[],
  TSeen extends readonly TonyAnyModuleFactory[] = readonly [],
> = TFactories[number] extends infer TFactory
  ? TFactory extends TonyAnyModuleFactory
    ? Includes<TSeen, TFactory> extends true
      ? never
      : ReturnType<TFactory> | RecursiveModuleReturns<ModuleDependencies<ReturnType<TFactory>>, [...TSeen, TFactory]>
    : never
  : never;

export type TonyFullOptions<M extends readonly TonyAnyModuleFactory[] = readonly TonyAnyModuleFactory[]> = {
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

export type TonyModuleFactory<
  TTony extends Tony = Tony & Record<string, any>,
  TModule extends AnyTonyModule = AnyTonyModule,
> = {
  bivarianceHack(context: TonyModuleContext<TTony>): TModule;
}['bivarianceHack'];

export type TonyModuleFactoryWithDependencies<
  TDependencies extends readonly TonyAnyModuleFactory[] = readonly TonyAnyModuleFactory[],
> = TonyModuleFactory<Tony & ModulesToObject<TDependencies>, TonyModule<TDependencies>>;

export type TonyModule<TDependencies extends readonly TonyAnyModuleFactory[] = readonly TonyAnyModuleFactory[]> = {
  [k: string]: unknown;
  __dependencies?: TDependencies;
};

export type TonyModuleContext<TTony extends Tony = Tony & Record<string, any>> = {
  renderer: Renderer;
  entityFactory: EntityFactoryFunction;
  createUniformBuffer: CreateUniformBufferFunction;
  registerMaterialLayoutDescriptor: (name: MaterialType, descriptor: GPUBindGroupLayoutDescriptor) => void;
  tony: TTony;
};

export type TonyOptions<M extends readonly TonyAnyModuleFactory[] = readonly TonyAnyModuleFactory[]> =
  | TonyFullOptions<M>
  | TonySetupOnlyOptions;

export type Tony = {
  renderer: Renderer;
  createUniformBuffer: (uniformObject: UniformObject, options?: UniformBufferOptions) => UniformBuffer;
  render: (scene: Scene, camera: Camera) => void;
  destroy: () => void;
};

type ModulePublicShape<T> = T extends object ? Omit<T, '__dependencies'> : T;

export type ModulesToObject<M extends readonly TonyAnyModuleFactory[]> = [RecursiveModuleReturns<M>] extends [never]
  ? {}
  : UnionToIntersection<ModulePublicShape<RecursiveModuleReturns<M>>>;

export type TonyWithModules<M extends readonly TonyAnyModuleFactory[]> = Tony & ModulesToObject<M>;
