import type { EntityOptions } from '../core/core.types';
import { TonyModuleContext } from '../TonyGL.types';
import type { Group } from './sceneObjects.types';

export type GroupOptions = Omit<EntityOptions, 'type'>;

function Group(context: TonyModuleContext) {
  const { entityFactory } = context;

  function createGroup(options: GroupOptions = {}): Group {
    const { entity } = entityFactory<Group>({ ...options, type: 'Group' });
    return entity;
  }

  return {
    createGroup,
  };
}

export { Group };
