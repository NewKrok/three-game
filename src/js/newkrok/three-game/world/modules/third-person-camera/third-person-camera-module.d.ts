import { ModuleConfig } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-handler";
import { Quaternion } from "three";

export type ThirdPersonCameraModule = {
  instance: THREE.PerspectiveCamera;
  setTarget: (target: THREE.Object3D) => void;
  getTarget: () => THREE.Object3D;
  setTargetQuaternionOffset: (quaternion: Quaternion) => void;
  setPositionOffset: (offset: THREE.Vector3) => void;
  getUseTargetRotation: () => boolean;
  setUseTargetRotation: (value: boolean) => void;
};

export const thirdPersonCameraModule: ModuleConfig<ThirdPersonCameraModule>;
