struct EntityUniforms {
  modelMatrix: mat4x4<f32>,
};

@group(3) @binding(0) var<uniform> entityUniforms: EntityUniforms;