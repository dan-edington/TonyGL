import { errorMessages } from '../constants/errorMessages';
import { srgbToLinear } from '../utilities/colorUtilities';
import { Renderer } from '../renderer/configureRenderer';
import { Entity, EntityFactoryFunction, EntityOptions } from '../core/EntityFactory';
import { LightManagerFactory, LightManager } from '../lights/LightManagerFactory';
import { CreateUniformBufferFunction, UniformBuffer } from '../core/UniformBufferFactory';

export type SceneOptions = Omit<EntityOptions, 'type'>;

export type Scene = Entity & {
  isScene: true;
  renderList: Entity[];
  renderListNeedsUpdate: boolean;
  sceneUniformsBuffer: UniformBuffer | null;
  sceneUniformsBindGroup: GPUBindGroup | null;
  clearColor: GPUColor;
  clearColorSRGB: GPUColor;
  lightManager: LightManager;
  setClearColor(color: ArrayLike<number>): void;
  setAmbientLightColor(color: ArrayLike<number>): void;
  setAmbientLightIntensity(intensity: number): void;
  updateRenderList(): void;
  updateLights(): void;
};

function SceneFactory(
  renderer: Renderer,
  entityFactory: EntityFactoryFunction,
  createUniformBuffer: CreateUniformBufferFunction,
) {
  return function createScene(options: SceneOptions = {}): Scene {
    const { entity, subscribe } = entityFactory({ ...options, type: 'Scene' });

    const sceneUniformsBuffer = createUniformBuffer({
      _padding: { type: 'u32', value: 0 },
    });

    const lightManager = LightManagerFactory(renderer, createUniformBuffer);

    if (!sceneUniformsBuffer?.buffer) throw new Error(errorMessages.missingSceneUniformsBuffer);
    if (!lightManager.lightUniformsBuffer?.buffer) throw new Error(errorMessages.missingLightUniformsBuffer);

    const sceneUniformsBindGroup = renderer.device.createBindGroup({
      layout: renderer.bindGroupLayouts.sceneBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: sceneUniformsBuffer.buffer } },
        { binding: 1, resource: { buffer: lightManager.lightUniformsBuffer.buffer } },
      ],
    });

    let renderList: Entity[] = [];
    let renderListNeedsUpdate = true;

    let clearColorSRGB: GPUColor = { r: 0, g: 0, b: 0, a: 1 };
    let clearColor: GPUColor = { r: 0, g: 0, b: 0, a: 1 };

    subscribe('onHierarchyChanged', () => {
      renderListNeedsUpdate = true;
    });

    subscribe('onDestroy', () => {
      lightManager.destroy();
      sceneUniformsBuffer?.destroy();
    });

    function setClearColor(color: ArrayLike<number>) {
      clearColorSRGB = { r: color[0], g: color[1], b: color[2], a: color[3] };
      clearColor = {
        r: srgbToLinear(color[0] as number),
        g: srgbToLinear(color[1] as number),
        b: srgbToLinear(color[2] as number),
        a: color[3],
      };
    }

    function setAmbientLightColor(color: ArrayLike<number>) {
      lightManager.setAmbientLightColor(color);
    }

    function setAmbientLightIntensity(intensity: number) {
      lightManager.setAmbientLightIntensity(intensity);
    }

    function updateRenderList() {
      if (!renderListNeedsUpdate) return;

      renderList = [];

      const traverse = (node: Entity, parentVisible: boolean) => {
        const isVisible = parentVisible && node.visible;
        if (!isVisible) return;
        renderList.push(node);
        node.children.forEach((child) => traverse(child, isVisible));
      };

      entity.children.forEach((child) => traverse(child, entity.visible));
      renderListNeedsUpdate = false;
    }

    function updateLights() {
      lightManager.updateLights(scene as unknown as any);
    }

    const scene: Scene = {
      ...entity,
      isScene: true,
      sceneUniformsBuffer,
      sceneUniformsBindGroup,
      lightManager,
      get renderList() {
        return renderList;
      },
      get renderListNeedsUpdate() {
        return renderListNeedsUpdate;
      },
      set renderListNeedsUpdate(value: boolean) {
        renderListNeedsUpdate = value;
      },
      get clearColor() {
        return clearColor;
      },
      get clearColorSRGB() {
        return clearColorSRGB;
      },
      setClearColor,
      setAmbientLightColor,
      setAmbientLightIntensity,
      updateRenderList,
      updateLights,
    };

    return scene;
  };
}

export { SceneFactory };
