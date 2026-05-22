import { blinnPhongMaterialLayoutDescriptor } from '../../materials/BlinnPhongMaterialFactory';
import { lambertMaterialLayoutDescriptor } from '../../materials/LambertMaterialFactory';
import { normalMaterialLayoutDescriptor } from '../../materials/NormalMaterialFactory';
import { unlitMaterialLayoutDescriptor } from '../../materials/UnlitMaterialFactory';
import { customMaterialLayoutDescriptor } from '../../materials/CustomMaterialFactory';
import type { MaterialType } from '../../materials/materials.types';

type MaterialBindGroupLayoutDescriptorList = Map<MaterialType, GPUBindGroupLayoutDescriptor>;

const materialBindGroupLayoutDescriptors: MaterialBindGroupLayoutDescriptorList = new Map([
  ['unlit', unlitMaterialLayoutDescriptor],
  ['lambert', lambertMaterialLayoutDescriptor],
  ['normal', normalMaterialLayoutDescriptor],
  ['blinnphong', blinnPhongMaterialLayoutDescriptor],
  ['custom', customMaterialLayoutDescriptor],
]);

export { materialBindGroupLayoutDescriptors };
