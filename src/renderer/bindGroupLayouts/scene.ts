const sceneBindGroupLayoutDescriptor: GPUBindGroupLayoutDescriptor = {
  label: 'Scene Bind Group Layout',
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
      buffer: { type: 'uniform' },
    },
    {
      binding: 1,
      visibility: GPUShaderStage.FRAGMENT,
      buffer: { type: 'read-only-storage' },
    },
  ],
};

export { sceneBindGroupLayoutDescriptor };
