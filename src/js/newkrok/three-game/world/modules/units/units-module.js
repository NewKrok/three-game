import { CallLimits } from "@newkrok/three-utils/src/js/newkrok/three-utils/callback-utils.js";
import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";
import { createUnit } from "../../../unit/unit.js";
import { updateUnitAnimation } from "../../../unit/unit-animation.js";

const create = ({ world, config: {} }) => {
  let units = [];

  const _createUnit = ({ id, config, position, rotation }) => {
    createUnit({
      world,
      id,
      position: typeof position === "function" ? position(world) : position,
      rotation: typeof rotation === "function" ? rotation(world) : rotation,
      config,
      getWorldModule: world.getModule,
      onComplete: (unit) => {
        world.scene.add(unit.model);
        units.push(unit);
      },
    });
  };

  const update = ({ delta }) => {
    const cycleData = world.cycleData;
    units.forEach((unit) => {
      // TODO updateUnitAnimation could be part of a unit animation module
      if (!cycleData.isPaused) updateUnitAnimation({ delta: delta, unit });
      unit.update(delta, cycleData);
    });
  };

  const dispose = () => {
    units.forEach((unit) => unit.dispose());
    units = [];
  };

  return {
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
  },
};
