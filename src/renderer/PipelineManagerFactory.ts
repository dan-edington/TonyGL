import { constants } from '../constants/constants';
import { Renderer } from './configureRenderer';

type CreateRenderPipelineOptions = {
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

function PipelineManagerFactory(renderer: Renderer): PipelineManager {
  const pipelineCache = new Map<string, GPURenderPipeline>();
  const pipelineLayoutCache = new Map<string, GPUPipelineLayout>();

  function getOrCreateRenderPipeline(options: CreateRenderPipelineOptions) {
    const {
      label = `Pipeline_${crypto.randomUUID()}`,
      shaderModule,
      shaderEntryPoints = { vertex: 'vertex_shader', fragment: 'fragment_shader' },
      vertexBuffers,
      bindGroupLayouts,
      format = constants.INTERNAL_COLOR_FORMAT,
      topology = 'triangle-list',
      cullMode = 'back',
      blendState,
      depthStencilState,
      msaa = renderer.msaa,
    } = options;

    const pipelineCacheKey = generateRenderPipelineCacheKey(options);

    if (pipelineCache.has(pipelineCacheKey)) {
      return pipelineCache.get(pipelineCacheKey)!;
    }

    const pipelineLayout = bindGroupLayouts ? getOrCreatePipelineLayout(bindGroupLayouts) : 'auto';

    const pipelineDescriptor: GPURenderPipelineDescriptor = {
      label,
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: shaderEntryPoints.vertex,
        buffers: vertexBuffers,
      },
      fragment: {
        module: shaderModule,
        entryPoint: shaderEntryPoints.fragment,
        targets: [
          {
            format,
            blend: blendState,
          },
        ],
      },
      primitive: {
        topology,
        cullMode,
      },
      depthStencil: depthStencilState,
      multisample: {
        count: msaa,
      },
    };

    const renderPipeline = renderer.device.createRenderPipeline(pipelineDescriptor);

    pipelineCache.set(pipelineCacheKey, renderPipeline);

    return renderPipeline;
  }

  function generateRenderPipelineCacheKey(options: CreateRenderPipelineOptions): string {
    const {
      shaderModule,
      shaderEntryPoints = { vertex: 'vertex_shader', fragment: 'fragment_shader' },
      vertexBuffers,
      bindGroupLayouts,
      format = constants.INTERNAL_COLOR_FORMAT,
      topology = 'triangle-list',
      cullMode = 'back',
      blendState,
      depthStencilState,
      msaa,
    } = options;

    const vertexBufferKey = vertexBuffers
      .map((vertexBuffer) => {
        const attributeKey = Array.from(vertexBuffer.attributes)
          .map((attribute) => `${attribute.shaderLocation}:${attribute.format}:${attribute.offset}`)
          .join(',');

        return `${vertexBuffer.arrayStride}:${vertexBuffer.stepMode ?? 'vertex'}:${attributeKey}`;
      })
      .join('|');

    const bindGroupLayoutKey = createBindGroupLayoutCacheKey(bindGroupLayouts);
    const blendKey = blendState ? JSON.stringify(blendState) : 'no-blend';
    const depthStencilKey = depthStencilState ? JSON.stringify(depthStencilState) : 'no-depth';
    const shaderModuleKey = shaderModule.label ?? 'unlabelled-shader';

    return `${shaderModuleKey}|${shaderEntryPoints.vertex}|${shaderEntryPoints.fragment}|${vertexBufferKey}|${bindGroupLayoutKey}|${format}|${topology}|${cullMode}|${depthStencilKey}|${blendKey}|${msaa}`;
  }

  function getOrCreatePipelineLayout(bindGroupLayouts: GPUBindGroupLayout[]) {
    const cacheKey = createBindGroupLayoutCacheKey(bindGroupLayouts, true);

    if (pipelineLayoutCache.has(cacheKey)) {
      return pipelineLayoutCache.get(cacheKey)!;
    }

    const pipelineLayout = renderer.device.createPipelineLayout({ bindGroupLayouts });

    pipelineLayoutCache.set(cacheKey, pipelineLayout);

    return pipelineLayout;
  }

  function createBindGroupLayoutCacheKey(bindGroupLayouts: GPUBindGroupLayout[], warnOnMissingLabels = false): string {
    const missingLabelLayouts: string[] = [];

    const cacheKey = bindGroupLayouts
      .map((bindGroupLayout, index) => {
        if (!bindGroupLayout.label) {
          missingLabelLayouts.push(bindGroupLayout.toString());
        }

        return bindGroupLayout.label || `missing-label-${index}-${crypto.randomUUID()}`;
      })
      .join('|');

    if (warnOnMissingLabels && missingLabelLayouts.length > 0) {
      console.warn(
        `PipelineManager: The following bind group layouts are missing labels, which may lead to cache collisions. Please add labels to these bind group layouts for better caching performance.`,
        missingLabelLayouts,
      );
    }

    return cacheKey;
  }

  function clearPipelineCache() {
    pipelineCache.clear();
    pipelineLayoutCache.clear();
  }

  return {
    getOrCreateRenderPipeline,
    clearPipelineCache,
  };
}

export { PipelineManagerFactory };
