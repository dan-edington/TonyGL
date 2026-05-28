import { getAdapterInfo } from './renderer/getAdapterInfo';
import { configureRenderer } from './renderer/configureRenderer';
import { setupRendererEventListeners } from './renderer/setupRendererEventListeners';
import { PipelineManagerFactory } from './renderer/PipelineManagerFactory';
import { EntityFactory } from './core/EntityFactory';
import { PointLightFactory } from './lights/PointLightFactory';
import { DirectionalLightFactory } from './lights/DirectionalLightFactory';
import { SpotLightFactory } from './lights/SpotLightFactory';
import { GeometryFactory } from './geometry/GeometryFactory';
import { UniformBufferFactory } from './core/UniformBufferFactory';
import { SceneFactory } from './sceneObjects/SceneFactory';
import { PerspectiveCameraFactory } from './camera/PerspectiveCameraFactory';
import { OrbitControlsFactory } from './camera/OrbitControlsFactory';
import { BlinnPhongMaterialFactory } from './materials/BlinnPhongMaterialFactory';
import { LambertMaterialFactory } from './materials/LambertMaterialFactory';
import { NormalMaterialFactory } from './materials/NormalMaterialFactory';
import { UnlitMaterialFactory } from './materials/UnlitMaterialFactory';
import { CustomMaterialFactory } from './materials/CustomMaterialFactory';
import { MeshFactory } from './sceneObjects/MeshFactory';
import { initialiseFrameTimers } from './renderer/frameTimers';
import { GroupFactory } from './sceneObjects/GroupFactory';
import { TextureFactory } from './texture/Texture';
import type { WebGPUBase } from './renderer/renderer.types';
import type { Scene } from './sceneObjects/sceneObjects.types';
import type { PerspectiveCamera } from './camera/camera.types';
import type { Tony, TonyFullOptions, TonyOptions, TonySetupOnlyOptions } from './TonyGL.types';

function TonyGL(options: TonySetupOnlyOptions): Promise<WebGPUBase>;
function TonyGL(options: TonyFullOptions): Promise<Tony>;
async function TonyGL(options: TonyOptions): Promise<Tony | WebGPUBase> {
  if (options.webGPUSetupOnly) {
    return configureRenderer(options);
  }

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
