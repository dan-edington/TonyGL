import { mat4, quat, vec3 } from 'wgpu-matrix';
import { uuid } from '../types';

export type EntityWithSubscription = {
  entity: Entity;
  subscribe: (subscriptionEvent: EntitySubscriptionEvent, subscriptionCallback: EntitySubscriptionCallback) => void;
};

export type EntityFactoryFunction = (options: EntityOptions) => EntityWithSubscription;

export type EntitySubscriptionEvent =
  | 'onTransformChanged'
  | 'onVisibilityChanged'
  | 'onHierarchyChanged'
  | 'onMatrixUpdated'
  | 'onDestroy';

export type EntitySubscriptionCallback = () => void;

export type EntityOptions = {
  type: string;
  name?: string;
  position?: ArrayLike<number>;
  scale?: ArrayLike<number>;
  rotation?: ArrayLike<number>;
  quaternion?: ArrayLike<number>;
  visible?: boolean;
};

export type Entity = {
  id: uuid;
  type: string;
  name: string;
  isLight: boolean;
  children: Entity[];
  parent: Entity | null;
  position: Float32Array;
  scale: Float32Array;
  rotation: Float32Array;
  quaternion: Float32Array;
  matrix: Float32Array;
  matrixWorld: Float32Array;
  visible: boolean;
  matrixNeedsUpdate: boolean;
  setPosition(newPosition: ArrayLike<number>): void;
  setScale(newScale: ArrayLike<number>): void;
  setRotation(newRotation: ArrayLike<number>): void;
  setQuaternion(newQuaternion: ArrayLike<number>): void;
  setVisible(isVisible: boolean): void;
  add(childrenToAdd: Entity | Entity[]): void;
  remove(childToRemove: Entity): void;
  updateMatrix(): void;
  destroy(): void;
};

function EntityFactory(options: EntityOptions): EntityWithSubscription {
  const id: uuid = crypto.randomUUID();
  const type: string = options.type;
  const children: Entity[] = [];
  const parent: Entity | null = null;
  let name: string = options.name ?? '';
  let position: Float32Array = vec3.create(...Array.from(options.position ?? [0, 0, 0]));
  let scale: Float32Array = vec3.create(...Array.from(options.scale ?? [1, 1, 1]));
  let rotation: Float32Array = vec3.create(...Array.from(options.rotation ?? [0, 0, 0]));
  let quaternion: Float32Array = quat.create(...Array.from(options.quaternion ?? [0, 0, 0, 1]));
  let matrix: Float32Array = mat4.create();
  let matrixWorld: Float32Array = mat4.create();
  let visible: boolean = options.visible ?? true;
  let matrixNeedsUpdate: boolean = true;

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
    vec3.set(newPosition[0], newPosition[1], newPosition[2], position);
    matrixNeedsUpdate = true;
    self.matrixNeedsUpdate = true;
    updateMatrix();
    publish('onTransformChanged');
  }

  function setScale(newScale: ArrayLike<number>) {
    vec3.set(newScale[0], newScale[1], newScale[2], scale);
    matrixNeedsUpdate = true;
    self.matrixNeedsUpdate = true;
    updateMatrix();
    publish('onTransformChanged');
  }

  function setRotation(newRotation: ArrayLike<number>) {
    vec3.set(newRotation[0], newRotation[1], newRotation[2], rotation);
    matrixNeedsUpdate = true;
    self.matrixNeedsUpdate = true;
    updateMatrix();
    publish('onTransformChanged');
  }

  function setQuaternion(newQuaternion: ArrayLike<number>) {
    quat.set(newQuaternion[0], newQuaternion[1], newQuaternion[2], newQuaternion[3], quaternion);
    matrixNeedsUpdate = true;
    self.matrixNeedsUpdate = true;
    updateMatrix();
    publish('onTransformChanged');
  }

  function setVisible(isVisible: boolean) {
    visible = isVisible;
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
    if (!matrixNeedsUpdate) {
      return;
    }

    // Order: Rotation, Scale, Translation
    quat.fromEuler(rotation[0], rotation[1], rotation[2], 'xyz', quaternion);
    mat4.fromQuat(quaternion, matrix);
    mat4.scale(matrix, scale, matrix);
    mat4.setTranslation(matrix, position, matrix);

    if (self.parent) {
      mat4.multiply(self.parent.matrixWorld, matrix, matrixWorld);
    } else {
      mat4.copy(matrix, matrixWorld);
    }

    children.forEach((child) => {
      child.matrixNeedsUpdate = true;
      child.updateMatrix();
    });

    matrixNeedsUpdate = false;
    self.matrixNeedsUpdate = false;

    publish('onMatrixUpdated');
  }

  const self: Entity = {
    id,
    name,
    type,
    isLight: false,
    children,
    parent,
    position,
    scale,
    rotation,
    visible,
    quaternion,
    matrix,
    matrixWorld,
    matrixNeedsUpdate,
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

  return { entity: self, subscribe } as EntityWithSubscription;
}

export { EntityFactory };
