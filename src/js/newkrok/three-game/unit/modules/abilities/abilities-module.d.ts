import { ModuleConfig } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-handler";

export type AbilitiesModule = {
  activate: (abilityId: string) => void;
  deactivate: (abilityId: string) => void;
  enableAbility: (abilityId: string) => void;
  disableAbility: (abilityId: string) => void;
  update: (date: any) => void;
};

export const abilitiesModule: ModuleConfig<AbilitiesModule>;
