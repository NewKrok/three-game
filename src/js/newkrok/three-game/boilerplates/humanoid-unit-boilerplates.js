import { UnitModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";
import { action2DModule } from "@newkrok/three-game/src/js/newkrok/three-game/world/modules/units/unit/modules/action-2d/action-2d-module.js";
import { basicUnit } from "./unit-boilerplates";

export const HumanoidUnitAnimationId = {
  IDLE: "IDLE",
  WALK: "WALK",
  WALK_BACKWARDS: "WALK_BACKWARDS",
  RUN: "RUN",
  RUN_BACKWARDS: "RUN_BACKWARDS",
  JUMP_LOOP: "JUMP_LOOP",
  WALK_STRAFE_RIGHT: "WALK_STRAFE_RIGHT",
  WALK_STRAFE_LEFT: "WALK_STRAFE_LEFT",
  RUN_STRAFE_RIGHT: "RUN_STRAFE_RIGHT",
  RUN_STRAFE_LEFT: "RUN_STRAFE_LEFT",

  RIFLE_IDLE: "RIFLE_IDLE",
  RIFLE_WALK: "RIFLE_WALK",
  RIFLE_WALK_BACKWARDS: "RIFLE_WALK_BACKWARDS",
  RIFLE_RUN: "RIFLE_RUN",
  RIFLE_RUN_BACKWARDS: "RIFLE_RUN_BACKWARDS",
  RIFLE_JUMP_LOOP: "RIFLE_JUMP_LOOP",
  RIFLE_STRAFE_RIGHT: "RIFLE_STRAFE_RIGHT",
  RIFLE_STRAFE_LEFT: "RIFLE_STRAFE_LEFT",

  PISTOL_IDLE: "PISTOL_IDLE",
  PISTOL_WALK: "PISTOL_WALK",
  PISTOL_WALK_BACKWARDS: "PISTOL_WALK_BACKWARDS",
  PISTOL_RUN: "PISTOL_RUN",
  PISTOL_RUN_BACKWARDS: "PISTOL_RUN_BACKWARDS",
  // PISTOL_JUMP_LOOP: "PISTOL_JUMP_LOOP",
  PISTOL_STRAFE_RIGHT: "PISTOL_STRAFE_RIGHT",
  PISTOL_STRAFE_LEFT: "PISTOL_STRAFE_LEFT",
};

export const ToolType = {
  NONE: "",
  PISTOL: "PISTOL",
  RIFLE: "RIFLE",
};

export const humanoidShooterAnimationConfig = {
  createCache: ({ getModule, getSelectedTool }) => {
    const {
      onGround,
      inAirTime,
      isJumpTriggered,
      capsule: { velocity },
    } = getModule(UnitModuleId.OCTREE_BEHAVIOR).properties;

    const flatVelocity = velocity.clone();
    flatVelocity.y = 0;
    const horizontalVelocity = flatVelocity.length();
    const selectedToolType = getSelectedTool()?.type;

    return {
      onGround,
      inAirTime,
      isJumpTriggered,
      horizontalVelocity,
      usePistol: selectedToolType === ToolType.PISTOL,
      useRifle: selectedToolType === ToolType.RIFLE,
    };
  },
  rules: [
    {
      condition: ({
        cache: { usePistol, useRifle, onGround, inAirTime, isJumpTriggered },
      }) =>
        ((!onGround && inAirTime > 200) || isJumpTriggered) &&
        (usePistol || useRifle),
      animation: HumanoidUnitAnimationId.RIFLE_JUMP_LOOP,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({ cache: { onGround, inAirTime, isJumpTriggered } }) =>
        (!onGround && inAirTime > 200) || isJumpTriggered,
      animation: HumanoidUnitAnimationId.JUMP_LOOP,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({
        userData: { useAim },
        cache: { horizontalVelocity, useRifle },
      }) => useAim && Math.abs(horizontalVelocity) < 0.3 && useRifle,
      animation: HumanoidUnitAnimationId.RIFLE_IDLE,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({
        userData: { useAim },
        cache: { horizontalVelocity, usePistol },
      }) => useAim && Math.abs(horizontalVelocity) < 0.3 && usePistol,
      animation: HumanoidUnitAnimationId.PISTOL_IDLE,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({
        userData: { useAim },
        cache: { horizontalVelocity, selectedToolType },
      }) =>
        (!useAim || !selectedToolType) && Math.abs(horizontalVelocity) < 0.5,
      animation: HumanoidUnitAnimationId.IDLE,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({
        userData: { useAim, isStrafing, strafingDirection },
        cache: { useRifle },
      }) => isStrafing && useAim && strafingDirection === 1 && useRifle,
      animation: HumanoidUnitAnimationId.RIFLE_STRAFE_LEFT,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({
        userData: { useAim, isStrafing, strafingDirection },
        cache: { usePistol },
      }) => isStrafing && useAim && strafingDirection === 1 && usePistol,
      animation: HumanoidUnitAnimationId.PISTOL_STRAFE_LEFT,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({
        cache: { horizontalVelocity, isStrafing, strafingDirection },
      }) => isStrafing && strafingDirection === 1 && horizontalVelocity > 4,
      animation: HumanoidUnitAnimationId.RUN_STRAFE_LEFT,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({ userData: { isStrafing, strafingDirection } }) =>
        isStrafing && strafingDirection === 1,
      animation: HumanoidUnitAnimationId.WALK_STRAFE_LEFT,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({
        userData: { useAim, isStrafing, strafingDirection },
        cache: { usePistol, useRifle },
      }) =>
        isStrafing &&
        useAim &&
        strafingDirection !== 1 &&
        (usePistol || useRifle),
      animation: HumanoidUnitAnimationId.RIFLE_STRAFE_RIGHT,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({
        userData: { useAim, isStrafing, strafingDirection },
        cache: { usePistol },
      }) => isStrafing && useAim && strafingDirection !== 1 && usePistol,
      animation: HumanoidUnitAnimationId.PISTOL_STRAFE_RIGHT,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({
        cache: { horizontalVelocity, isStrafing, strafingDirection },
      }) => isStrafing && strafingDirection !== 1 && horizontalVelocity > 4,
      animation: HumanoidUnitAnimationId.RUN_STRAFE_RIGHT,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({ userData: { isStrafing, strafingDirection } }) =>
        isStrafing && strafingDirection !== 1,
      animation: HumanoidUnitAnimationId.WALK_STRAFE_RIGHT,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({
        userData: { useAim, moveBack },
        cache: { horizontalVelocity, useRifle },
      }) => useAim && horizontalVelocity > 4 && moveBack && useRifle,
      animation: HumanoidUnitAnimationId.RIFLE_RUN_BACKWARDS,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({
        userData: { useAim, moveBack },
        cache: { horizontalVelocity, usePistol },
      }) => useAim && horizontalVelocity > 4 && moveBack && usePistol,
      animation: HumanoidUnitAnimationId.PISTOL_RUN_BACKWARDS,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({
        userData: { useAim, moveBack },
        cache: { horizontalVelocity },
      }) => useAim && horizontalVelocity > 4 && moveBack,
      animation: HumanoidUnitAnimationId.RUN_BACKWARDS,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({
        userData: { useAim, moveBack },
        cache: { horizontalVelocity, useRifle },
      }) => useAim && horizontalVelocity > 1 && moveBack && useRifle,
      animation: HumanoidUnitAnimationId.RIFLE_WALK_BACKWARDS,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({
        userData: { useAim, moveBack },
        cache: { horizontalVelocity, usePistol },
      }) => useAim && horizontalVelocity > 1 && moveBack && usePistol,
      animation: HumanoidUnitAnimationId.PISTOL_WALK_BACKWARDS,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({
        userData: { useAim, moveBack },
        cache: { horizontalVelocity },
      }) => useAim && horizontalVelocity > 1 && moveBack,
      animation: HumanoidUnitAnimationId.WALK_BACKWARDS,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({
        userData: { useAim },
        cache: { horizontalVelocity, useRifle },
      }) => useAim && horizontalVelocity > 4 && useRifle,
      animation: HumanoidUnitAnimationId.RIFLE_RUN,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({
        userData: { useAim },
        cache: { horizontalVelocity, usePistol },
      }) => useAim && horizontalVelocity > 4 && usePistol,
      animation: HumanoidUnitAnimationId.PISTOL_RUN,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({ cache: { horizontalVelocity } }) => horizontalVelocity > 4,
      animation: HumanoidUnitAnimationId.RUN,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({ userData: { useAim }, cache: { useRifle } }) =>
        useAim && useRifle,
      animation: HumanoidUnitAnimationId.RIFLE_WALK,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: ({ userData: { useAim }, cache: { usePistol } }) =>
        useAim && usePistol,
      animation: HumanoidUnitAnimationId.PISTOL_WALK,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: () => true,
      animation: HumanoidUnitAnimationId.WALK,
      transitionTime: 0.2,
      loop: true,
    },
  ],
};

export const rtsAnimationConfig = {
  createCache: ({ getModule }) => {
    const { isSliding, movementVector } = getModule(
      UnitModuleId.ACTION_2D
    ).properties;

    return {
      isSliding,
      speed: movementVector.manhattanLength(),
    };
  },
  rules: [
    {
      condition: ({ cache: { speed, isSliding } }) => isSliding || speed > 0.01,
      animation: HumanoidUnitAnimationId.WALK,
      transitionTime: 0.2,
      loop: true,
    },
    {
      condition: () => true,
      animation: HumanoidUnitAnimationId.IDLE,
      transitionTime: 0.2,
      loop: true,
    },
  ],
};

export const humanoidShooterUnit = {
  ...basicUnit,
  name: "Humanoid shooter unit",
  animationConfig: humanoidShooterAnimationConfig,
};

export const rtsUnit = {
  ...basicUnit,
  modules: [action2DModule],
  name: "RTS unit",
  animationConfig: rtsAnimationConfig,
};
