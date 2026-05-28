struct LightUniforms {
  count: u32,
  positions: array<vec4f, 16>,
  colors: array<vec4f, 16>,
  directions: array<vec4f, 16>,
  spotlightAngles: array<vec2f, 16>,
  params: array<vec4f, 16>,
  lightFlags: array<u32, 16>,
  ambientLightColor: vec4f,
  ambientLightIntensity: f32,
}

@group(1) @binding(1) var<storage, read> lightUniforms: LightUniforms;