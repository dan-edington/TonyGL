import type { MaterialType } from '../../materials/materials.types';

type MaterialBindGroupLayoutDescriptorList = Map<MaterialType, GPUBindGroupLayoutDescriptor>;

const materialBindGroupLayoutDescriptors: MaterialBindGroupLayoutDescriptorList = new Map();

function registerMaterialLayoutDescriptor(name: MaterialType, descriptor: GPUBindGroupLayoutDescriptor) {
  if (!materialBindGroupLayoutDescriptors.has(name)) {
    materialBindGroupLayoutDescriptors.set(name, descriptor);
  }
}

export { materialBindGroupLayoutDescriptors, registerMaterialLayoutDescriptor };
