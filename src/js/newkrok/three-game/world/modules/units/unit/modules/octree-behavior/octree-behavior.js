import * as THREE from "three";

import { UnitModuleId, WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";

import { CallLimits } from "@newkrok/three-utils/src/js/newkrok/three-utils/callback-utils.js";

const create = ({ world: { getModule }, unit, config: {id, radius = 0.33, height = 1.8, position = new THREE.Vector3()} }) => {
  let octreeModule = getModule(WorldModuleId.OCTREE);

  const properties = {
    inAirStartTime: 0,
    inAirTime: 0,
    isJumpTriggered: false,
    capsule: octreeModule.createCapsule({ id, radius, height, position })
  }

  unit.collider = properties.capsule.collider;
  unit.userData.octreeBehavior = properties;

  const checkGroundState = (now) => {
    if (properties.capsule.onGround) {
      properties.inAirStartTime = 0;
      properties.inAirTime = 0;
      properties.isJumpTriggered = false;
    } else if (properties.inAirStartTime === 0) properties.inAirStartTime = now;
    else properties.inAirTime = now - properties.inAirStartTime;
  };

  const updateModelPosition = () => {
    octreeModule = octreeModule || getModule(WorldModuleId.OCTREE);
    if (!octreeModule) return;
    
    properties.capsule.collider.getCenter(unit.model.position);
    unit.model.position.y -= height / 2 + radius / 2;
  }

  const update = ({ now, isPaused }) => {
    if (!isPaused) {
      checkGroundState(now);
      updateModelPosition();
    }
  }

  const teleportTo = (position) =>
  {
    properties.capsule.collider.translate(position.clone().sub(unit.model.position));
  }

  const addVelocity = (value) => properties.capsule.velocity.add(value);

  const clearVelocity = () => properties.capsule.velocity.set(0, 0, 0);
  
  const jump = (force) => {
    properties.capsule.velocity.y = force;
    properties.isJumpTriggered = true;
  };
  
  return {
    properties,
    update,
    teleportTo,
    addVelocity,
    clearVelocity,
    jump
  };
};

export const octreeBehaviorModule = {
  id: UnitModuleId.OCTREE_BEHAVIOR,
  create,
  config: {
    callLimit: CallLimits.CALL_30_PER_SECONDS,
    forceCallCount: true,
  },
};
