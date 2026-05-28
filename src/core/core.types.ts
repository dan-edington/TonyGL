import type { Renderer } from '../renderer/renderer.types';

export type uuid = `${string}-${string}-${string}-${string}-${string}`;

export type EntityOptions = {
  type: string;
  name?: string;
  position?: ArrayLike<number>;
  scale?: ArrayLike<number>;
  rotation?: ArrayLike<number>;
  quaternion?: ArrayLike<number>;
  visible?: boolean;
};

export type EntityWithSubscription<T extends Entity = Entity> = {
  entity: T;
  subscribe: (subscriptionEvent: EntitySubscriptionEvent, subscriptionCallback: EntitySubscriptionCallback) => void;
};

export type EntityFactoryFunction = <T extends Entity = Entity>(options: EntityOptions) => EntityWithSubscription<T>;

export type EntitySubscriptionEvent =
  | 'onTransformChanged'
  | 'onVisibilityChanged'
  | 'onHierarchyChanged'
  | 'onMatrixUpdated'
  | 'onDestroy';

export type EntitySubscriptionCallback = () => void;

export type Entity = {
  id: uuid;
  type: string;
  name: string;
  isLight: boolean;
  children: Entity[];
  parent: Entity | null;
  position: Float32Array;
  scale: Float32Array;
  rotation: Float32Array;
  quaternion: Float32Array;
  matrix: Float32Array;
  matrixWorld: Float32Array;
  visible: boolean;
  matrixNeedsUpdate: boolean;
  setPosition(newPosition: ArrayLike<number>): void;
  setScale(newScale: ArrayLike<number>): void;
  setRotation(newRotation: ArrayLike<number>): void;
  setQuaternion(newQuaternion: ArrayLike<number>): void;
  setVisible(isVisible: boolean): void;
  add(childrenToAdd: Entity | Entity[]): void;
  remove(childToRemove: Entity): void;
  updateMatrix(): void;
  destroy(): void;
};

export type DrawableEntity = Entity & {
  draw: (passEncoder: GPURenderPassEncoder, rendererInstance: Renderer) => void;
};

export type UniformBufferOptions = {
  addressSpace?: BufferAddressSpace;
  usage?: GPUBufferUsageFlags;
};

export type UniformValue = {
  type: string;
  value: number | Float16Array | Float32Array | Int32Array | Uint32Array;
};

export type UniformValueInput = number | ArrayLike<number>;

export type UniformObject = Record<string, UniformValue>;

export type UniformBuffer = {
  id: uuid;
  type: string;
  buffer: GPUBuffer | null;
  uniforms: Record<string, UniformValue>;
  bufferData: ArrayBuffer | null;
  updateUniforms(updatedUniforms: Record<string, UniformValueInput>): void;
  writeUpdatedBufferData(): void;
  destroy(): void;
};

export type CreateUniformBufferFunction = (
  uniformObject: UniformObject,
  options?: UniformBufferOptions,
) => UniformBuffer;

export type BufferAddressSpace = 'uniform' | 'storage';

export type NumericTypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;

export type BigIntTypedArray = BigInt64Array | BigUint64Array;

export type ScalarType = 'f16' | 'f32' | 'i32' | 'u32';

export type ScalarLayout = {
  kind: 'scalar';
  scalar: ScalarType;
  align: number;
  size: number;
  elementCount: number;
};

export type VectorLayout = {
  kind: 'vector';
  scalar: ScalarType;
  length: number;
  align: number;
  size: number;
  elementCount: number;
};

export type MatrixLayout = {
  kind: 'matrix';
  scalar: 'f16' | 'f32';
  columns: number;
  rows: number;
  align: number;
  size: number;
  stride: number;
  elementCount: number;
};

export type ArrayLayout = {
  kind: 'array';
  element: UniformLayout;
  length: number;
  align: number;
  size: number;
  stride: number;
  elementCount: number;
};

export type UniformLayout = ScalarLayout | VectorLayout | MatrixLayout | ArrayLayout;

export type UniformEntryMeta = {
  key: string;
  offset: number;
  layout: UniformLayout;
};

export type ComputeBufferLayoutResult = {
  bufferData: ArrayBuffer;
  layoutEntries: UniformEntryMeta[];
};

export type ComputeBufferLayoutOptions = {
  addressSpace?: BufferAddressSpace;
};
