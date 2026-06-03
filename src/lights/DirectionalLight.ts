import { LightFlag } from './LightManagerFactory';
import { LightFactory } from './LightFactory';
import type { DirectionalLight, LightOptions } from './lights.types';
import { TonyModuleContext } from '../TonyGL.types';

export type DirectionalLightOptions = LightOptions & {
  direction?: ArrayLike<number>;
};

function DirectionalLight(context: TonyModuleContext) {
  const { entityFactory } = context;

  const createLight = LightFactory(entityFactory);

  function createDirectionalLight(options: DirectionalLightOptions = {}): DirectionalLight {
    const self = createLight.createLightBase<DirectionalLight>('DirectionalLight', options, LightFlag.DirectionalLight);

    self.direction = new Float32Array(options.direction ?? [0, 1, 0]);
    self.setDirection = (value: ArrayLike<number>) => {
      self.direction.set(value);
    };

    return self;
  }

  return {
    createDirectionalLight,
  };
}

export { DirectionalLight };
