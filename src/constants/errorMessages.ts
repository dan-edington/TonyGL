const errorMessages = {
  contextRequest: 'Failed to request a WebGPU context. Ensure WebGPU is supported and enabled in this browser.',
  adapterRequest: 'Failed to request a GPU adapter. Ensure WebGPU is supported and enabled on this device.',
  deviceRequest: 'Failed to request a GPU device. Ensure WebGPU is supported and enabled on this device.',
  presentationFormatRequest:
    'Failed to get the preferred canvas format. Ensure WebGPU is supported and enabled in this browser.',
  missingSceneUniformsBuffer: 'Scene uniforms buffer is missing. Ensure the scene is initialized before rendering.',
  missingLightUniformsBuffer: 'Light uniforms buffer is missing. Ensure the scene is initialized before rendering.',
  missingPass: 'Requested pass is missing. Ensure the pass is registered with the pass manager before rendering.',
  missingPassScene: 'Pass manager scene is missing. Ensure a scene is set before running a pass.',
  missingPassCamera: 'Pass manager camera is missing. Ensure a camera is set before running a pass.',
  missingTextureLibraryFallbacks:
    'Fallback textures are missing. Ensure the texture library initializes fallback textures before requesting fallback textures.',
  missingSamplerLibraryDevice:
    'Sampler library device is missing. Ensure the renderer is initialized before creating samplers.',
  missingShaderCode:
    'Could not find shader code for material. Ensure the shader name is correct and the shader is included in the shader library.',
};

export { errorMessages };
