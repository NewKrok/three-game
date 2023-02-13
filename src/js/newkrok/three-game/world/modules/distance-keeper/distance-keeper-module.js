import * as THREE from "three";

import { CallLimits } from "@newkrok/three-utils/src/js/newkrok/three-utils/callback-utils.js";
import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";
import { getUniqueId } from "@newkrok/three-utils/src/js/newkrok/three-utils/token.js";

const neighbourIndexes = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [0, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

const create = ({ config: { areaSize = 16, rotateObjects = true } }) => {
  let dynamicEntries = [];
  let areas = {};
  const normalVectorHelper = new THREE.Vector3();

  const getPositionFromObject = (object) =>
    object.isVector3 ? object : object.position;

  const positionChange = (entry, position) => {
    const areaPosition = [
      Math.floor(position.x / areaSize),
      Math.floor(position.x / areaSize),
    ];
    const areaIndex = `${areaPosition[0]}-${areaPosition[1]}`;
    if (entry.areaIndex !== areaIndex) {
      if (areas[entry.areaIndex] && areas[entry.areaIndex][entry.objectIndex])
        areas[entry.areaIndex][entry.objectIndex] = null;

      entry.areaIndex = areaIndex;
      entry.areaPosition = areaPosition;
      areas[areaIndex] = areas[areaIndex] || {};
      areas[areaIndex][entry.objectIndex] = entry;
    }
  };

  const addObject = (objectConfig) => {
    const objectIndex = getUniqueId();
    const position = getPositionFromObject(objectConfig.object);

    const entry = {
      objectIndex,
      areaIndex: "",
      pushPermissions: [],
      isStatic: false,
      lastPosition: { x: position.x, z: position.z },
      ...objectConfig,
    };

    if (!objectConfig.isStatic) {
      dynamicEntries.push(entry);
      entry.checkPositionChange = () => {
        if (
          entry.lastPosition.x !== position.x &&
          entry.lastPosition.z !== position.z
        ) {
          entry.lastPosition.x = position.x;
          entry.lastPosition.z = position.z;
          positionChange(entry, position);
        }
      };
    }

    positionChange(entry, position);
  };

  const handlePositionChanges = () => {
    dynamicEntries.forEach(({ checkPositionChange }) => checkPositionChange());
  };

  const handleCollisions = () => {
    const checkedDynamics = [];
    for (let i = 0; i < dynamicEntries.length; i++) {
      const entryA = dynamicEntries[i];
      checkedDynamics.push(entryA);
      const positionA = getPositionFromObject(entryA.object);
      const areaPosition = entryA.areaPosition;

      neighbourIndexes.forEach((index) => {
        const currentAreaIndex = `${areaPosition[0] + index[0]}-${
          areaPosition[1] + index[1]
        }`;
        if (areas[currentAreaIndex]) {
          for (let key in areas[currentAreaIndex]) {
            const entryB = areas[currentAreaIndex][key];
            if (entryB && !checkedDynamics.includes(entryB)) {
              const positionB = getPositionFromObject(entryB.object);

              const r = entryA.radius + entryB.radius;
              const distance = positionA.distanceTo(positionB);
              if (distance < r) {
                const normal = normalVectorHelper
                  .subVectors(positionA, positionB)
                  .normalize();

                const isAPushable = entryA.pushPermissions.includes(
                  entryB.type
                );
                const isBPushable =
                  !entryB.isStatic &&
                  entryB.pushPermissions.includes(entryA.type);
                const d = (r - distance) / 2 + 0.001;

                if (isAPushable) positionA.addScaledVector(normal, d);

                if (isBPushable || !isAPushable) {
                  positionB.addScaledVector(normal, -d);

                  if (rotateObjects && entryB.object.rotation)
                    entryB.object.rotation.y +=
                      (positionA.x < positionB.x &&
                        positionA.z < positionB.z) ||
                      (positionA.x > positionB.x && positionA.z > positionB.z)
                        ? -0.01
                        : 0.01;
                }
              }
            }
          }
        }
      });
    }
  };

  const update = () => {
    handlePositionChanges();
    handleCollisions();
  };

  const dispose = () => {
    entries = null;
    areas = null;
  };

  return {
    addObject,
    update,
    dispose,
  };
};

export const distanceKeeperModule = {
  id: WorldModuleId.DISTANCE_KEEPER,
  create,
  config: {
    debug: false,
    callLimit: CallLimits.CALL_30_PER_SECONDS,
    forceCallCount: true,
  },
};
