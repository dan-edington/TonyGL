import { getAdapterInfo } from './renderer/getAdapterInfo';
import { configureRenderer } from './renderer/configureRenderer';
import { setupRendererEventListeners } from './renderer/setupRendererEventListeners';
import { PipelineManagerFactory } from './renderer/PipelineManagerFactory';
import { EntityFactory } from './core/EntityFactory';
import { PointLightFactory, PointLightOptions } from './lights/PointLightFactory';
import { DirectionalLightFactory, DirectionalLightOptions } from './lights/DirectionalLightFactory';
import { SpotLightFactory, SpotLightOptions } from './lights/SpotLightFactory';
import { GeometryFactory, GeometryOptions } from './geometry/GeometryFactory';
import { UniformBufferFactory } from './core/UniformBufferFactory';
import { SceneFactory, SceneOptions } from './sceneObjects/SceneFactory';
import { PerspectiveCameraFactory, PerspectiveCameraOptions } from './camera/PerspectiveCameraFactory';
import { OrbitControlsFactory, OrbitControlsOptions } from './camera/OrbitControlsFactory';
import { BlinnPhongMaterialFactory, BlinnPhongMaterialOptions } from './materials/BlinnPhongMaterialFactory';
import { LambertMaterialFactory, LambertMaterialOptions } from './materials/LambertMaterialFactory';
import { NormalMaterialFactory, NormalMaterial, NormalMaterialOptions } from './materials/NormalMaterialFactory';
import { UnlitMaterialFactory, UnlitMaterial, UnlitMaterialOptions } from './materials/UnlitMaterialFactory';
import { CustomMaterialFactory, CustomMaterialOptions } from './materials/CustomMaterialFactory';
import { MeshFactory, MeshOptions } from './sceneObjects/MeshFactory';
import { initialiseFrameTimers } from './renderer/frameTimers';
import { GroupFactory, GroupOptions } from './sceneObjects/GroupFactory';
import { CreateTextureFromDataOptions, TextureFactory } from './texture/Texture';
import type { Renderer } from './renderer/renderer.types';
import type { Group, Mesh, Scene } from './sceneObjects/sceneObjects.types';
import type { OrbitControls, PerspectiveCamera } from './camera/camera.types';
import type { DirectionalLight, PointLight, SpotLight } from './lights/lights.types';
import type { Geometry } from './geometry/geometry.types';
import type { BlinnPhongMaterial, CustomMaterial, LambertMaterial } from './materials/materials.types';
import type { UniformBuffer, UniformBufferOptions, UniformObject } from './core/core.types';
import type { Texture } from './texture/texture.types';

export type TonyOptions = {
  containerElement?: HTMLElement;
  dpr?: number;
  alpha?: boolean;
  multiSampling?: number;
  requiredFeatures?: GPUFeatureName[];
  requiredLimits?: Record<string, number>;
};

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

async function TonyGL(options: TonyOptions): Promise<Tony> {
  // Setup Renderer
  const renderer = await configureRenderer(options);
  const frameTimers = initialiseFrameTimers();
  const { rendererEventsAbortController } = setupRendererEventListeners(renderer);
  const { clearPipelineCache } = PipelineManagerFactory(renderer);

  // Setup re-usable Factories
  const createUniformBuffer = UniformBufferFactory(renderer);
  const entityFactory = EntityFactory;

  // Generate primitive creation functions
  const createPointLight = PointLightFactory(entityFactory);
  const createDirectionalLight = DirectionalLightFactory(entityFactory);
  const createSpotLight = SpotLightFactory(entityFactory);
  const createGroup = GroupFactory(entityFactory);
  const createScene = SceneFactory(renderer, entityFactory, createUniformBuffer);
  const createPerspectiveCamera = PerspectiveCameraFactory(renderer, entityFactory, createUniformBuffer);
  const createGeometry = GeometryFactory(renderer);
  const createMesh = MeshFactory(renderer, entityFactory, createUniformBuffer);
  const createTextureFromData = TextureFactory(renderer);
  const { createBlinnPhongMaterial } = BlinnPhongMaterialFactory(renderer, createUniformBuffer);
  const { createLambertMaterial } = LambertMaterialFactory(renderer, createUniformBuffer);
  const { createNormalMaterial } = NormalMaterialFactory(renderer, createUniformBuffer);
  const { createUnlitMaterial } = UnlitMaterialFactory(renderer, createUniformBuffer);
  const { createCustomMaterial } = CustomMaterialFactory(renderer, createUniformBuffer);

  function render(scene: Scene, camera: PerspectiveCamera) {
    renderer.timers = frameTimers.updateFrameTimers();

    scene.updateRenderList();
    scene.updateLights();

    scene.sceneUniformsBuffer?.writeUpdatedBufferData();
    scene.lightManager.lightUniformsBuffer?.writeUpdatedBufferData();
    camera.updateCameraUniforms();

    const commandEncoder = renderer.device.createCommandEncoder();

    renderer.passManager.scene = scene;
    renderer.passManager.camera = camera;
    renderer.passManager.runPasses(renderer.passOrder, commandEncoder);

    renderer.device.queue.submit([commandEncoder.finish()]);
  }

  function destroy() {
    rendererEventsAbortController.abort();
    renderer.depthTexture.texture.destroy();
    renderer.multiSampleTexture.texture.destroy();
    renderer.passManager.destroyRenderTargets();
    renderer.textureLibrary.destroy();
    clearPipelineCache();
  }

  return {
    renderer,
    createGroup,
    createScene,
    createPerspectiveCamera,
    createPointLight,
    createDirectionalLight,
    createSpotLight,
    createOrbitControls: OrbitControlsFactory,
    createGeometry,
    createMesh,
    createBlinnPhongMaterial,
    createUnlitMaterial,
    createLambertMaterial,
    createNormalMaterial,
    createCustomMaterial,
    createUniformBuffer,
    createTextureFromData,
    render,
    destroy,
  };
}

export { TonyGL, getAdapterInfo };
