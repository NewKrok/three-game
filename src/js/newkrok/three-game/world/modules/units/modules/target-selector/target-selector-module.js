import {
  UnitModuleId,
  UnitsModuleId,
} from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";

import { CallLimits } from "@newkrok/three-utils/src/js/newkrok/three-utils/callback-utils.js";
import { UnitState } from "@newkrok/three-game/src/js/newkrok/three-game/world/modules/units/unit/modules/action-2d/action-2d-module.js";

const create = ({ units }) => {
  const update = () => {
    units.forEach((unitA) => {
      let bestDistance = Number.MAX_VALUE;
      let bestUnit, unitAProperties;
      units.forEach((unitB) => {
        if (unitA != unitB) {
          unitAProperties =
            unitA.getModule(UnitModuleId.ACTION_2D)?.properties || {};
          const unitBProperties =
            unitB.getModule(UnitModuleId.ACTION_2D)?.properties || {};
          if (
            unitAProperties.state !== UnitState.Dead &&
            unitBProperties.state !== UnitState.Dead
          ) {
            const distance = unitA.container.position.manhattanDistanceTo(
              unitB.container.position
            );
            if (
              unitA.owner != unitB.owner &&
              distance < bestDistance &&
              distance <= unitA.config.detectionRange
            ) {
              bestDistance = distance;
              bestUnit = unitB;
            } else if (
              unitAProperties.nearestTarget === null &&
              unitBProperties.nearestTarget !== null &&
              unitA.owner === unitB.owner &&
              distance <= unitA.config.detectionRange
            ) {
              bestUnit = unitBProperties.nearestTarget;
            }
          }
        }
      });

      if (bestUnit && unitAProperties) unitAProperties.nearestTarget = bestUnit;
    });
  };

  return { update };
};

export const targetSelectorModule = {
  id: UnitsModuleId.TARGET_SELECTOR,
  create,
  config: { callLimit: CallLimits.CALL_15_PER_SECONDS },
};
