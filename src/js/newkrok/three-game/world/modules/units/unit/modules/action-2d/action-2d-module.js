import * as THREE from "three";

import { CallLimits } from "@newkrok/three-utils/src/js/newkrok/three-utils/callback-utils.js";
import { UnitModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";

export const UnitState = {
  ROTTEN: "ROTTEN",
  IDLE: "IDLE",
  DEAD: "DEAD",
  MOVE_TO: "MOVE_TO",
  ATTACK_REQUESTED: "ATTACK_REQUESTED",
  ATTACK_TRIGGERED: "ATTACK_TRIGGERED",
};

export const Command = {
  NOTHING: "NOTHING",
  MOVE_TO: "MOVE_TO",
  ATTACK_MOVE_TO: "ATTACK_MOVE_TO",
};

const create = ({ unit }) => {
  const properties = {
    state: UnitState.IDLE,
    command: Command.NOTHING,
    commandValues: {
      path: [],
      target: null,
    },
    nearestTarget: null,
    lastVisitedPosition: unit.container.position.clone().floor(),
    movementVector: new THREE.Vector3(),
    isSliding: false,
  };

  const prevPosition = new THREE.Vector3();

  const instance = {};
  let moveEndHandlers = [];
  let currentPathIndex = 0;

  const moveToNextPathPoint = () => {
    properties.lastVisitedPosition.set(
      properties.commandValues.path[currentPathIndex].x,
      0,
      properties.commandValues.path[currentPathIndex].z
    );
    currentPathIndex++;

    if (currentPathIndex < properties.commandValues.path.length) {
      if (
        properties.commandValues.target &&
        properties.commandValues.target.properties.state !== UnitState.DEAD
      ) {
        if (properties.state !== UnitState.ATTACK_TRIGGERED) {
          /*let couldTriggerAttack  = attackRoutine();
          if (couldTriggerAttack) return;*/
        } else {
          //attackRequest();
          return;
        }
      }
      //move(moveToNextPathPoint);
    } else if (
      properties.commandValues.target &&
      properties.commandValues.target.properties.state !==
        UnitState.ATTACK_TRIGGERED
    ) {
      if (properties.commandValues.target.properties.state !== UnitState.DEAD) {
        /*let couldTriggerAttack = attackRoutine();
        if (!couldTriggerAttack) {
          moveToRequest(target.getWorldPoint());
        }*/
      }
    } else {
      onMoveEnd();

      if (properties.commandValues.command === Command.MOVE_TO)
        properties.commandValues.command = Command.NOTHING;
    }
  };

  const moveToRequest = (path) => {
    if (properties.state === UnitState.DEAD) return;

    currentPathIndex = 1;
    if (properties.state !== UnitState.ATTACK_REQUESTED)
      properties.state = UnitState.MOVE_TO;

    if (path && path.length) moveToNextPathPoint();
    else onMoveEnd();
  };

  const onMoveEnd = () => {
    properties.movementVector.set(0, 0, 0);
    properties.commandValues.path = [];
    properties.state = UnitState.IDLE;

    moveEndHandlers.forEach((handler) => handler(instance));
  };

  const triggerMoveTo = (path) => {
    if (
      [UnitState.ATTACK_REQUESTED, UnitState.ATTACK_TRIGGERED].includes(
        properties.state
      )
    ) {
      properties.commandValues.target = null;
      properties.nearestTarget = null;
      onMoveEnd();
    }

    moveToRequest(path);
  };

  const attackMoveTo = (point) => {};

  const moveTo = (path) => {
    properties.command = Command.MOVE_TO;
    properties.commandValues.path = path;
    triggerMoveTo(path);
  };

  const teleportTo = (position) => {
    unit.container.position.copy(position);
    properties.command = Command.NOTHING;
    onMoveEnd();
  };

  const move = () => {
    if (!properties.commandValues.path.length) return;

    const distanceCheck = Math.max(unit.config.speed, 0.6);
    let [x, z] = properties.commandValues.path[currentPathIndex];
    let distance;
    do {
      distance = new THREE.Vector3(x, unit.container.position.y, z)
        .sub(unit.container.position)
        .length();
      if (distance < distanceCheck) {
        currentPathIndex++;
        if (currentPathIndex === properties.commandValues.path.length) {
          onMoveEnd();
          return;
        }
        [x, z] = properties.commandValues.path[currentPathIndex];
      }
    } while (distance < distanceCheck);

    properties.movementVector = unit
      .getForwardVector()
      .multiplyScalar(unit.config.speed);
    unit.container.position.add(properties.movementVector);
  };

  const moveToHelperPoint = new THREE.Vector3();
  const rotate = () => {
    if (
      [UnitState.IDLE, UnitState.DEAD, UnitState.ROTTEN].includes(
        properties.state
      )
    )
      return;

    const unitPosition = unit.container.position;
    let [x, z] = properties.commandValues.path[currentPathIndex];

    moveToHelperPoint.set(x, unit.container.position.y, z);

    const targetRotation =
      Math.PI * 2 -
      Math.atan2(
        moveToHelperPoint.z - unitPosition.z,
        moveToHelperPoint.x - unitPosition.x
      ) +
      Math.PI / 2;
    const unitRotation = unit.container.rotation;
    if (targetRotation - unitRotation.y > Math.PI)
      unitRotation.y += Math.PI * 2;
    else if (unitRotation.y - targetRotation > Math.PI)
      unitRotation.y -= Math.PI * 2;

    unitRotation.y +=
      (targetRotation - unitRotation.y) * unit.config.rotationSpeed;
  };

  const on = {
    moveEnd: (handler) => moveEndHandlers.push(handler),
  };

  const off = {
    moveEnd: (handler) =>
      (moveEndHandlers = moveEndHandlers.filter((entry) => entry !== handler)),
  };

  const update = () => {
    properties.isSliding =
      !prevPosition.equals(unit.container.position) &&
      properties.movementVector.x === 0 &&
      properties.movementVector.z === 0;

    move();
    rotate();

    prevPosition.copy(unit.container.position);
  };

  const dispose = () => {
    moveEndHandlers = null;
  };

  Object.assign(instance, {
    properties,
    attackMoveTo,
    moveTo,
    teleportTo,
    update,
    on,
    off,
    dispose,
  });

  return instance;
};

export const action2DModule = {
  id: UnitModuleId.ACTION_2D,
  create,
  config: { callLimit: CallLimits.CALL_30_PER_SECONDS },
};
