import { CallLimits } from "@newkrok/three-utils/src/js/newkrok/three-utils/callback-utils.js";
import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";
import { createModuleHandler } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-handler.js";
import { createUnit } from "@newkrok/three-game/src/js/newkrok/three-game/world/modules/units/unit/unit.js";
import { updateUnitAnimation } from "@newkrok/three-game/src/js/newkrok/three-game/world/modules/units/unit/unit-animation.js";

const create = ({ world, config: {modules} }) => {
  let moduleHandler = createModuleHandler(modules);
  let units = [];

  const _createUnit = ({ id, owner, config, position, rotation }) => {
    const unit = createUnit({
      world,
      id,
      owner,
      position: typeof position === "function" ? position(world) : position,
      rotation: typeof rotation === "function" ? rotation(world) : rotation,
      config,
      getWorldModule: world.getModule,
    });

    world.scene.add(unit.container);
    units.push(unit);

    return unit;
  };

  const update = (cycleData) => {
    units.forEach((unit) => {
      // TODO updateUnitAnimation could be part of a unit animation module
      if (!cycleData.isPaused) updateUnitAnimation({ delta: cycleData.delta, unit });
      unit.update(cycleData);
    });

    moduleHandler.update(cycleData);
  };

  const dispose = () => {
    units.forEach((unit) => unit.dispose());
    units = null;
    moduleHandler.dispose();
    moduleHandler = null;
  };

  moduleHandler.init({ world, units });

  return {
    getModule: moduleHandler.getModule,
    addModule: moduleHandler.addModule,
    addModules: (modules) => modules.forEach(moduleHandler.addModule),
    update,
    dispose,
    createUnit: _createUnit,
    getUnits: () => units,
    getUnit: (idOrSelector) =>
      typeof idOrSelector === "function"
        ? units.find(idOrSelector)
        : units.find(({ id }) => id === idOrSelector),
  };
};

export const unitsModule = {
  id: WorldModuleId.UNITS,
  create,
  config: {
    debug: false,
    callLimit: CallLimits.CALL_30_PER_SECONDS,
    forceCallCount: true,
    modules: []
  },
};
