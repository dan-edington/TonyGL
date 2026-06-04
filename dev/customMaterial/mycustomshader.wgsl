struct CustomMaterialUniforms {
  color: vec4f,
  time: f32,
};

@group(2) @binding(0) var<uniform> customUniforms: CustomMaterialUniforms;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) normal: vec3f,
  @location(2) uvs: vec2f
};

@vertex
fn vertex_shader(
  @builtin(instance_index) instanceIndex: u32,
  @location(0) pos: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uvs: vec2<f32>,
  @location(3) tangent: vec4<f32>,
) -> VertexOutput {

  var out: VertexOutput;

  out.position = cameraUniforms.viewProjectionMatrix * entityUniforms[instanceIndex].modelMatrix * vec4f(pos, 1.0);
  out.worldPosition = (entityUniforms[instanceIndex].modelMatrix * vec4f(pos, 1.0)).xyz;
  out.normal = normalize((entityUniforms[instanceIndex].modelMatrix * vec4f(normal, 0.0)).xyz);
  out.uvs = uvs;

  return out;
}

@fragment
fn fragment_shader(
  in: VertexOutput
) -> @location(0) vec4f {

  return vec4f(in.uvs, 0.5 + 0.5 * sin(customUniforms.time), 1) * customUniforms.color;
}