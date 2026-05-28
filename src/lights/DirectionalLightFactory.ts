import { LightFlag } from './LightManagerFactory';
import { LightFactory } from './LightFactory';
import type { DirectionalLight, LightOptions } from './lights.types';
import type { EntityFactoryFunction } from '../core/core.types';

export type DirectionalLightOptions = LightOptions & {
  direction?: ArrayLike<number>;
};

function DirectionalLightFactory(entityFactory: EntityFactoryFunction) {
  const createLight = LightFactory(entityFactory);

  return function createDirectionalLight(options: DirectionalLightOptions = {}): DirectionalLight {
    const self = createLight.createLightBase<DirectionalLight>('DirectionalLight', options, LightFlag.DirectionalLight);

    self.direction = new Float32Array(options.direction ?? [0, 1, 0]);
    self.setDirection = (value: ArrayLike<number>) => {
      self.direction.set(value);
    };

    return self;
  };
}

export { DirectionalLightFactory };
