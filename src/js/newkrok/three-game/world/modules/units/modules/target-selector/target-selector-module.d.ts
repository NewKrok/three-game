import { ModuleConfig } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-handler";

export type TargetSelectorModule = {
  update: (date: any) => void;
};

export const targetSelectorModule: ModuleConfig<TargetSelectorModule>;
