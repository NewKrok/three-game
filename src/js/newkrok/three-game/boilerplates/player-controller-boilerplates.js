import { ButtonKey } from "@newkrok/three-game/src/js/newkrok/three-game/control/gamepad.js";
import { Key } from "@newkrok/three-game/src/js/newkrok/three-game/control/keyboard-manager.js";
import { UnitModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";

export const PlayerActionId = {
  PAUSE: "PAUSE",
  FORWARD: "FORWARD",
  BACKWARD: "BACKWARD",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  JUMP: "JUMP",
  SPRINT: "SPRINT",
  TOOL_ACTION: "TOOL_ACTION",
  CHOOSE_NEXT_TOOL: "CHOOSE_NEXT_TOOL",
  CHOOSE_PREV_TOOL: "CHOOSE_PREV_TOOL",
  ...Array.from({ length: 10 }).reduce(
    (prev, _, index) => ({
      ...prev,
      [`CHOOSE_TOOL_${index}`]: `CHOOSE_TOOL_${index}`,
    }),
    {}
  ),
};

export const unitControllerConfig = {
  actionConfig: [
    {
      actionId: PlayerActionId.PAUSE,
      enableDuringPause: true,
      keys: [Key.P],
      gamepadButtons: [ButtonKey.Options],
    },
    {
      actionId: PlayerActionId.FORWARD,
      listenForDeactivation: true,
      keys: [Key.W, Key.ARROW_UP],
      gamepadButtons: [ButtonKey.Up],
      axis: ButtonKey.LeftAxisY,
      axisValidator: (v) => v < -0.1,
      axisValueModifier: (v) => v * -1,
    },
    {
      actionId: PlayerActionId.BACKWARD,
      listenForDeactivation: true,
      keys: [Key.S, Key.ARROW_DOWN],
      gamepadButtons: [ButtonKey.Down],
      axis: ButtonKey.LeftAxisY,
      axisValidator: (v) => v > 0.1,
    },
    {
      actionId: PlayerActionId.LEFT,
      listenForDeactivation: true,
      keys: [Key.A, Key.ARROW_LEFT],
      gamepadButtons: [ButtonKey.Left],
      axis: ButtonKey.LeftAxisX,
      axisValidator: (v) => v < -0.1,
      axisValueModifier: (v) => v * -1,
    },
    {
      actionId: PlayerActionId.RIGHT,
      listenForDeactivation: true,
      keys: [Key.D, Key.ARROW_RIGHT],
      gamepadButtons: [ButtonKey.Right],
      axis: ButtonKey.LeftAxisX,
      axisValidator: (v) => v > 0.1,
    },
    {
      actionId: PlayerActionId.JUMP,
      keys: [Key.SPACE],
      gamepadButtons: [ButtonKey.ActionBottom],
    },
  ],

  handlers: [
    {
      actionId: PlayerActionId.PAUSE,
      callback: ({ world }) => {
        if (world.cycleData.isPaused) world.resume();
        else world.pause();
      },
    },
    {
      actionId: PlayerActionId.JUMP,
      callback: ({ target }) => {
        const octreeBehaviorModule = target.getModule?.(
          UnitModuleId.OCTREE_BEHAVIOR
        );
        if (octreeBehaviorModule?.properties.capsule.onGround)
          octreeBehaviorModule.jump(target.config.jumpForce);
      },
    },
  ],
};

export const carControllerConfig = {
  actionConfig: [
    {
      actionId: PlayerActionId.PAUSE,
      enableDuringPause: true,
      keys: [Key.P],
      gamepadButtons: [ButtonKey.Options],
    },
    {
      actionId: PlayerActionId.FORWARD,
      listenForDeactivation: true,
      keys: [Key.W, Key.ARROW_UP],
      gamepadButtons: [ButtonKey.Up],
      axis: ButtonKey.LeftAxisY,
      axisValidator: (v) => v < -0.1,
      axisValueModifier: (v) => v * -1,
    },
    {
      actionId: PlayerActionId.BACKWARD,
      listenForDeactivation: true,
      keys: [Key.S, Key.ARROW_DOWN],
      gamepadButtons: [ButtonKey.Down],
      axis: ButtonKey.LeftAxisY,
      axisValidator: (v) => v > 0.1,
    },
    {
      actionId: PlayerActionId.LEFT,
      listenForDeactivation: true,
      keys: [Key.A, Key.ARROW_LEFT],
      gamepadButtons: [ButtonKey.Left],
      axis: ButtonKey.LeftAxisX,
      axisValidator: (v) => v < -0.1,
      axisValueModifier: (v) => v * -1,
    },
    {
      actionId: PlayerActionId.RIGHT,
      listenForDeactivation: true,
      keys: [Key.D, Key.ARROW_RIGHT],
      gamepadButtons: [ButtonKey.Right],
      axis: ButtonKey.LeftAxisX,
      axisValidator: (v) => v > 0.1,
    },
  ],

  handlers: [
    {
      actionId: PlayerActionId.PAUSE,
      callback: ({ world }) => {
        if (world.cycleData.isPaused) world.resume();
        else world.pause();
      },
    },
    {
      actionId: PlayerActionId.FORWARD,
      callback: ({ target }) => {
        target.accelerate();
      },
    },
    {
      actionId: PlayerActionId.BACKWARD,
      callback: ({ target }) => {
        target.reverse();
      },
    },
    {
      actionId: PlayerActionId.LEFT,
      callback: ({ target }) => {
        target.rotateLeft();
      },
    },
    {
      actionId: PlayerActionId.RIGHT,
      callback: ({ target }) => {
        target.rotateRight();
      },
    },
  ],
};
