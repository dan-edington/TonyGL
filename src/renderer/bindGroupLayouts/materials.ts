import { blinnPhongMaterialLayoutDescriptor } from '../../materials/BlinnPhongMaterialFactory';
import { lambertMaterialLayoutDescriptor } from '../../materials/LambertMaterialFactory';
import { normalMaterialLayoutDescriptor } from '../../materials/NormalMaterialFactory';
import { unlitMaterialLayoutDescriptor } from '../../materials/UnlitMaterialFactory';
import { customMaterialLayoutDescriptor } from '../../materials/CustomMaterialFactory';
import type { MaterialType } from '../../materials/MaterialsFactory';

type MaterialBindGroupLayoutDescriptorList = Map<MaterialType, GPUBindGroupLayoutDescriptor>;

// Factories require renderer/createUniformBuffer, so expose layout descriptors as static
const materialBindGroupLayoutDescriptors: MaterialBindGroupLayoutDescriptorList = new Map([
  ['unlit', unlitMaterialLayoutDescriptor],
  ['lambert', lambertMaterialLayoutDescriptor],
  ['normal', normalMaterialLayoutDescriptor],
  ['blinnphong', blinnPhongMaterialLayoutDescriptor],
  ['custom', customMaterialLayoutDescriptor],
]);

export { materialBindGroupLayoutDescriptors };
