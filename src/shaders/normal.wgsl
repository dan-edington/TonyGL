// #include "./includes/misc/constants"

// #include "./includes/material/materialStruct"
// #include  "/includes/vertex/vertexOutputStruct"

// #include "./includes/uniforms/cameraUniforms"
// #include "./includes/uniforms/sceneUniforms"
// #include "./includes/uniforms/lightUniforms"
// #include "./includes/uniforms/entityUniforms"

struct MaterialUniforms {
  materialFlag: u32,
  textureRepeatNormal: vec2f,
};

@group(2) @binding(0) var<uniform> materialUniforms: MaterialUniforms;
@group(2) @binding(1) var normalTexture: texture_2d<f32>;
@group(2) @binding(2) var materialSampler: sampler;

@vertex
fn vertex_shader(
  @location(0) pos: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uvs: vec2<f32>,
  @location(3) tangent: vec4<f32>,
) -> VertexOutput {

  // #include "/includes/vertex/vertexOutput"

  return out;
}

@fragment
fn fragment_shader(
  in: VertexOutput
) -> @location(0) vec4f {

  // #include "./includes/material/materialFlags"
  // #include "./includes/material/normals"

  return vec4f(N * 0.5 + 0.5, 1.0);
}