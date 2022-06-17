import * as THREE from "three";

import { UnitModuleId, WorldModuleId } from "../../../modules/module-enums.js";

import { CallLimits } from "@newkrok/three-utils/src/js/newkrok/three-utils/callback-utils.js";

const create = ({ world: { getModule }, unit, config: {} }) => {
  let forward = 0;
  let backward = 0;
  let left = 0;
  let right = 0;
  let isControlPaused = false;
  let tpsCamera;

  return {
    setForwardValue: (value) => (forward = value),
    setBackwardValue: (value) => (backward = value),
    setLeftValue: (value) => (left = value),
    setRightValue: (value) => (right = value),
    pause: () => (isControlPaused = true),
    resume: () => (isControlPaused = false),
    update: ({ isPaused, delta }) => {
      if (!tpsCamera) {
        tpsCamera = getModule(WorldModuleId.THIRD_PERSON_CAMERA);
        return;
      }

      if (isPaused || isControlPaused) return;

      const cameraRotation = tpsCamera.getRotation();

      const verticalVelocity =
        Math.max(backward, forward) * (backward > forward ? -1 : 1);

      const horizontalVelocity =
        Math.max(left, right) * (left > right ? 1 : -1);

      const baseSpeed = unit.getSpeed();

      const velocity = baseSpeed * Math.max(forward, backward, left, right);
      if (velocity !== 0 || unit.userData.useAim) {
        let targetRotation = unit.userData.useAim
          ? cameraRotation.x
          : cameraRotation.x +
            Math.PI / 2 +
            Math.PI +
            (velocity === 0 && unit.userData.useAim
              ? Math.PI / 2
              : Math.atan2(verticalVelocity, horizontalVelocity));

        let newViewRotation = unit.viewRotation;
        if (newViewRotation < 0) newViewRotation += Math.PI * 2;
        let diff = targetRotation - newViewRotation;

        while (Math.abs(diff) > Math.PI) {
          if (targetRotation < newViewRotation) {
            if (targetRotation === 0) targetRotation = Math.PI * 2;
            else targetRotation += Math.PI * 2;

            if (targetRotation >= Math.PI * 4) {
              targetRotation -= Math.PI * 4;
              newViewRotation -= Math.PI * 4;
            }
          } else {
            newViewRotation += Math.PI * 2;
          }
          diff = targetRotation - newViewRotation;
        }
        unit.setRotation(unit.viewRotation + diff * (delta / 0.1));

        let normalizedDiff = Math.abs(diff);
        normalizedDiff -= normalizedDiff > Math.PI ? Math.PI : 0;

        // easing movement start when the unit rotation is different
        let velocityMultiplier =
          normalizedDiff > 0.9 ? 0 : (Math.PI - normalizedDiff) / Math.PI;

        let noramalizedTargetRotation = Math.PI * 2 - targetRotation;
        let relativeVector;

        unit.userData.moveBack = backward > 0;

        if (unit.userData.useAim) {
          unit.userData.isStrafing = left || right;
          if (unit.userData.isStrafing)
            velocityMultiplier *= /* unitActionState.run.pressed ? 0.7 :  */ 0.95;
          let rotationOffset = 0;

          if (left)
            rotationOffset =
              forward > 0
                ? Math.PI / 4
                : backward > 0
                ? Math.PI + -Math.PI / 4
                : Math.PI / 2;
          else if (right)
            rotationOffset =
              forward > 0
                ? -Math.PI / 4
                : backward > 0
                ? Math.PI + Math.PI / 4
                : -Math.PI / 2;
          else if (backward) rotationOffset = Math.PI;

          unit.userData.strafingDirection = left ? 1 : right ? -1 : 0;
          relativeVector = new THREE.Vector3(
            Math.sin(noramalizedTargetRotation + rotationOffset) *
              velocity *
              velocityMultiplier *
              delta,
            0,
            Math.cos(noramalizedTargetRotation + rotationOffset) *
              velocity *
              velocityMultiplier *
              delta
          );
        } else {
          unit.userData.isStrafing = false;
          relativeVector = new THREE.Vector3(
            Math.sin(noramalizedTargetRotation) *
              velocity *
              velocityMultiplier *
              delta,
            0,
            Math.cos(noramalizedTargetRotation) *
              velocity *
              velocityMultiplier *
              delta
          );
        }
        if (forward || backward || left || right)
          unit.addVelocity(relativeVector);
      }
    },
  };
};

export const tpsMovementModule = {
  id: UnitModuleId.TPS_MOVEMENT,
  create,
  config: {
    callLimit: CallLimits.CALL_30_PER_SECONDS,
    forceCallCount: true,
  },
};
