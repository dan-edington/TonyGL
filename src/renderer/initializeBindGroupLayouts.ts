import { cameraBindGroupLayoutDescriptor } from './bindGroupLayouts/camera';
import { entityBindGroupLayoutDescriptor } from './bindGroupLayouts/entity';
import { sceneBindGroupLayoutDescriptor } from './bindGroupLayouts/scene';
import { materialBindGroupLayoutDescriptors } from './bindGroupLayouts/materials';
import { MaterialType } from '../materials/materials.types';

function initializeBindGroupLayouts(device: GPUDevice) {
  const cameraBindGroupLayout = device.createBindGroupLayout(cameraBindGroupLayoutDescriptor);
  const sceneBindGroupLayout = device.createBindGroupLayout(sceneBindGroupLayoutDescriptor);
  const entityBindGroupLayout = device.createBindGroupLayout(entityBindGroupLayoutDescriptor);

  return {
    cameraBindGroupLayout,
    sceneBindGroupLayout,
    entityBindGroupLayout,
  };
}

function initializeMaterialBindGroupLayouts(device: GPUDevice) {
  const materialBindGroupLayouts = new Map<MaterialType, GPUBindGroupLayout>();

  for (const [materialType, layoutDescriptor] of materialBindGroupLayoutDescriptors.entries()) {
    const layout = device.createBindGroupLayout(layoutDescriptor);
    materialBindGroupLayouts.set(materialType, layout);
  }

  return materialBindGroupLayouts;
}

export { initializeBindGroupLayouts, initializeMaterialBindGroupLayouts };
