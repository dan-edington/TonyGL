import { getAdapterInfo } from './renderer/getAdapterInfo';
import { configureRenderer, Renderer } from './renderer/configureRenderer';
import { setupRendererEventListeners } from './renderer/setupRendererEventListeners';
import { PipelineManagerFactory } from './renderer/PipelineManagerFactory';
import { EntityFactory } from './core/EntityFactory';
import { PointLightFactory, PointLight, PointLightOptions } from './lights/PointLightFactory';
import { DirectionalLightFactory, DirectionalLight, DirectionalLightOptions } from './lights/DirectionalLightFactory';
import { SpotLightFactory, SpotLight, SpotLightOptions } from './lights/SpotLightFactory';
import { Geometry, GeometryFactory, GeometryOptions } from './geometry/GeometryFactory';
import { UniformBufferFactory, UniformBufferOptions, UniformObject, UniformBuffer } from './core/UniformBufferFactory';
import { SceneFactory, Scene, SceneOptions } from './sceneObjects/SceneFactory';
import {
  PerspectiveCameraFactory,
  PerspectiveCamera,
  PerspectiveCameraOptions,
} from './camera/PerspectiveCameraFactory';
import { OrbitControlsFactory, OrbitControls, OrbitControlsOptions } from './camera/OrbitControlsFactory';
import {
  BlinnPhongMaterialFactory,
  BlinnPhongMaterial,
  BlinnPhongMaterialOptions,
} from './materials/BlinnPhongMaterialFactory';
import { LambertMaterialFactory, LambertMaterial, LambertMaterialOptions } from './materials/LambertMaterialFactory';
import { NormalMaterialFactory, NormalMaterial, NormalMaterialOptions } from './materials/NormalMaterialFactory';
import { UnlitMaterialFactory, UnlitMaterial, UnlitMaterialOptions } from './materials/UnlitMaterialFactory';
import { CustomMaterialFactory, CustomMaterial, CustomMaterialOptions } from './materials/CustomMaterialFactory';
import { MeshFactory, Mesh, MeshOptions } from './sceneObjects/MeshFactory';
import { initialiseFrameTimers } from './renderer/frameTimers';
import { Group, GroupFactory, GroupOptions } from './sceneObjects/GroupFactory';

export type RendererOptions = {
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
  render: (scene: Scene, camera: PerspectiveCamera) => void;
  destroy: () => void;
};

async function TonyGL(options: RendererOptions): Promise<Tony> {
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
    render,
    destroy,
  };
}

export { TonyGL, getAdapterInfo };
