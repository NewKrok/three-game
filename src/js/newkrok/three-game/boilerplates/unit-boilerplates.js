export const UnitAnimationId = {
  IDLE: "IDLE",
  AIMING_IDLE: "AIMING_IDLE",
  JUMP_LOOP: "JUMP_LOOP",
  RIFLE_JUMP_LOOP: "RIFLE_JUMP_LOOP",
  WALK: "WALK",
  RUN: "RUN",
  AIMING_WALK: "AIMING_WALK",
  AIMING_RUN: "AIMING_RUN",
  RUN_BACKWARDS: "RUN_BACKWARDS",
  WALK_BACKWARDS: "WALK_BACKWARDS",
  STRAFE_RIGHT: "STRAFE_RIGHT",
  STRAFE_LEFT: "STRAFE_LEFT",
};

export const basicAnimationConfig = [
  {
    condition: ({ onGround, inAirTime, isJumpTriggered, useAim }) =>
      useAim && ((!onGround && inAirTime > 200) || isJumpTriggered),
    animation: UnitAnimationId.RIFLE_JUMP_LOOP,
    transitionTime: 0.2,
    loop: true,
  },
  {
    condition: ({ onGround, inAirTime, isJumpTriggered }) =>
      (!onGround && inAirTime > 200) || isJumpTriggered,
    animation: UnitAnimationId.JUMP_LOOP,
    transitionTime: 0.2,
    loop: true,
  },
  {
    condition: ({ horizontalVelocity, useAim }) =>
      useAim && Math.abs(horizontalVelocity) < 0.3,
    animation: UnitAnimationId.AIMING_IDLE,
    transitionTime: 0.2,
    loop: true,
  },
  {
    condition: ({ horizontalVelocity, useAim }) =>
      !useAim && Math.abs(horizontalVelocity) < 0.5,
    animation: UnitAnimationId.IDLE,
    transitionTime: 0.2,
    loop: true,
  },
  {
    condition: ({ isStrafing, strafingDirection }) =>
      isStrafing && strafingDirection === 1,
    animation: UnitAnimationId.STRAFE_RIGHT,
    transitionTime: 0.2,
    loop: true,
  },
  {
    condition: ({ isStrafing, strafingDirection }) =>
      isStrafing && strafingDirection !== 1,
    animation: UnitAnimationId.STRAFE_LEFT,
    transitionTime: 0.2,
    loop: true,
  },
  {
    condition: ({ useAim, horizontalVelocity, moveBack }) =>
      useAim && horizontalVelocity > 4 && moveBack,
    animation: UnitAnimationId.RUN_BACKWARDS,
    transitionTime: 0.2,
    loop: true,
  },
  {
    condition: ({ useAim, horizontalVelocity, moveBack }) =>
      useAim && horizontalVelocity > 1 && moveBack,
    animation: UnitAnimationId.WALK_BACKWARDS,
    transitionTime: 0.2,
    loop: true,
  },
  {
    condition: ({ useAim, horizontalVelocity }) =>
      useAim && horizontalVelocity > 4,
    animation: UnitAnimationId.AIMING_RUN,
    transitionTime: 0.2,
    loop: true,
  },
  {
    condition: ({ useAim, horizontalVelocity }) =>
      !useAim && horizontalVelocity > 4,
    animation: UnitAnimationId.RUN,
    transitionTime: 0.2,
    loop: true,
  },
  {
    condition: ({ useAim }) => useAim,
    animation: UnitAnimationId.AIMING_WALK,
    transitionTime: 0.2,
    loop: true,
  },
  {
    condition: ({ useAim }) => !useAim,
    animation: UnitAnimationId.WALK,
    transitionTime: 0.2,
    loop: true,
  },
];

export const basicCharacter = {
  name: "Basic Character",
  fbxModelId: null,
  model: {
    fbxId: null,
    scale: { x: 1, y: 1, z: 1 },
    traverseCallback: null,
  },
  height: 1.8,
  radius: 0.33,
  speedOnGround: 25,
  speedInAir: 8,
  jumpForce: 12,
  sockets: [],
  animationConfig: basicAnimationConfig,
  animations: {
    [UnitAnimationId.IDLE]: null,
    [UnitAnimationId.AIMING_IDLE]: null,
    [UnitAnimationId.JUMP_LOOP]: null,
    [UnitAnimationId.RIFLE_JUMP_LOOP]: null,
    [UnitAnimationId.WALK]: null,
    [UnitAnimationId.RUN]: null,
    [UnitAnimationId.AIMING_WALK]: null,
    [UnitAnimationId.AIMING_RUN]: null,
    [UnitAnimationId.WALK_BACKWARDS]: null,
    [UnitAnimationId.RUN_BACKWARDS]: null,
    [UnitAnimationId.STRAFE_RIGHT]: null,
    [UnitAnimationId.STRAFE_LEFT]: null,
  },
};
