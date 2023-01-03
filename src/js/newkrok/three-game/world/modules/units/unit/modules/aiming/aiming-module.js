import * as THREE from "three";

import {
  UnitModuleId,
  WorldModuleId,
} from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";

import { ModelSocketId } from "../../../unit/unit-enums.js";

const create = ({ world, unit }) => {
  const leftHandOffset = new THREE.Vector3();
  const aimingPosition = new THREE.Vector3();
  const rightHandTargetWithLerp = new THREE.Vector3();
  const spineTargetWithLerp = new THREE.Vector3();
  const leftHandWorldPosition = new THREE.Vector3();
  const ray = new THREE.Ray();
  const { worldOctree } = world.getModule(WorldModuleId.OCTREE);
  const leftHandSocket = unit.getSocket(ModelSocketId.LEFT_HAND);
  const rightHandSocket = unit.getSocket(ModelSocketId.RIGHT_HAND);
  const leftElbowSocket = unit.getSocket(ModelSocketId.LEFT_ELBOW);
  const spineSocket = unit.getSocket(ModelSocketId.SPINE);

  let cameraInstance, originalLeftHandParent, originalLeftHandPosition;

  return {
    setLeftHandOffset: (offset) => leftHandOffset.copy(offset),
    update: () => {
      if (!cameraInstance) {
        cameraInstance = world.userData.tpsCamera?.instance;
        return;
      }
      if (unit.userData.useAim && unit.getSelectedTool()?.type) {
        const cameraPosition = cameraInstance.getWorldPosition(
          new THREE.Vector3()
        );
        const cameraDirection = cameraInstance.getWorldDirection(
          new THREE.Vector3()
        );
        ray.origin.copy(cameraPosition);
        ray.direction.copy(cameraDirection);
        const aimingRayResult = worldOctree.rayIntersect(ray);
        aimingPosition.copy(
          aimingRayResult?.position ||
            cameraPosition.add(cameraDirection.setLength(15))
        );

        if (!originalLeftHandParent) {
          originalLeftHandParent = leftHandSocket.parent.parent;
          originalLeftHandPosition = leftHandSocket.parent.position.clone();
        }
        rightHandSocket.parent.add(leftHandSocket.parent);
        spineTargetWithLerp.lerp(aimingPosition, 0.1);
        spineSocket.parent.lookAt(spineTargetWithLerp);
        spineSocket.parent.rotateY(Math.PI / 2 - 0.5);

        rightHandTargetWithLerp.lerp(aimingPosition, 0.2);
        rightHandSocket.parent.lookAt(rightHandTargetWithLerp);
        rightHandSocket.parent.rotateX(Math.PI / 2);
        leftHandSocket.parent.position.copy(leftHandOffset);
        leftHandSocket.parent.rotation.set(
          Math.PI / 2,
          -Math.PI / 4,
          Math.PI / 2
        );
        leftHandSocket.parent.updateWorldMatrix(true, false);
        leftHandWorldPosition.set(0, 0, 0);
        leftHandSocket.parent.localToWorld(leftHandWorldPosition);
        leftElbowSocket.parent.lookAt(leftHandWorldPosition);
        leftElbowSocket.parent.updateWorldMatrix(true, false);
        leftElbowSocket.parent.rotateZ(-Math.PI / 2);
        leftElbowSocket.parent.rotateX(Math.PI / 2);
      } else {
        if (originalLeftHandParent) {
          originalLeftHandParent.add(leftHandSocket.parent);
          leftHandSocket.parent.position.copy(originalLeftHandPosition);
          originalLeftHandPosition = null;
          originalLeftHandParent = null;
        }
      }
    },
  };
};

export const aimingModule = {
  id: UnitModuleId.AIMING,
  create,
  config: {},
};
