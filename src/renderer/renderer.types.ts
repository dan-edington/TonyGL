import { Scene } from '../sceneObjects/sceneObjects.types';
import { ShaderLibrary } from './ShaderLibraryFactory';
import { TextureLibrary } from './TextureLibraryFactory';

export type TextureAndView = {
  texture: GPUTexture;
  view: GPUTextureView;
};

export type WebGPUBase = {
  containerElement: HTMLElement;
  canvasElement: HTMLCanvasElement;
  context: GPUCanvasContext;
  device: GPUDevice;
  adapter: GPUAdapter;
  presentationFormat: GPUTextureFormat;
};

export type Renderer = WebGPUBase & {
  multiSampleTexture: TextureAndView;
  depthTexture: TextureAndView;
  msaa: number;
  alpha: boolean;
  dpr: number;
  bindGroupLayouts: {
    cameraBindGroupLayout: GPUBindGroupLayout;
    sceneBindGroupLayout: GPUBindGroupLayout;
    entityBindGroupLayout: GPUBindGroupLayout;
    materialBindGroupLayouts: Map<string, GPUBindGroupLayout>;
  };
  pipelineManager: PipelineManager;
  passManager: PassManager;
  passOrder: string[];
  samplerLibrary: SamplerLibrary;
  textureLibrary: TextureLibrary;
  shaderLibrary: ShaderLibrary;
  timers: {
    currentTime: number;
    currentFrame: number;
    elapsedTime: number;
    deltaTime: number;
  };
};

export type SamplerConfig = {
  magFilter?: GPUFilterMode;
  minFilter?: GPUFilterMode;
  mipmapFilter?: GPUMipmapFilterMode;
  addressModeU?: GPUAddressMode;
  addressModeV?: GPUAddressMode;
  compare?: GPUCompareFunction;
};

export type SamplerLibrary = {
  createSampler(key: string, config: SamplerConfig): GPUSampler;
  getSampler(key: string): GPUSampler | undefined;
};

export type CreateRenderPipelineOptions = {
  label?: string;
  shaderModule: GPUShaderModule;
  shaderEntryPoints?: {
    vertex: string;
    fragment: string;
  };
  bindGroupLayouts: GPUBindGroupLayout[];
  vertexBuffers: GPUVertexBufferLayout[];
  topology?: GPUPrimitiveTopology;
  cullMode?: GPUCullMode;
  format?: GPUTextureFormat;
  blendState?: GPUBlendState;
  depthStencilState?: GPUDepthStencilState;
  msaa?: number;
};

export type PipelineManager = {
  getOrCreateRenderPipeline(options: CreateRenderPipelineOptions): GPURenderPipeline;
  clearPipelineCache(): void;
};

export type RenderTarget = {
  texture: GPUTexture;
  view: GPUTextureView;
  width: number;
  height: number;
  format: GPUTextureFormat;
};

export type PassRoute = {
  input: string | null;
  output: string | null;
  renderToSwapchain: boolean;
};

export type PassContext = {
  route: PassRoute;
  getRenderTarget: (name: string) => RenderTarget | null;
  getSwapChainView: () => GPUTextureView;
  validateRenderTarget: (name: string, width: number, height: number, format: GPUTextureFormat) => RenderTarget;
  width: number;
  height: number;
};

export type Pass = {
  name: string;
  route: PassRoute;
  runPass(commandEncoder: GPUCommandEncoder, scene: Scene, camera: unknown, passContext: PassContext): void;
};

export type PassOptions = {
  name: string;
  renderer: Renderer;
  passRoute?: Partial<PassRoute>;
};

export type PassFactory = (options: PassOptions) => Pass;

export type PassManager = {
  scene: Scene | null;
  camera: unknown | null;
  registerPass(name: string, passFactory: PassFactory, passRoute?: Partial<PassRoute>): void;
  runPass(name: string, commandEncoder: GPUCommandEncoder): void;
  runPasses(passOrder: string[], commandEncoder: GPUCommandEncoder): void;
  createRenderTarget(name: string, width: number, height: number, format: GPUTextureFormat): void;
  getRenderTarget(name: string): RenderTarget | null;
  validateRenderTarget(name: string, width: number, height: number, format: GPUTextureFormat): RenderTarget;
  resizeRenderTargets(width: number, height: number): void;
  destroyRenderTargets(): void;
};

export type CreateTextureFunction = (
  device: GPUDevice,
  canvasElement: HTMLCanvasElement,
  msaa: number,
) => TextureAndView;
