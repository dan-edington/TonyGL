import { uuid } from '../types';
import { Renderer } from './configureRenderer';

const shaderIncludes: Record<string, string> = import.meta.glob('../shaders/includes/**/*.wgsl', {
  query: '?raw',
  eager: true,
  import: 'default',
});

const shaders: Record<string, string> = import.meta.glob('../shaders/*.wgsl', {
  query: '?raw',
  eager: true,
  import: 'default',
});

const INCLUDE_REGEX = /^\s*\/\/\s*#include\s*(['"])([^'"\r\n]+)\1\s*$/gm;

type CachedShader = {
  code: string;
  shaderModule: GPUShaderModule;
};

type IncludeStack = string[];

export type ShaderLibrary = {
  buildCustomShader(options: { shader: string; id: uuid; label?: string }): string;
  getShader(shaderName: string): CachedShader | undefined;
};

function ShaderLibraryFactory(renderer: Renderer): ShaderLibrary {
  const shaderCache = new Map<string, CachedShader>();
  const includeCache = new Map<string, string>();

  function normalizePath(path: string): string {
    const segments = path.replace(/\\/g, '/').split('/');
    const normalizedSegments: string[] = [];

    for (const segment of segments) {
      if (!segment || segment === '.') continue;

      if (segment === '..') {
        if (normalizedSegments.length > 0) normalizedSegments.pop();
        continue;
      }

      normalizedSegments.push(segment);
    }

    return normalizedSegments.join('/');
  }

  function getDirectoryPath(path: string): string {
    const normalizedPath = normalizePath(path);
    const lastSlashIndex = normalizedPath.lastIndexOf('/');

    if (lastSlashIndex === -1) return '';

    return normalizedPath.slice(0, lastSlashIndex);
  }

  function normalizeIncludeRequest(includePath: string, sourcePath: string): string {
    const normalizedRequest = includePath.trim().replace(/\\/g, '/');
    const includePathWithExtension = normalizedRequest.endsWith('.wgsl')
      ? normalizedRequest
      : `${normalizedRequest}.wgsl`;

    if (includePathWithExtension.startsWith('./') || includePathWithExtension.startsWith('../')) {
      const directoryPath = getDirectoryPath(sourcePath);
      return normalizePath(`${directoryPath}/${includePathWithExtension}`);
    }

    if (includePathWithExtension.startsWith('/')) {
      return normalizePath(includePathWithExtension.slice(1));
    }

    if (includePathWithExtension.startsWith('includes/')) {
      return normalizePath(includePathWithExtension);
    }

    return normalizePath(`includes/${includePathWithExtension}`);
  }

  function resolveInclude(includePath: string, sourcePath: string, includeStack: IncludeStack): string {
    const resolvedIncludePath = normalizeIncludeRequest(includePath, sourcePath);
    const includeContent = includeCache.get(resolvedIncludePath);

    if (!includeContent) {
      console.warn(`Missing shader include: ${includePath} from ${sourcePath}`);
      return '';
    }

    if (includeStack.includes(resolvedIncludePath)) {
      console.warn(`Circular shader include detected: ${[...includeStack, resolvedIncludePath].join(' -> ')}`);
      return '';
    }

    return resolveIncludes(includeContent, resolvedIncludePath, [...includeStack, resolvedIncludePath]);
  }

  function resolveIncludes(source: string, sourcePath: string, includeStack: IncludeStack = []): string {
    return source.replace(INCLUDE_REGEX, (_match, _quote, includePath: string) => {
      return resolveInclude(includePath, sourcePath, includeStack);
    });
  }

  function buildIncludeCache(): void {
    const basePath = '../shaders/includes/';

    for (const key in shaderIncludes) {
      const includeContent = shaderIncludes[key];
      const includePath = normalizePath(`includes/${key.replace(basePath, '')}`);
      includeCache.set(includePath, includeContent);
    }
  }

  function buildShaderCache(): void {
    const basePath = '../shaders/';

    for (const key in shaders) {
      const shaderName = key.replace(basePath, '').replace('.wgsl', '');
      const shaderPath = key.replace(basePath, '');
      const shaderContent = shaders[key];
      const resolvedShaderContent = resolveIncludes(shaderContent, shaderPath);
      const shaderModule = renderer.device.createShaderModule({
        label: `ShaderModule_${shaderName}`,
        code: resolvedShaderContent,
      });

      shaderCache.set(shaderName, {
        code: resolvedShaderContent,
        shaderModule,
      });
    }
  }

  function buildCustomShader(options: { shader: string; id: uuid; label?: string }): string {
    const { shader, id, label } = options;

    if (shaderCache.has(id)) return id;

    const finalShader = `
      // #include "./includes/uniforms/cameraUniforms"
      // #include "./includes/uniforms/sceneUniforms"
      // #include "./includes/uniforms/lightUniforms"
      // #include "./includes/uniforms/entityUniforms"
      
      ${shader}
    `;

    const resolvedShader = resolveIncludes(finalShader, '__custom__.wgsl');
    const shaderModule = renderer.device.createShaderModule({
      label: `ShaderModule_${label ?? `custom_${id}`}`,
      code: resolvedShader,
    });

    shaderCache.set(id, {
      code: resolvedShader,
      shaderModule,
    });

    return id;
  }

  function getShader(shaderName: string): CachedShader | undefined {
    return shaderCache.get(shaderName);
  }

  buildIncludeCache();
  buildShaderCache();

  return {
    buildCustomShader,
    getShader,
  };
}

export { ShaderLibraryFactory };
