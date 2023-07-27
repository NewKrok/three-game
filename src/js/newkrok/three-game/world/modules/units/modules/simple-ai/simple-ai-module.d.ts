import { ModuleConfig } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-handler";

export type SimpleAiModule = {
  update: (date: any) => void;
};

export const simpleAiModule: ModuleConfig<SimpleAiModule>;
