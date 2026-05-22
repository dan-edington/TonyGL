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
    const directionalLight = createLight.createLightBase<DirectionalLight>(
      'DirectionalLight',
      options,
      LightFlag.DirectionalLight,
    );

    directionalLight.direction = new Float32Array(options.direction ?? [0, 1, 0]);
    directionalLight.setDirection = (value: ArrayLike<number>) => {
      directionalLight.direction.set(value);
    };

    return directionalLight;
  };
}

export { DirectionalLightFactory };
