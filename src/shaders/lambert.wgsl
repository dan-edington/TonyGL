// #include "./includes/misc/constants"

// #include "./includes/material/materialStruct"
// #include  "/includes/vertex/vertexOutputStruct"

// #include "./includes/uniforms/cameraUniforms"
// #include "./includes/uniforms/sceneUniforms"
// #include "./includes/uniforms/lightUniforms"
// #include "./includes/uniforms/entityUniforms"

// #include "./includes/BRDF/lambertBRDF"

// #include "./includes/lighting/lightingFunctions"

struct MaterialUniforms {
  materialFlag: u32,
  color: vec4f,
  textureRepeatAlbedo: vec2f,
  textureRepeatAlpha: vec2f,
  textureRepeatNormal: vec2f,
};

@group(2) @binding(0) var<uniform> materialUniforms: MaterialUniforms;
@group(2) @binding(1) var alphaTexture: texture_2d<f32>;
@group(2) @binding(2) var normalTexture: texture_2d<f32>;
@group(2) @binding(3) var albedoTexture: texture_2d<f32>;
@group(2) @binding(4) var materialSampler: sampler;

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
  // #include "./includes/material/fragmentColorAndAlpha"
  // #include "./includes/material/normals"

  let material = Material(
    MATERIAL_LAMBERT,
    albedoColor,
    0,
    vec3f(1.0),
    0
  );

  let V = normalize(cameraUniforms.worldPosition - in.worldPosition);

  let finalColor = calculateLighting(material, in.worldPosition, N, V);

  return vec4f(finalColor, fragmentAlpha);;
}