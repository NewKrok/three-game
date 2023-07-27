import { ModuleConfig } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-handler";

export type Action2DModule = {
  update: (date: any) => void;
  moveTo: (path: Array<[x:number, z:number]>) => void;
  teleportTo: (position: THREE.Vector3) => void;
  on: {
    moveEnd:((handler:(instance: any) => void) => void);
  };
  off: {
    moveEnd:((handler:(instance: any) => void) => void);
  };
};

export const action2DModule: ModuleConfig<Action2DModule>;
