import {
  CallLimits,
  callWithReducer,
} from "@newkrok/three-utils/src/js/newkrok/three-utils/callback-utils.js";

export const createModuleHandler = (modules) => {
  let _moduleCache = {};
  let _modules = [];
  let customProps = {};

  const addModule = ({ id, config, create }) => {
    _modules.push({
      id,
      config,
      ...create({ ...customProps, config, modules: _modules }),
    });
  };

  return {
    init: (props) => {
      customProps = props;
      modules.forEach((module) => addModule(module));
    },
    getModule: (idOrSelector) => {
      if (_moduleCache[idOrSelector]) return _moduleCache[idOrSelector];

      const module = typeof idOrSelector === "function"
        ? _modules.find(idOrSelector)
        : _modules.find(({ id }) => id === idOrSelector);

      _moduleCache[idOrSelector] = module;
      return module;
    },
    addModule,
    update: (cycleData) =>
      _modules.forEach((module) => {
        if (module.update) {
          if (module.config?.callLimit) {
            const reducerId = `@newkrok/reducer/${module.id}${
              customProps.id ? `-${customProps.id}` : ""
            }`;
            const calculatedDelta =
              module.config?.forceCallCount &&
              module.config?.callLimit === CallLimits.NO_LIMIT
                ? cycleData.delta
                : module.config.callLimit / 1000;
            callWithReducer({
              id: reducerId,
              callback: module.update,
              callbackParam: { ...cycleData, delta: calculatedDelta },
              callLimit: module.config.callLimit,
              forceCallCount: module.config.forceCallCount ?? false,
              elapsed: cycleData.elapsed * 1000,
            });
          } else module.update(cycleData);
        }
      }),
    dispose: () => {
      _modules.forEach((module) => module.dispose?.());
      _modules = null;
      _moduleCache = null;
    }
  };
};
