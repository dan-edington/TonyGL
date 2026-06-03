import { errorMessages } from '../constants/errorMessages';
import { srgbToLinear } from '../utilities/colorUtilities';
import { LightManagerFactory } from '../lights/LightManagerFactory';
import type { DrawableEntity, Entity, EntityOptions } from '../core/core.types';
import type { Scene } from './sceneObjects.types';
import { TonyModuleContext } from '../TonyGL.types';

export type SceneOptions = Omit<EntityOptions, 'type'>;

function Scene(context: TonyModuleContext) {
  const { renderer, entityFactory, createUniformBuffer } = context;

  function createScene(options: SceneOptions = {}): Scene {
    const { entity: self, subscribe } = entityFactory<Scene>({ ...options, type: 'Scene' });

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

    self.isScene = true;
    self.sceneUniformsBuffer = sceneUniformsBuffer;
    self.sceneUniformsBindGroup = sceneUniformsBindGroup;
    self.lightManager = lightManager;
    self.renderList = [];
    self.renderListNeedsUpdate = true;
    self.clearColorSRGB = { r: 0, g: 0, b: 0, a: 1 };
    self.clearColor = { r: 0, g: 0, b: 0, a: 1 };

    subscribe('onHierarchyChanged', () => {
      self.renderListNeedsUpdate = true;
    });

    subscribe('onDestroy', () => {
      lightManager.destroy();
      sceneUniformsBuffer?.destroy();
    });

    function setClearColor(color: ArrayLike<number>) {
      self.clearColorSRGB = { r: color[0], g: color[1], b: color[2], a: color[3] };
      self.clearColor = {
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
      if (!self.renderListNeedsUpdate) return;

      self.renderList = [];

      const isDrawableEntity = (node: Entity): node is DrawableEntity => {
        return typeof (node as Partial<DrawableEntity>).draw === 'function';
      };

      const traverse = (node: Entity, parentVisible: boolean) => {
        const isVisible = parentVisible && node.visible;
        if (!isVisible) return;

        if (isDrawableEntity(node)) {
          self.renderList.push(node);
        }

        node.children.forEach((child) => traverse(child, isVisible));
      };

      self.children.forEach((child) => traverse(child, self.visible));
      self.renderListNeedsUpdate = false;
    }

    function updateLights() {
      lightManager.updateLights(self);
    }

    self.setClearColor = setClearColor;
    self.setAmbientLightColor = setAmbientLightColor;
    self.setAmbientLightIntensity = setAmbientLightIntensity;
    self.updateRenderList = updateRenderList;
    self.updateLights = updateLights;

    return self;
  }

  return {
    createScene,
  };
}

export { Scene };
