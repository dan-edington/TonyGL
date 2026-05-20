// #include "./includes/colour/tonemapping"

@group(0) @binding(0) var sceneSampler: sampler;
@group(0) @binding(1) var sceneTexture: texture_2d<f32>;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) uvs: vec2f,
};

@vertex
fn vertex_shader(
  @location(0) pos: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uvs: vec2<f32>,
) -> VertexOutput {

  var out: VertexOutput;

  out.position = vec4f(pos, 1.0);
  out.normal = normal;
  out.uvs = uvs;

  return out;
}

@fragment
fn fragment_shader(
  in: VertexOutput
) -> @location(0) vec4f {

  var textureColor = textureSample(sceneTexture, sceneSampler, in.uvs);
  var toneMapped = acesToneMap(textureColor.rgb);
  var finalColor = vec4f(linearToSRGB(toneMapped), textureColor.a);
  
  return finalColor;
}