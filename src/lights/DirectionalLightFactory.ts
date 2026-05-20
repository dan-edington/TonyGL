import { LightFlag } from './LightManagerFactory';
import { EntityFactoryFunction } from '../core/EntityFactory';
import { Light, LightFactory, LightOptions } from './LightFactory';

export type DirectionalLight = Light & {
  direction: Float32Array;
  setDirection(value: ArrayLike<number>): void;
};

export type DirectionalLightOptions = LightOptions & {
  direction?: ArrayLike<number>;
};

function DirectionalLightFactory(entityFactory: EntityFactoryFunction) {
  const createLight = LightFactory(entityFactory);

  return function createDirectionalLight(options: DirectionalLightOptions = {}): DirectionalLight {
    const directionalLight = createLight.createLightBase(
      'DirectionalLight',
      options,
      LightFlag.DirectionalLight,
    ) as DirectionalLight;

    directionalLight.direction = new Float32Array(options.direction ?? [0, 1, 0]);
    directionalLight.setDirection = (value: ArrayLike<number>) => {
      directionalLight.direction.set(value);
    };

    return directionalLight;
  };
}

export { DirectionalLightFactory };
