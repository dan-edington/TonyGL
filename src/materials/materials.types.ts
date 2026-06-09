import type { UniformBuffer } from '../core/core.types';

export type MaterialType = 'unlit' | 'lambert' | 'normal' | 'blinnphong' | 'custom';

export type BaseMaterial = {
  id: string;
  type: MaterialType;
  shader: string;
  shaderModule: GPUShaderModule;
  materialBindGroupLayout: GPUBindGroupLayout | null;
  materialUniformsBuffer: UniformBuffer | null;
  materialUniformsBindGroup: GPUBindGroup | null;
  transparent: boolean;
  doubleSided: boolean;
  depthWrite: boolean;
  usesAlphaPipeline: boolean;
  updateUniforms(updatedUniforms: Record<string, number | ArrayLike<number>>): void;
  writeBuffers(): void;
  destroy(): void;
};

export type BlinnPhongMaterial = BaseMaterial & {
  color: Float32Array;
  setColor(value: ArrayLike<number>): void;
  shininess: number;
  setShininess(value: number): void;
  specularColor: Float32Array;
  setSpecularColor(value: ArrayLike<number>): void;
  specularStrength: number;
  setSpecularStrength(value: number): void;
};

export type UnlitMaterial = BaseMaterial & {
  color: Float32Array;
  setColor(value: ArrayLike<number>): void;
};

export type LambertMaterial = BaseMaterial & {
  color: Float32Array;
  setColor(value: ArrayLike<number>): void;
};

export type NormalMaterial = BaseMaterial;

export type CustomMaterial = BaseMaterial;
