export type ModuleConfig<T> = {
  id: string;
  create: () => T;
  config: any;
};

export type ModuleHandler<T> = {
  init: () => any;
  getModule: (idOrSelector: string | (() => any)) => any;
  addModule: (module: ModuleConfig<T>) => void;
  update: (date: any) => void;
  dispose: () => void;
};

export function createModuleHandler(
  moduleConfigs: Array<ModuleConfig<any>>
): ModuleHandler<any>;
