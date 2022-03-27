export const createModuleHandler = (modules) => {
  const _modules = [];

  return {
    init: (props) =>
      modules.forEach(({ id, create, config }) => {
        _modules.push({
          id,
          ...create({ ...props, config, modules: _modules }),
        });
      }),
    getModule: (idOrSelector) =>
      typeof idOrSelector === "function"
        ? _modules.find(idOrSelector)
        : _modules.find(({ id }) => id === idOrSelector),
    update: (cycleData) => {
      _modules.forEach((module) => module.update?.(cycleData));
    },
  };
};
