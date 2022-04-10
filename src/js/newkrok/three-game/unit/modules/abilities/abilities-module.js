import { UnitModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";

const create = ({ world, unit, config }) => {
  const abilityStates = Object.keys(config).reduce(
    (prev, key) => ({
      ...prev,
      [key]: {
        lastActivationTime: 0,
        lastCastingTime: 0,
        isCasted: false,
        isActive: false,
      },
    }),
    {}
  );

  return {
    activate: (ability) => {
      Object.keys(abilityStates).forEach(
        (key) => (abilityStates[key].isActive = false)
      );
      const abilityState = abilityStates[ability];
      abilityState.lastActivationTime = Date.now();
      abilityState.isActive = true;
    },
    deactivate: (ability) => {
      const abilityState = abilityStates[ability];
      abilityState.isActive = false;
    },
    update: ({ now }) => {
      Object.keys(abilityStates).forEach((key) => {
        const abilityState = abilityStates[key];
        const abilityConfig = config[key];
        if (
          abilityState.isActive &&
          !abilityState.isCasted &&
          now - abilityState.lastActivationTime >= abilityConfig.castingTime
        ) {
          abilityState.isCasted = true;
          abilityState.lastCastingTime = now;
          abilityConfig.on.cast({ world, caster: unit });
        } else if (
          abilityState.isCasted &&
          now - abilityState.lastCastingTime >= abilityConfig.cooldownTime
        ) {
          abilityState.isCasted = false;
          if (abilityConfig.isReactivationNeeded) abilityState.isActive = false;
          else abilityState.lastActivationTime = now;
        }
      });
    },
  };
};

export const abilitiesModule = {
  id: UnitModuleId.ABILITIES,
  create,
  config: {},
};
