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
    const self = createDirectionalLight(options) as SpotLight;
    self.angle = options.angle ?? Math.PI / 5;
    self.penumbra = options.penumbra ?? 0.2;
    self.setAngle = (value: number) => {
      self.angle = value;
    };
    self.setPenumbra = (value: number) => {
      self.penumbra = Math.max(0, Math.min(1, value));
    };

    self.type = 'SpotLight';
    self.flags = (self.flags | LightFlag.SpotLight) & ~LightFlag.DirectionalLight;

    return self;
  };
}

export { SpotLightFactory };
