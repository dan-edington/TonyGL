import { LightFlag } from './LightManagerFactory';
import { LightFactory } from './LightFactory';
import { DirectionalLightOptions } from './DirectionalLight';
import type { SpotLight as SpotLightType } from './lights.types';
import { TonyModuleContext } from '../TonyGL.types';

export type SpotLightOptions = DirectionalLightOptions & {
  angle?: number;
  penumbra?: number;
};

function SpotLight(context: TonyModuleContext) {
  const { entityFactory } = context;

  const createLight = LightFactory(entityFactory);

  function createSpotLight(options: SpotLightOptions = {}): SpotLightType {
    const self = createLight.createLightBase<SpotLightType>('SpotLight', options, LightFlag.SpotLight);
    self.direction = new Float32Array(options.direction ?? [0, 1, 0]);
    self.setDirection = (value: ArrayLike<number>) => {
      self.direction.set(value);
    };
    self.angle = options.angle ?? Math.PI / 5;
    self.penumbra = options.penumbra ?? 0.2;
    self.setAngle = (value: number) => {
      self.angle = value;
    };
    self.setPenumbra = (value: number) => {
      self.penumbra = Math.max(0, Math.min(1, value));
    };

    return self;
  }

  return {
    createSpotLight,
  };
}

export { SpotLight };
