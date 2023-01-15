import { ModuleConfig } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-handler";

export type FastAstar = {
  search: (from: any, to: any, option: any) => Array<any>;
};

export type AstarMap = {
  map: FastAstar;
  clearCache: () => void;
  addObstacles: (positions: Array<any>) => void;
  removeObstacles: (positions: Array<any>) => void;
  search: (from: any, to: any, option: any) => Array<any>;
};

export type AstarModule = {
  createMap: Promise<AstarMap>;
};

export const astarModule: ModuleConfig<AstarModule>;
