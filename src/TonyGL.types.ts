import { OrbitControls, PerspectiveCamera } from './camera/camera.types';
import { OrbitControlsOptions } from './camera/OrbitControlsFactory';
import { PerspectiveCameraOptions } from './camera/PerspectiveCameraFactory';
import { UniformBuffer, UniformBufferOptions, UniformObject } from './core/core.types';
import { Geometry } from './geometry/geometry.types';
import { GeometryOptions } from './geometry/GeometryFactory';
import { DirectionalLightOptions } from './lights/DirectionalLightFactory';
import { DirectionalLight, PointLight, SpotLight } from './lights/lights.types';
import { PointLightOptions } from './lights/PointLightFactory';
import { SpotLightOptions } from './lights/SpotLightFactory';
import { BlinnPhongMaterialOptions } from './materials/BlinnPhongMaterialFactory';
import { CustomMaterialOptions } from './materials/CustomMaterialFactory';
import { LambertMaterialOptions } from './materials/LambertMaterialFactory';
import { BlinnPhongMaterial, CustomMaterial, LambertMaterial } from './materials/materials.types';
import { NormalMaterial, NormalMaterialOptions } from './materials/NormalMaterialFactory';
import { UnlitMaterial, UnlitMaterialOptions } from './materials/UnlitMaterialFactory';
import { Renderer } from './renderer/renderer.types';
import { GroupOptions } from './sceneObjects/GroupFactory';
import { MeshOptions } from './sceneObjects/MeshFactory';
import { SceneOptions } from './sceneObjects/SceneFactory';
import { Group, Mesh, Scene } from './sceneObjects/sceneObjects.types';
import { CreateTextureFromDataOptions } from './texture/Texture';
import { Texture } from './texture/texture.types';

export type TonyFullOptions = {
  webGPUSetupOnly?: false;
  containerElement?: HTMLElement;
  dpr?: number;
  alpha?: boolean;
  multiSampling?: number;
  requiredFeatures?: GPUFeatureName[];
  requiredLimits?: Record<string, number>;
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

export type TonyOptions = TonyFullOptions | TonySetupOnlyOptions;

export type Tony = {
  renderer: Renderer;
  createGroup: (options: GroupOptions) => Group;
  createScene: (options?: SceneOptions) => Scene;
  createPerspectiveCamera: (options?: PerspectiveCameraOptions) => PerspectiveCamera;
  createPointLight: (options?: PointLightOptions) => PointLight;
  createDirectionalLight: (options?: DirectionalLightOptions) => DirectionalLight;
  createSpotLight: (options?: SpotLightOptions) => SpotLight;
  createOrbitControls: (options: OrbitControlsOptions) => OrbitControls;
  createGeometry: (options: GeometryOptions) => Geometry;
  createMesh: (
    geometry: Geometry,
    material: BlinnPhongMaterial | UnlitMaterial | LambertMaterial | NormalMaterial | CustomMaterial,
    options?: MeshOptions,
  ) => Mesh;
  createBlinnPhongMaterial: (options?: BlinnPhongMaterialOptions) => BlinnPhongMaterial;
  createUnlitMaterial: (options?: UnlitMaterialOptions) => UnlitMaterial;
  createLambertMaterial: (options?: LambertMaterialOptions) => LambertMaterial;
  createNormalMaterial: (options?: NormalMaterialOptions) => NormalMaterial;
  createCustomMaterial: (options: CustomMaterialOptions) => CustomMaterial;
  createUniformBuffer: (uniformObject: UniformObject, options?: UniformBufferOptions) => UniformBuffer;
  createTextureFromData: (options: CreateTextureFromDataOptions) => Texture;
  render: (scene: Scene, camera: PerspectiveCamera) => void;
  destroy: () => void;
};
