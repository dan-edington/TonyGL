import { LightFlag } from './LightManagerFactory';
import { EntityFactoryFunction } from '../core/EntityFactory';
import { Light, LightFactory, LightOptions } from './LightFactory';

export type PointLight = Light;

export type PointLightOptions = LightOptions;

function PointLightFactory(entityFactory: EntityFactoryFunction) {
  const createLight = LightFactory(entityFactory);

  return function createPointLight(options: PointLightOptions = {}): PointLight {
    return createLight.createLightBase('PointLight', options, LightFlag.PointLight) as PointLight;
  };
}

export { PointLightFactory };
