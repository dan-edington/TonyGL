import { constants } from '../constants/constants';
import { colorToLinear, srgbToLinear } from '../utilities/colorUtilities';
import type { DirectionalLightLike, Light, LightManager, SpotLightLike } from './lights.types';
import type { CreateUniformBufferFunction, Entity, UniformBuffer } from '../core/core.types';
import type { Renderer } from '../renderer/renderer.types';

export const enum LightFlag {
  None = 0,
  Visible = 1 << 0,
  PointLight = 1 << 1,
  DirectionalLight = 1 << 2,
  SpotLight = 1 << 3,
}

function LightManagerFactory(renderer: Renderer, createUniformBuffer: CreateUniformBufferFunction): LightManager {
  let lightsNeedUpdate = true;
  let lights: Light[] = [];
  const ambientLight = {
    color: new Float32Array([1, 1, 1, 1]),
    intensity: 0.0,
  };
  const { count, maxLights, positions, colors, params, directions, spotlightAngles, flags } = gatherLightingData();
  let lightUniformsBuffer: UniformBuffer | null = createUniformBuffer(
    {
      count: { type: 'u32', value: count },
      positions: { type: `array<vec4<f32>, ${maxLights}>`, value: positions },
      colors: { type: `array<vec4<f32>, ${maxLights}>`, value: colors },
      directions: { type: `array<vec4<f32>, ${maxLights}>`, value: directions },
      spotlightAngles: { type: `array<vec2<f32>, ${maxLights}>`, value: spotlightAngles },
      params: { type: `array<vec4<f32>, ${maxLights}>`, value: params },
      flags: { type: `array<u32, ${maxLights}>`, value: flags },
      ambientLightColor: { type: 'vec4<f32>', value: colorToLinear(ambientLight.color) },
      ambientLightIntensity: { type: 'f32', value: ambientLight.intensity },
    },
    { addressSpace: 'storage' },
  );
  let sceneUniformsBindGroup: GPUBindGroup | null = null;

  function isDirectionalLight(light: Light): light is DirectionalLightLike {
    return (light.flags & LightFlag.DirectionalLight) !== 0 && light.type === 'DirectionalLight';
  }

  function isSpotLight(light: Light): light is SpotLightLike {
    return (light.flags & LightFlag.SpotLight) !== 0 && light.type === 'SpotLight';
  }

  function gatherLightingData() {
    const maxLights = constants.MAX_LIGHTS;
    const positions = new Float32Array(maxLights * 4);
    const colors = new Float32Array(maxLights * 4);
    const params = new Float32Array(maxLights * 4);
    const directions = new Float32Array(maxLights * 4);
    const spotlightAngles = new Float32Array(maxLights * 2);
    const flags = new Uint32Array(maxLights);

    const activeLights = lights.slice(0, maxLights);

    activeLights.forEach((light, index) => {
      const base = index * 4;

      positions[base + 0] = light.position[0];
      positions[base + 1] = light.position[1];
      positions[base + 2] = light.position[2];
      positions[base + 3] = 1;

      colors[base + 0] = srgbToLinear(light.color[0]);
      colors[base + 1] = srgbToLinear(light.color[1]);
      colors[base + 2] = srgbToLinear(light.color[2]);
      colors[base + 3] = light.color[3];

      params[base + 0] = light.intensity;
      params[base + 1] = light.range;
      params[base + 2] = 0;
      params[base + 3] = 0;

      if (isDirectionalLight(light) || isSpotLight(light)) {
        const base = index * 3;
        directions[base + 0] = light.direction[0] ?? 0;
        directions[base + 1] = light.direction[1] ?? 0;
        directions[base + 2] = light.direction[2] ?? 0;
      }

      if (isSpotLight(light)) {
        const base = index * 2;
        spotlightAngles[base + 0] = light.angle;
        spotlightAngles[base + 1] = light.penumbra;
      }

      flags[index] = (light.visible ? LightFlag.Visible : LightFlag.None) | light.flags;
    });

    return { count: activeLights.length, maxLights, positions, colors, params, directions, spotlightAngles, flags };
  }

  function rebuildLightsArray(rootEntity: Entity) {
    lights = [];

    const traverse = (entity: Entity) => {
      if (entity.isLight) {
        lights.push(entity as unknown as Light);
      }

      entity.children.forEach((child) => {
        traverse(child);
      });
    };

    rootEntity.children.forEach((child) => {
      traverse(child);
    });
  }

  function updateLightUniforms() {
    if (!lightUniformsBuffer) return;

    const { count, positions, colors, params, directions, spotlightAngles, flags } = gatherLightingData();

    lightUniformsBuffer.updateUniform({
      count,
      positions,
      colors,
      params,
      directions,
      spotlightAngles,
      flags,
    });
  }

  function updateLights(rootEntity: Entity) {
    if (lightsNeedUpdate) {
      rebuildLightsArray(rootEntity);
    }

    updateLightUniforms();

    lightsNeedUpdate = false;
  }

  function createSceneUniformsBindGroup() {
    if (!lightUniformsBuffer?.buffer) return;

    sceneUniformsBindGroup = renderer.device.createBindGroup({
      layout: renderer.bindGroupLayouts.sceneBindGroupLayout,
      entries: [
        {
          binding: 1,
          resource: { buffer: lightUniformsBuffer.buffer },
        },
      ],
    });
  }

  function setAmbientLightColor(color: Float32Array | [number, number, number, number]) {
    ambientLight.color = new Float32Array([color[0], color[1], color[2], color[3]]);

    lightUniformsBuffer?.updateUniform({
      ambientLightColor: colorToLinear(ambientLight.color),
    });
  }

  function setAmbientLightIntensity(intensity: number) {
    ambientLight.intensity = intensity;

    lightUniformsBuffer?.updateUniform({
      ambientLightIntensity: ambientLight.intensity,
    });
  }

  function setAmbientLight(ambientLight: {
    color: Float32Array | [number, number, number, number];
    intensity: number;
  }) {
    setAmbientLightColor(ambientLight.color);
    setAmbientLightIntensity(ambientLight.intensity);
  }

  function destroy() {
    lightUniformsBuffer?.destroy();
    lightUniformsBuffer = null;
    sceneUniformsBindGroup = null;
  }

  const lightManager = {
    get lightUniformsBuffer() {
      return lightUniformsBuffer;
    },
    set lightUniformsBuffer(value: UniformBuffer | null) {
      lightUniformsBuffer = value;
    },
    ambientLight,
    get lights() {
      return lights;
    },
    set lights(value: Light[]) {
      lights = value;
    },
    get lightsNeedUpdate() {
      return lightsNeedUpdate;
    },
    set lightsNeedUpdate(value: boolean) {
      lightsNeedUpdate = value;
    },
    get sceneUniformsBindGroup() {
      return sceneUniformsBindGroup;
    },
    set sceneUniformsBindGroup(value: GPUBindGroup | null) {
      sceneUniformsBindGroup = value;
    },
    setAmbientLightColor,
    setAmbientLightIntensity,
    setAmbientLight,
    updateLights,
    createSceneUniformsBindGroup,
    destroy,
  };

  return lightManager;
}

export { LightManagerFactory };
