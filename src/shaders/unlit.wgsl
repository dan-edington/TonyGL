// #include "./includes/uniforms/cameraUniforms"
// #include "./includes/uniforms/sceneUniforms"
// #include "./includes/uniforms/lightUniforms"
// #include "./includes/uniforms/entityUniforms"

struct MaterialUniforms {
  materialFlag: u32,
  color: vec4f,
  textureRepeatAlbedo: vec2f,
  textureRepeatAlpha: vec2f,
};

@group(2) @binding(0) var<uniform> materialUniforms: MaterialUniforms;
@group(2) @binding(1) var alphaTexture: texture_2d<f32>;
@group(2) @binding(2) var albedoTexture: texture_2d<f32>;
@group(2) @binding(3) var materialSampler: sampler;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uvs: vec2f,
};

@vertex
fn vertex_shader(
  @location(0) pos: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uvs: vec2<f32>,
) -> VertexOutput {

  var out: VertexOutput;

  out.position = cameraUniforms.viewProjectionMatrix * entityUniforms.modelMatrix * vec4f(pos, 1.0);
  out.uvs = uvs;

  return out;
}

@fragment
fn fragment_shader(
  in: VertexOutput
) -> @location(0) vec4f {

  // #include "./includes/material/materialFlags"
  // #include "./includes/material/fragmentColorAndAlpha"

  var finalColor = vec4f(albedoColor, fragmentAlpha);

  return finalColor;
}