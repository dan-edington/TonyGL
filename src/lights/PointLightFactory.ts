import { LightFactory } from './LightFactory';
import { LightFlag } from './LightManagerFactory';
import type { EntityFactoryFunction } from '../core/core.types';
import type { LightOptions, PointLight } from './lights.types';

export type PointLightOptions = LightOptions;

function PointLightFactory(entityFactory: EntityFactoryFunction) {
  const createLight = LightFactory(entityFactory);

  return function createPointLight(options: PointLightOptions = {}): PointLight {
    return createLight.createLightBase('PointLight', options, LightFlag.PointLight) as PointLight;
  };
}

export { PointLightFactory };
