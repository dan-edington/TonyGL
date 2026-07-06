import type { TonyAnyModuleFactory, TonyModule, TonyModuleContext } from './TonyGL.types';

function installModulesRecursively(
  modules: readonly TonyAnyModuleFactory[] | undefined,
  context: TonyModuleContext,
): TonyModule[] {
  const installedModules = new Map<TonyAnyModuleFactory, TonyModule>();
  const installingModules = new Set<TonyAnyModuleFactory>();

  function installModule(moduleFactory: TonyAnyModuleFactory): TonyModule {
    const alreadyInstalled = installedModules.get(moduleFactory);
    if (alreadyInstalled) return alreadyInstalled;

    if (installingModules.has(moduleFactory)) {
      throw new Error('Circular Tony module dependency detected.');
    }

    installingModules.add(moduleFactory);

    try {
      const module = moduleFactory(context);

      const dependencies = (module.__dependencies ?? []) as readonly TonyAnyModuleFactory[];

      for (const dependency of dependencies) {
        installModule(dependency);
      }

      installedModules.set(moduleFactory, module);
      Object.assign(context.tony, module);

      return module;
    } finally {
      installingModules.delete(moduleFactory);
    }
  }

  modules?.forEach(installModule);

  return Array.from(installedModules.values());
}

export { installModulesRecursively };
