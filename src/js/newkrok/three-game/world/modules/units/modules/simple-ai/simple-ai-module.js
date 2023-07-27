import {
  UnitModuleId,
  UnitsModuleId,
} from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";

import { CallLimits } from "@newkrok/three-utils/src/js/newkrok/three-utils/callback-utils.js";
import { UnitState } from "@newkrok/three-game/src/js/newkrok/three-game/world/modules/units/unit/modules/action-2d/action-2d-module.js";

const create = ({ units }) => {
  const update = () => {
    units.forEach((unit) => {
      const unitProperties =
            unit.getModule(UnitModuleId.ACTION_2D)?.properties || {};
    });
  };

  return { update };
};

export const simpleAiModule = {
  id: UnitsModuleId.SIMPLE_AI,
  create,
  config: { callLimit: CallLimits.CALL_15_PER_SECONDS },
};
