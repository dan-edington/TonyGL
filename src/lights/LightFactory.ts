import { LightFlag } from './LightManagerFactory';
import type { CreateLightBaseFunction, Light, LightFactoryFunction, LightOptions } from './lights.types';
import type { EntityFactoryFunction } from '../core/core.types';

function LightFactory(entityFactory: EntityFactoryFunction): LightFactoryFunction {
  const createLightBase: CreateLightBaseFunction = <T extends Light = Light>(
    type: string,
    options: LightOptions = {},
    flags: LightFlag = LightFlag.None,
  ): T => {
    const { entity: light } = entityFactory<T>({
      ...options,
      type,
    });

    light.isLight = true;
    light.flags = flags;
    light.color = new Float32Array(options.color ?? [1, 1, 1, 1]);
    light.intensity = options.intensity ?? 1;
    light.range = options.range ?? 10;

    light.setColor = (value: ArrayLike<number>) => {
      light.color.set(value);
    };

    light.setIntensity = (value: number) => {
      light.intensity = value;
    };

    light.setRange = (value: number) => {
      light.range = value;
    };

    return light;
  };

  const createLight = (options: LightOptions = {}): Light => {
    return createLightBase('Light', options);
  };

  return Object.assign(createLight, {
    createLightBase,
  });
}

export { LightFactory };
