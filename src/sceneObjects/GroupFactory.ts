import { Entity, EntityFactoryFunction, EntityOptions } from '../core/EntityFactory';

export type Group = Entity;
export type GroupOptions = Omit<EntityOptions, 'type'>;

function GroupFactory(entityFactory: EntityFactoryFunction) {
  return function createGroup(options: GroupOptions = {}): Group {
    const { entity } = entityFactory({ ...options, type: 'Group' });
    return entity;
  };
}

export { GroupFactory };
