struct CameraUniforms {
  viewProjectionMatrix: mat4x4<f32>,
  worldPosition: vec3f,
};

@group(0) @binding(0) var<uniform> cameraUniforms: CameraUniforms;