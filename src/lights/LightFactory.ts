import { LightFlag } from './LightManagerFactory';
import type { CreateLightBaseFunction, Light, LightFactoryFunction, LightOptions } from './lights.types';
import type { EntityFactoryFunction } from '../core/core.types';

function LightFactory(entityFactory: EntityFactoryFunction): LightFactoryFunction {
  const createLightBase: CreateLightBaseFunction = <T extends Light = Light>(
    type: string,
    options: LightOptions = {},
    flags: LightFlag = LightFlag.None,
  ): T => {
    const { entity: self } = entityFactory<T>({
      ...options,
      type,
    });

    self.isLight = true;
    self.flags = flags;
    self.color = new Float32Array(options.color ?? [1, 1, 1, 1]);
    self.intensity = options.intensity ?? 1;
    self.range = options.range ?? 10;

    self.setColor = (value: ArrayLike<number>) => {
      self.color.set(value);
    };

    self.setIntensity = (value: number) => {
      self.intensity = value;
    };

    self.setRange = (value: number) => {
      self.range = value;
    };

    return self;
  };

  const createLight = (options: LightOptions = {}): Light => {
    return createLightBase('Light', options);
  };

  createLight.createLightBase = createLightBase;

  return createLight;
}

export { LightFactory };
