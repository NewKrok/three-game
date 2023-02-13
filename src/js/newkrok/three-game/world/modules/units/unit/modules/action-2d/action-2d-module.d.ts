import { ModuleConfig } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-handler";

export type Action2DModule = {
  update: (date: any) => void;
};

export const abilitiesModule: ModuleConfig<Action2DModule>;
