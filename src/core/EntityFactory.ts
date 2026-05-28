import { mat4, quat, vec3 } from 'wgpu-matrix';
import type {
  Entity,
  EntityFactoryFunction,
  EntityOptions,
  EntityWithSubscription,
  EntitySubscriptionCallback,
  EntitySubscriptionEvent,
} from './core.types';

const EntityFactory: EntityFactoryFunction = <T extends Entity = Entity>(
  options: EntityOptions,
): EntityWithSubscription<T> => {
  const children: Entity[] = [];

  const subscribers = new Map<EntitySubscriptionEvent, EntitySubscriptionCallback[]>([
    ['onTransformChanged', []],
    ['onVisibilityChanged', []],
    ['onHierarchyChanged', []],
    ['onMatrixUpdated', []],
    ['onDestroy', []],
  ]);

  function publish(subscriptionEvent: EntitySubscriptionEvent) {
    const events = subscribers.get(subscriptionEvent);
    if (!events) return;

    for (let i = 0; i < events.length; i++) {
      events[i]();
    }
  }

  function subscribe(subscriptionEvent: EntitySubscriptionEvent, subscriptionCallback: EntitySubscriptionCallback) {
    let events = subscribers.get(subscriptionEvent);
    if (!events) {
      events = [];
      subscribers.set(subscriptionEvent, events);
    }
    events.push(subscriptionCallback);
  }

  function setPosition(newPosition: ArrayLike<number>) {
    vec3.set(newPosition[0], newPosition[1], newPosition[2], self.position);
    self.matrixNeedsUpdate = true;
    updateMatrix();
    publish('onTransformChanged');
  }

  function setScale(newScale: ArrayLike<number>) {
    vec3.set(newScale[0], newScale[1], newScale[2], self.scale);
    self.matrixNeedsUpdate = true;
    updateMatrix();
    publish('onTransformChanged');
  }

  function setRotation(newRotation: ArrayLike<number>) {
    vec3.set(newRotation[0], newRotation[1], newRotation[2], self.rotation);
    self.matrixNeedsUpdate = true;
    updateMatrix();
    publish('onTransformChanged');
  }

  function setQuaternion(newQuaternion: ArrayLike<number>) {
    quat.set(newQuaternion[0], newQuaternion[1], newQuaternion[2], newQuaternion[3], self.quaternion);
    self.matrixNeedsUpdate = true;
    updateMatrix();
    publish('onTransformChanged');
  }

  function setVisible(isVisible: boolean) {
    self.visible = isVisible;
    publish('onVisibilityChanged');
  }

  function add(childrenToAdd: Entity | Entity[]) {
    if (Array.isArray(childrenToAdd)) {
      childrenToAdd.forEach((child) => {
        children.push(child);
        child.parent = self;
      });
    } else {
      children.push(childrenToAdd);
      childrenToAdd.parent = self;
    }

    publish('onHierarchyChanged');
  }

  function remove(childToRemove: Entity) {
    const index = children.findIndex((child) => child.id === childToRemove.id);

    if (index !== -1) {
      children.splice(index, 1);
      publish('onHierarchyChanged');
      childToRemove.parent = null;
      childToRemove.destroy();
    }
  }

  function destroy() {
    publish('onDestroy');
  }

  function updateMatrix() {
    if (!self.matrixNeedsUpdate) {
      return;
    }

    // Order: Rotation, Scale, Translation
    quat.fromEuler(self.rotation[0], self.rotation[1], self.rotation[2], 'xyz', self.quaternion);
    mat4.fromQuat(self.quaternion, self.matrix);
    mat4.scale(self.matrix, self.scale, self.matrix);
    mat4.setTranslation(self.matrix, self.position, self.matrix);

    if (self.parent) {
      mat4.multiply(self.parent.matrixWorld, self.matrix, self.matrixWorld);
    } else {
      mat4.copy(self.matrix, self.matrixWorld);
    }

    children.forEach((child) => {
      child.matrixNeedsUpdate = true;
      child.updateMatrix();
    });

    self.matrixNeedsUpdate = false;

    publish('onMatrixUpdated');
  }

  const self: Entity = {
    id: crypto.randomUUID(),
    name: options.name ?? '',
    type: options.type,
    isLight: false,
    children,
    parent: null,
    position: vec3.create(...Array.from(options.position ?? [0, 0, 0])),
    scale: vec3.create(...Array.from(options.scale ?? [1, 1, 1])),
    rotation: vec3.create(...Array.from(options.rotation ?? [0, 0, 0])),
    visible: options.visible ?? true,
    quaternion: quat.create(...Array.from(options.quaternion ?? [0, 0, 0, 1])),
    matrix: mat4.create(),
    matrixWorld: mat4.create(),
    matrixNeedsUpdate: true,
    add,
    remove,
    setPosition,
    setScale,
    setRotation,
    setQuaternion,
    setVisible,
    updateMatrix,
    destroy,
  };

  // Ensure matrices are valid for first render.
  updateMatrix();

  return { entity: self as T, subscribe };
};

export { EntityFactory };
