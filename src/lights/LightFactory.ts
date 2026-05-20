import { LightFlag } from './LightManagerFactory';
import { Entity, EntityFactoryFunction, EntityOptions } from '../core/EntityFactory';

export type LightOptions = Omit<EntityOptions, 'type'> & {
  color?: ArrayLike<number>;
  intensity?: number;
  range?: number;
};

export type Light = Entity & {
  isLight: boolean;
  flags: LightFlag;
  color: Float32Array;
  intensity: number;
  range: number;
  setColor(value: ArrayLike<number>): void;
  setIntensity(value: number): void;
  setRange(value: number): void;
};

export type CreateLightBaseFunction = (type: string, options?: LightOptions, flags?: LightFlag) => Light;

export type LightFactoryFunction = ((options?: LightOptions) => Light) & {
  createLightBase: CreateLightBaseFunction;
};

function LightFactory(entityFactory: EntityFactoryFunction): LightFactoryFunction {
  const createLightBase: CreateLightBaseFunction = (
    type: string,
    options: LightOptions = {},
    flags: LightFlag = LightFlag.None,
  ) => {
    const { entity } = entityFactory({
      ...options,
      type,
    });

    const light = entity as Light;

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

  const createLight = ((options: LightOptions = {}) => {
    return createLightBase('Light', options);
  }) as LightFactoryFunction;

  createLight.createLightBase = createLightBase;

  return createLight;
}

export { LightFactory };
