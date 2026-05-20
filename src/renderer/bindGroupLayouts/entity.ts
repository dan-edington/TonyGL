const entityBindGroupLayoutDescriptor: GPUBindGroupLayoutDescriptor = {
  label: 'Entity Bind Group Layout',
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
      buffer: { type: 'uniform' },
    },
  ],
};

export { entityBindGroupLayoutDescriptor };
