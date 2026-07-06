import { describe, expect, it } from 'vitest';
import { EntityFactory } from '../core/EntityFactory';
import { Scene, SceneOptions } from '../sceneObjects/Scene';
import type { CreateUniformBufferFunction, Entity, UniformBuffer } from '../core/core.types';
import type { Renderer } from '../renderer/renderer.types';
import { Scene as SceneType } from '../sceneObjects/sceneObjects.types';
import { TonyModuleContext } from '../TonyGL.types';
import { registerMaterialLayoutDescriptor } from '../renderer/bindGroupLayouts/materials';

function createEntity(
  name: string,
  options?: { visible?: boolean; drawable?: boolean },
): Entity & { destroy: () => void } {
  const { entity } = EntityFactory<Entity>({
    type: 'TestEntity',
    name,
    visible: options?.visible ?? true,
  });

  if (options?.drawable) {
    (entity as Entity & { draw(): void }).draw = () => {};
  }

  return entity;
}

function createUniformBufferStub(onDestroy?: () => void): UniformBuffer {
  return {
    id: crypto.randomUUID(),
    type: 'UniformBuffer',
    addressSpace: 'uniform',
    buffer: {} as GPUBuffer,
    uniforms: {},
    bufferData: new ArrayBuffer(0),
    updateUniforms() {},
    writeUpdatedBufferData() {},
    destroy() {
      onDestroy?.();
    },
  };
}

function createScene(options: SceneOptions = {}, onUniformBufferDestroy?: () => void): SceneType {
  const renderer = {
    device: {
      createBindGroup: () => ({}) as GPUBindGroup,
    },
    bindGroupLayouts: {
      sceneBindGroupLayout: {} as GPUBindGroupLayout,
    },
  } as unknown as Renderer;

  const createUniformBuffer: CreateUniformBufferFunction = () => createUniformBufferStub(onUniformBufferDestroy);
  const tonyContext: TonyModuleContext = {
    renderer,
    entityFactory: EntityFactory,
    createUniformBuffer,
    registerMaterialLayoutDescriptor,
    tony: {} as any,
  };
  const sceneProduct = Scene(tonyContext);
  return sceneProduct.createScene(options);
}

function buildSceneFixture() {
  const rootVisibleRenderable = createEntity('root-visible-renderable', {
    visible: true,
    drawable: true,
  });
  const childVisibleRenderable = createEntity('child-visible-renderable', {
    visible: true,
    drawable: true,
  });
  const childVisibleNotRenderable = createEntity('child-visible-not-renderable', {
    visible: true,
  });
  const grandchildVisibleRenderable = createEntity('grandchild-visible-renderable', {
    visible: true,
    drawable: true,
  });
  const hiddenParentRenderable = createEntity('hidden-parent-renderable', {
    visible: false,
    drawable: true,
  });
  const hiddenBranchChildRenderable = createEntity('hidden-branch-child-renderable', {
    visible: true,
    drawable: true,
  });
  const secondRootVisibleNotRenderable = createEntity('second-root-visible-not-renderable', {
    visible: true,
  });
  const secondRootChildRenderable = createEntity('second-root-child-renderable', {
    visible: true,
    drawable: true,
  });
  const secondRootGrandchildHidden = createEntity('second-root-grandchild-hidden', {
    visible: false,
  });

  childVisibleNotRenderable.children.push(grandchildVisibleRenderable);
  hiddenParentRenderable.children.push(hiddenBranchChildRenderable);
  rootVisibleRenderable.children.push(childVisibleRenderable, childVisibleNotRenderable, hiddenParentRenderable);

  secondRootChildRenderable.children.push(secondRootGrandchildHidden);
  secondRootVisibleNotRenderable.children.push(secondRootChildRenderable);

  return {
    roots: [rootVisibleRenderable, secondRootVisibleNotRenderable],
    expectedRenderListIds: [
      rootVisibleRenderable.id,
      childVisibleRenderable.id,
      grandchildVisibleRenderable.id,
      secondRootChildRenderable.id,
    ],
  };
}

describe('Scene', () => {
  it('adds root entities and marks the render list as dirty', () => {
    const scene = createScene();
    const { roots } = buildSceneFixture();

    expect(scene.children).toHaveLength(0);
    expect(scene.renderListNeedsUpdate).toBe(true);

    roots.forEach((root, index) => {
      scene.add(root);

      expect(scene.children).toHaveLength(index + 1);
      expect(scene.children[index]).toBe(root);
      expect(scene.renderListNeedsUpdate).toBe(true);
    });
  });

  it('collects only visible renderable entities from nested children', () => {
    const scene = createScene();
    const { roots, expectedRenderListIds } = buildSceneFixture();

    roots.forEach((root) => {
      scene.add(root);
    });

    scene.updateRenderList();

    expect(scene.renderListNeedsUpdate).toBe(false);
    expect(scene.renderList.map((entity) => entity.id)).toEqual(expectedRenderListIds);
    expect(scene.renderList.every((entity) => entity.visible)).toBe(true);

    const firstRenderListIds = scene.renderList.map((entity) => entity.id);

    scene.updateRenderList();

    expect(scene.renderList.map((entity) => entity.id)).toEqual(firstRenderListIds);
  });

  it('marks render list dirty when adding a root entity after rendering', () => {
    const scene = createScene();
    const parent = createEntity('parent');
    const child = createEntity('child');

    scene.add(parent);
    scene.updateRenderList();

    expect(scene.renderListNeedsUpdate).toBe(false);

    scene.add(child);

    expect(scene.renderListNeedsUpdate).toBe(true);
  });

  it('marks render list dirty when removing a root entity', () => {
    const scene = createScene();
    const parent = createEntity('parent');
    const child = createEntity('child');

    scene.add(parent);
    scene.add(child);
    scene.updateRenderList();

    expect(scene.renderListNeedsUpdate).toBe(false);

    scene.remove(child);

    expect(scene.renderListNeedsUpdate).toBe(true);
  });

  it('does not destroy the parent scene when removing a child', () => {
    let destroyedBuffers = 0;
    const scene = createScene({}, () => {
      destroyedBuffers += 1;
    });
    const child = createEntity('child');

    scene.add(child);

    scene.remove(child);

    expect(destroyedBuffers).toBe(0);
  });
});
