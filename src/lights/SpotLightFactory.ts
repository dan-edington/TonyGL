import { LightFlag } from './LightManagerFactory';
import { DirectionalLightOptions, DirectionalLightFactory } from './DirectionalLightFactory';
import type { EntityFactoryFunction } from '../core/core.types';
import type { SpotLight } from './lights.types';

export type SpotLightOptions = DirectionalLightOptions & {
  angle?: number;
  penumbra?: number;
};

function SpotLightFactory(entityFactory: EntityFactoryFunction) {
  const createDirectionalLight = DirectionalLightFactory(entityFactory);

  return function createSpotLight(options: SpotLightOptions = {}): SpotLight {
    const spotLight = createDirectionalLight(options) as SpotLight;

    spotLight.type = 'SpotLight';
    spotLight.flags = (spotLight.flags | LightFlag.SpotLight) & ~LightFlag.DirectionalLight;
    spotLight.angle = options.angle ?? Math.PI / 5;
    spotLight.penumbra = options.penumbra ?? 0.2;

    spotLight.setAngle = (value: number) => {
      spotLight.angle = value;
    };

    spotLight.setPenumbra = (value: number) => {
      spotLight.penumbra = Math.max(0, Math.min(1, value));
    };

    return spotLight;
  };
}

export { SpotLightFactory };
