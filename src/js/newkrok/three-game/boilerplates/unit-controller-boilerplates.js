import { ButtonKey } from "@newkrok/three-game/src/js/newkrok/three-game/control/gamepad.js";
import { Key } from "@newkrok/three-game/src/js/newkrok/three-game/control/keyboard.js";

export const UnitActionId = {
  FORWARD: "FORWARD",
  BACKWARD: "BACKWARD",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  JUMP: "JUMP",
  SPRINT: "SPRINT",
  DASH: "DASH",
  CAMERA: "CAMERA",
  AIM: "AIM",
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
      actionId: UnitActionId.FORWARD,
      listenForDeactivation: true,
      keys: [Key.W, Key.ARROW_UP],
      gamepadButtons: [ButtonKey.Up],
      axis: ButtonKey.LeftAxisY,
      axisValidator: (v) => v < -0.1,
      axisValueModifier: (v) => v * -1,
    },
    {
      actionId: UnitActionId.BACKWARD,
      listenForDeactivation: true,
      keys: [Key.S, Key.ARROW_DOWN],
      gamepadButtons: [ButtonKey.Down],
      axis: ButtonKey.LeftAxisY,
      axisValidator: (v) => v > 0.1,
    },
    {
      actionId: UnitActionId.LEFT,
      listenForDeactivation: true,
      keys: [Key.A, Key.ARROW_LEFT],
      gamepadButtons: [ButtonKey.Left],
      axis: ButtonKey.LeftAxisX,
      axisValidator: (v) => v < -0.1,
      axisValueModifier: (v) => v * -1,
    },
    {
      actionId: UnitActionId.RIGHT,
      listenForDeactivation: true,
      keys: [Key.D, Key.ARROW_RIGHT],
      gamepadButtons: [ButtonKey.Right],
      axis: ButtonKey.LeftAxisX,
      axisValidator: (v) => v > 0.1,
    },
    {
      actionId: UnitActionId.JUMP,
      keys: [Key.SPACE],
      gamepadButtons: [ButtonKey.ActionBottom],
    },
  ],

  handlers: [
    {
      actionId: UnitActionId.JUMP,
      callback: ({ unit }) => {
        if (unit.onGround) unit.jump();
      },
    },
  ],
};
