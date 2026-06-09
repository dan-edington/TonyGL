struct CustomMaterialUniforms {
  color: vec4f
};

@group(2) @binding(0) var<storage, read> particlePositions: array<vec3f>;
@group(2) @binding(1) var<uniform> customUniforms: CustomMaterialUniforms;

struct VertexOutput {
  @builtin(position) position: vec4f
};

@vertex
fn vertex_shader(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VertexOutput {

  var out: VertexOutput;

  let particlePos = particlePositions[vertexIndex];
  out.position = cameraUniforms.viewProjectionMatrix * entityUniforms[instanceIndex].modelMatrix * vec4f(particlePos, 1.0);

  return out;
}

@fragment
fn fragment_shader(
  in: VertexOutput
) -> @location(0) vec4f {

  return customUniforms.color;
}