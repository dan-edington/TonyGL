import { describe, expect, it, vi } from 'vitest';
import { installModulesRecursively } from '../installModulesRecursively';
import type { TonyModule, TonyModuleContext } from '../TonyGL.types';

function createTonyModuleContext(): TonyModuleContext {
  return {
    renderer: {} as never,
    entityFactory: {} as never,
    createUniformBuffer: {} as never,
    registerMaterialLayoutDescriptor: () => {},
    tony: {} as any,
  };
}

describe('installModulesRecursively', () => {
  it('installs transitive dependencies once and reuses already installed modules', () => {
    const leafModule = vi.fn(() => ({ leaf: true } satisfies TonyModule));
    const branchModule = vi.fn(() => ({ branch: true, __dependencies: [leafModule] } satisfies TonyModule));
    const rootModule = vi.fn(() => ({ root: true, __dependencies: [branchModule, leafModule] } satisfies TonyModule));

    const context = createTonyModuleContext();

    const installedModules = installModulesRecursively([rootModule, leafModule], context);

    expect(rootModule).toHaveBeenCalledTimes(1);
    expect(branchModule).toHaveBeenCalledTimes(1);
    expect(leafModule).toHaveBeenCalledTimes(1);
    expect(installedModules).toHaveLength(3);
    expect(context.tony).toMatchObject({ root: true, branch: true, leaf: true });
  });
});