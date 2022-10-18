import * as THREE from "three";

import { CallLimits } from "@newkrok/three-utils/src/js/newkrok/three-utils/callback-utils.js";
import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";

const create = ({ config }) => {
  let target, q;
  let maxDistance,
    maxDistanceByCollision,
    currentDistance,
    maxCameraOffset,
    targetQuaternionOffset,
    targetQuaternionHelper;
  let _worldOctree;
  let useTargetRotation = false;
  let targetRotation = 0;

  let cameraSphere = new THREE.Sphere(
    new THREE.Vector3(),
    config.cameraCollisionRadius
  );

  maxDistance = maxDistanceByCollision = currentDistance = config.maxDistance;

  const requestedPositionOffset = new THREE.Vector3(
    config.positionOffset.x,
    config.positionOffset.y,
    config.positionOffset.z
  );
  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const rotation = new THREE.Vector3();
  const rotationEuler = new THREE.Euler();
  const realTargetPosition = new THREE.Object3D();
  const rotatedPositionOffset = new THREE.Vector3(0, 0, 0);
  const targetAndOffsetNormalizedVector = new THREE.Vector3(0, 0, 0);
  const offsetAndCameraNormalizedVector = new THREE.Vector3(0, 0, 0);

  const calculateOffset = (pos) => {
    const normalizedDistance = Math.min(
      currentDistance,
      maxDistanceByCollision
    );
    const idealOffset = new THREE.Vector3(
      0,
      -normalizedDistance * Math.cos(rotation.y),
      -normalizedDistance * Math.sin(rotation.y)
    );
    idealOffset.applyQuaternion(q);
    idealOffset.add(pos);

    return idealOffset;
  };

  const normalizePositionOffset = () => {
    const reversedRotation =
      Math.PI - rotation.x + (target ? target.rotation.x : 0);
    const rotatedRotation = reversedRotation + Math.PI / 2;
    rotatedPositionOffset.set(
      requestedPositionOffset.x * Math.sin(rotatedRotation) +
        requestedPositionOffset.z * Math.sin(reversedRotation),
      0,
      requestedPositionOffset.z * Math.cos(reversedRotation) +
        requestedPositionOffset.x * Math.cos(rotatedRotation)
    );
    targetAndOffsetNormalizedVector
      .copy(rotatedPositionOffset)
      .setLength(config.cameraCollisionRadius);
    maxCameraOffset = rotatedPositionOffset.length();
  };

  const setYBoundaries = ({ min, max }) => {
    config.yBoundaries.min = min || config.yBoundaries.min;
    config.yBoundaries.max = max || config.yBoundaries.max;
    rotation.y = Math.max(config.yBoundaries.min, rotation.y);
    rotation.y = Math.min(config.yBoundaries.max, rotation.y);
  };

  const normalizeRotation = (x) => {
    rotation.y = Math.max(config.yBoundaries.min, rotation.y);
    rotation.y = Math.min(config.yBoundaries.max, rotation.y);
    if (x !== null) q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -rotation.x);

    normalizePositionOffset();
  };

  const setPositionOffset = (value) => {
    requestedPositionOffset.copy(value);
    normalizePositionOffset();
  };

  return {
    instance: camera,
    setWorldOctree: (worldOctree) => (_worldOctree = worldOctree),
    setTarget: (object) => {
      target = object;
      if (target) q = target.quaternion.clone();
    },
    getTarget: () => target,
    setTargetQuaternionOffset: (quaternion) => {
      targetQuaternionOffset = quaternion;
      targetQuaternionHelper = targetQuaternionHelper || new THREE.Quaternion();
    },
    jumpToTarget: () => {
      if (target) realTargetPosition.position.copy(target.position);
    },
    orientToTarget: () => {
      if (!target) return;

      rotation.x = targetRotation =
        -rotationEuler.setFromQuaternion(q).y + config.initialRotation.x;
      rotation.y = config.initialRotation.y;
    },
    setMaxDistance: (value) => (maxDistance = value),
    setYBoundaries,
    setPositionOffset,
    update: ({ isPaused, delta }) => {
      if (config.stopDuringPause && isPaused) return;

      if (target) {
        if (useTargetRotation) {
          const targetQuaternion = targetQuaternionHelper
            ? targetQuaternionHelper
                .copy(target.quaternion)
                .multiply(targetQuaternionOffset)
            : target.quaternion;
          q.slerp(targetQuaternion, config.lerp.targetRotation * delta);
          rotation.x = -rotationEuler.setFromQuaternion(q).y;
          normalizeRotation(null);
        }

        const targetPos = target.position.clone();

        if (targetPos) {
          const cameraCollisionStep = config.cameraCollisionRadius;
          targetPos.y += requestedPositionOffset.y;

          /**
           * Check collision between target and requested offset to calculate the max possible offset
           * */
          let hasCollision = false;
          let sphereCollision;
          let targetAndOffsetDistance = 0;
          cameraSphere.center.copy(targetPos);

          if (_worldOctree) {
            sphereCollision = _worldOctree.sphereIntersect(cameraSphere);
            let isFirstCheckCollide = sphereCollision;
            while (
              targetAndOffsetDistance < maxCameraOffset &&
              !sphereCollision
            ) {
              targetAndOffsetDistance += cameraCollisionStep;
              if (isFirstCheckCollide) {
                cameraSphere.center.sub(targetAndOffsetNormalizedVector);
              } else {
                cameraSphere.center.add(targetAndOffsetNormalizedVector);
              }

              sphereCollision = _worldOctree.sphereIntersect(cameraSphere);
              hasCollision = hasCollision || sphereCollision;
            }
            if (sphereCollision) {
              cameraSphere.center.add(
                sphereCollision.normal.multiplyScalar(sphereCollision.depth)
              );
              targetAndOffsetDistance = targetPos.distanceTo(
                cameraSphere.center
              );
            }
          }

          realTargetPosition.position.lerp(
            cameraSphere.center,
            delta *
              (hasCollision
                ? config.lerp.position.collision
                : config.lerp.position.normal)
          );
          cameraSphere.center.copy(realTargetPosition.position);

          /**
           * Check collision between offset target position and requested camera position
           * to calculate the max camera distance
           * */
          realTargetPosition.lookAt(
            calculateOffset(cameraSphere.center.clone())
          );
          offsetAndCameraNormalizedVector.set(0, 0, 1);
          offsetAndCameraNormalizedVector.applyQuaternion(
            realTargetPosition.quaternion
          );
          offsetAndCameraNormalizedVector.setLength(cameraCollisionStep);
          let offsetAndCameraDistance = cameraCollisionStep;

          if (_worldOctree) {
            sphereCollision = false;
            while (offsetAndCameraDistance < maxDistance && !sphereCollision) {
              offsetAndCameraDistance += cameraCollisionStep;
              cameraSphere.center.add(offsetAndCameraNormalizedVector);
              sphereCollision = _worldOctree.sphereIntersect(cameraSphere);
              hasCollision = hasCollision || sphereCollision;
            }
            if (sphereCollision) {
              cameraSphere.center.add(
                sphereCollision.normal.multiplyScalar(sphereCollision.depth)
              );
              offsetAndCameraDistance = realTargetPosition.position.distanceTo(
                cameraSphere.center
              );
            }

            currentDistance = THREE.MathUtils.lerp(
              currentDistance,
              offsetAndCameraDistance,
              Math.min(
                1,
                delta *
                  (hasCollision
                    ? config.lerp.distance.collision
                    : config.lerp.distance.normal)
              )
            );
            maxDistanceByCollision = Math.max(
              hasCollision ? offsetAndCameraDistance : currentDistance,
              maxDistance
            );
          } else {
            currentDistance = THREE.MathUtils.lerp(
              currentDistance,
              maxDistance,
              Math.min(1, delta * config.lerp.distance.normal)
            );
            maxDistanceByCollision = Math.max(currentDistance, maxDistance);
          }

          offsetAndCameraNormalizedVector.setLength(currentDistance);
          cameraSphere.center
            .copy(realTargetPosition.position)
            .add(offsetAndCameraNormalizedVector);
          camera.position.copy(cameraSphere.center);
          camera.lookAt(realTargetPosition.position);
        }
      }
    },
    getRotation: () => rotation,
    rotate: ({ x, y }) => {
      if (target) {
        if (!useTargetRotation) rotation.x += x ?? 0;
        rotation.y += y ?? 0;
        normalizeRotation(x);
      }
    },
    setRotation: ({ x, y }) => {
      if (target) {
        if (!useTargetRotation) rotation.x = x ?? 0;
        rotation.y = y ?? 0;
        normalizeRotation(x);
      }
    },
    getUseTargetRotation: () => useTargetRotation,
    setUseTargetRotation: (value) => (useTargetRotation = value),
  };
};

export const thirdPersonCameraModule = {
  id: WorldModuleId.THIRD_PERSON_CAMERA,
  create,
  config: {
    callLimit: CallLimits.CALL_30_PER_SECONDS,
    forceCallCount: true,
    stopDuringPause: true,
    maxDistance: 3,
    positionOffset: { x: 0, y: 0, z: 0 },
    yBoundaries: { min: 0, max: Math.PI },
    cameraCollisionRadius: 0.2,
    initialRotation: { x: 0, y: 2 },
    lerp: {
      position: {
        collision: 20,
        normal: 10,
      },
      distance: {
        collision: 20,
        normal: 4,
      },
      targetRotation: 6,
    },
  },
};
