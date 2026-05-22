import type { EntityFactoryFunction, EntityOptions } from '../core/core.types';
import type { Group } from './sceneObjects.types';

export type GroupOptions = Omit<EntityOptions, 'type'>;

function GroupFactory(entityFactory: EntityFactoryFunction) {
  return function createGroup(options: GroupOptions = {}): Group {
    const { entity } = entityFactory<Group>({ ...options, type: 'Group' });
    return entity;
  };
}

export { GroupFactory };
