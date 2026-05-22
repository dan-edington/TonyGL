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
    const directionalLight = createDirectionalLight(options);
    const spotLight: SpotLight = Object.assign(directionalLight, {
      angle: options.angle ?? Math.PI / 5,
      penumbra: options.penumbra ?? 0.2,
      setAngle(value: number) {
        spotLight.angle = value;
      },
      setPenumbra(value: number) {
        spotLight.penumbra = Math.max(0, Math.min(1, value));
      },
    });

    spotLight.type = 'SpotLight';
    spotLight.flags = (spotLight.flags | LightFlag.SpotLight) & ~LightFlag.DirectionalLight;

    return spotLight;
  };
}

export { SpotLightFactory };
