import {
  getButtonState,
  initGamepadManager,
  updateGamePad,
} from "@newkrok/three-game/src/js/newkrok/three-game/control/gamepad.js";

import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";
import { createKeyboardManager } from "@newkrok/three-game/src/js/newkrok/three-game/control/keyboard-manager.js";
import { createMouseManager } from "@newkrok/three-game/src/js/newkrok/three-game/control/mouse-manager.js";

const create = ({ world, config: { actionConfig, handlers } }) => {
  let isControlPaused = false;
  let target;

  const trigger = ({ actionId, value }) => {
    if (
      (target && !world.cycleData.isPaused) ||
      actionStates[actionId].enableDuringPause
    )
      handlers.forEach(
        (entry) =>
          entry.actionId === actionId &&
          entry.callback({ target, value, world })
      );
  };

  const actionStates = {};
  actionConfig.forEach((props) => {
    if (props.customTrigger)
      props.customTrigger((value) => {
        trigger({ actionId: props.actionId, value });
      });
    actionStates[props.actionId] = { pressed: false, value: 0, ...props };
  });

  const keyboardManager = createKeyboardManager();
  const mouseManager = createMouseManager();
  initGamepadManager();

  const calculateState = ({
    prevState,
    axis,
    actionId,
    axisValidator = (v) => v != 0,
    axisValueModifier = (v) => v,
  }) => {
    const axisValue = axis ? getButtonState(axis).value : 0;
    const validatedAxisValue = axis ? axisValidator(axisValue) : false;
    const pressed =
      prevState.keys?.some((key) => keyboardManager.getState(key)) ||
      prevState.mouse?.some((key) => mouseManager.getState(key)) ||
      prevState.gamepadButtons?.some(
        (gamepadButton) => getButtonState(gamepadButton).pressed
      );
    const value = validatedAxisValue
      ? axisValueModifier(axisValue)
      : pressed
      ? 1
      : 0;
    const newState = {
      ...prevState,
      pressed: pressed || validatedAxisValue,
      value,
    };

    if (
      (prevState.listenForDeactivation &&
        newState.pressed != prevState.pressed) ||
      (!prevState.listenForDeactivation &&
        newState.pressed &&
        newState.pressed != prevState.pressed)
    ) {
      trigger({ actionId, value });
    }

    return newState;
  };

  return {
    setTarget: (value) => (target = value),
    getTarget: () => target,
    update: ({ isPaused }) => {
      if (isControlPaused) return;
      updateGamePad();
      Object.keys(actionStates).forEach((actionId) => {
        if (!isPaused || actionStates[actionId].enableDuringPause)
          actionStates[actionId] = calculateState({
            prevState: actionStates[actionId],
            actionId,
          });
      });
      mouseManager.reset();
    },
    pause: () => (isControlPaused = true),
    resume: () => (isControlPaused = false),
    dispose: () => {
      keyboardManager.dispose();
      mouseManager.dispose();
    },
  };
};

export const playerControllerModule = {
  id: WorldModuleId.PLAYER_CONTROLLER,
  create,
  config: {},
};
