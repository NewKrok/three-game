import * as THREE from "three";

import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";

const create = () => {
  let constraintGroups = [];
  const diff = new THREE.Vector3();

  const createConstraintGroup = ({
    constraints,
    config: { useAutoDistances },
  }) => {
    const group = constraints.map(({ pointA, pointB, distance }) => ({
      pointA,
      pointB,
      distance: useAutoDistances ? pointA.distanceTo(pointB) : distance ?? 0,
    }));

    constraintGroups.push(group);
  };

  const calculateConstrains = ({
    pointA,
    pointB,
    distance: requestedDistance,
  }) => {
    diff.subVectors(pointB, pointA);
    var distance = diff.length();
    if (distance === 0) return;
    var correction = diff.multiplyScalar(1 - requestedDistance / distance);
    var correctionHalf = correction.multiplyScalar(0.5);

    pointA.add(correctionHalf);
    pointB.sub(correctionHalf);
  };

  const update = () => {
    constraintGroups.forEach((group) => {
      group.forEach((element) => calculateConstrains(element));
    });
  };

  const dispose = () => {
    constraintGroups = [];
  };

  return {
    createConstraintGroup,
    update,
    dispose,
  };
};

export const verletIntegrationModule = {
  id: WorldModuleId.VERLET_INTEGRATION,
  create,
  config: { debug: false },
};
