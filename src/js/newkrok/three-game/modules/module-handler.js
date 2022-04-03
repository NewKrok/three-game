export const createModuleHandler = (modules) => {
  const _modules = [];
  let customProps = {};

  const addModule = ({ id, config, create }) => {
    _modules.push({
      id,
      ...create({ ...customProps, config, modules: _modules }),
    });
  };

  return {
    init: (props) => {
      customProps = props;
      modules.forEach((module) => addModule(module));
    },
    getModule: (idOrSelector) =>
      typeof idOrSelector === "function"
        ? _modules.find(idOrSelector)
        : _modules.find(({ id }) => id === idOrSelector),
    addModule,
    update: (cycleData) => {
      _modules.forEach((module) => module.update?.(cycleData));
    },
  };
};
