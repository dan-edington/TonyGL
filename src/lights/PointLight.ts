import { LightFactory } from './LightFactory';
import { LightFlag } from './LightManagerFactory';
import type { LightOptions, PointLight } from './lights.types';
import { TonyModuleContext } from '../TonyGL.types';

export type PointLightOptions = LightOptions;

function PointLight(context: TonyModuleContext) {
  const { entityFactory } = context;

  const createLight = LightFactory(entityFactory);

  function createPointLight(options: PointLightOptions = {}): PointLight {
    return createLight.createLightBase<PointLight>('PointLight', options, LightFlag.PointLight);
  }

  return {
    createPointLight,
  };
}

export { PointLight };
