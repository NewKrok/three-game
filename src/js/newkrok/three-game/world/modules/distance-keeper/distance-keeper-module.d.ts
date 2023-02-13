import * as THREE from "three";
import { ModuleConfig } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-handler";

export type DistanceKeeperObjectConfig = {
  object: THREE.Object3D;
  radius: number;
  isStatic?: boolean;
  type: string;
  pushPermissions: Array<string>;
};

export type DistanceKeeperModule = {
  addObject: (objectConfig: DistanceKeeperObjectConfig) => void;
};

export const distanceKeeperModule: ModuleConfig<DistanceKeeperModule>;
