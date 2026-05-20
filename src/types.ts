export type uuid = `${string}-${string}-${string}-${string}-${string}`;

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

export type BufferAddressSpace = 'uniform' | 'storage';

export type UniformValue = {
  type: string;
  value: number | Float16Array | Float32Array | Int32Array | Uint32Array;
};

export type UniformValueInput = number | ArrayLike<number>;

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

export type MaterialType = 'lambert' | 'blinnphong' | 'pbr' | 'normal' | 'unlit' | 'custom';

export type TextureFallback = 'white' | 'black' | 'normal';

export type MaterialTextureSlot = 'albedo' | 'alpha' | 'normal';

export type TextureKey = string;
export type SamplerDescriptorKey = string;
