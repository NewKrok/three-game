export const UnitAction = {
  FORWARD: "FORWARD",
  BACKWARD: "BACKWARD",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  RUN: "RUN",
  JUMP: "JUMP",
  ATTACK: "ATTACK",
  ATTACK_FINISH: "ATTACK_FINISH",
  AIM: "AIM",
  ROTATE_CAMERA: "ROTATE_CAMERA",
  INTERACTION: "INTERACTION",
  PAUSE: "PAUSE",
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
