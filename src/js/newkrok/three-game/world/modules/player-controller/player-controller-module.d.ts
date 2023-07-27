import { World } from "@newkrok/three-game";
import { ModuleConfig } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-handler";

export type ActionConfig = {
  actionId: string;
  gamepadButtons?: Array<number>;
  keys?: Array<string>;
  mouse?: Array<string>;
  customTrigger?: (trigger: (value: any) => void) => void;
};

export type Handler<T> = {
  actionId: string;
  callback: (value: { world: World; value: any; target: T }) => void;
};

export type PlayerControllerObjectConfig<T> = {
  actionConfig: Array<ActionConfig>;
  handlers: Array<Handler<T>>;
};

export type PlayerControllerModule<T> = {
  setTarget: (value: T) => void;
  getTarget: () => T;
  setConfig: (config: PlayerControllerObjectConfig<T>) => void;
  pause: () => void;
  resume: () => void;
  dispose: () => void;
};

export const playerControllerModule: ModuleConfig<PlayerControllerModule<any>>;
