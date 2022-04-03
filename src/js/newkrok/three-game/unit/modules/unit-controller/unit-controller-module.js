import {
    getButtonState,
    initGamepadManager,
    updateGamePad,
} from "@newkrok/three-game/src/js/newkrok/three-game/control/gamepad.js";
import {
    getKeyState,
    initKeyboardManager
} from "@newkrok/three-game/src/js/newkrok/three-game/control/keyboard.js";
import {
  getMouseState,
  initMouseManager
} from "@newkrok/three-game/src/js/newkrok/three-game/control/mouse.js";

import {UnitModuleId} from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";

const create = ({ world, unit, config:{actionConfig, handlers} }) => {
    initKeyboardManager();
    initMouseManager();
    initGamepadManager();
    
    const actionStates = {};

    actionConfig.forEach((props) => {
      actionStates[props.actionId] = {pressed: false, value: 0, ...props};
    })
    const trigger = ({ actionId, value }) => {
      handlers.forEach(
        (entry) =>
          entry.actionId === actionId &&
            entry.callback({unit, value, world})
      );
    };

    const calculateState = ({
      prevState,
      axis,
      actionId,
      axisValidator = (v) => v != 0,
      axisValueModifier = (v) => v,
    }) => {
      const axisValue = axis ? getButtonState(axis).value : 0;
      const validatedAxisValue = axis ? axisValidator(axisValue) : false;
      const pressed = prevState.keys?.some(key => getKeyState(key)) || prevState.mouse?.some(key => getMouseState(key)) || prevState.gamepadButtons?.some(gamepadButton => getButtonState(gamepadButton).pressed);
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
    
      if ((prevState.listenForDeactivation && newState.pressed != prevState.pressed) || (!prevState.wlistenForDeactivation && newState.pressed && newState.pressed != prevState.pressed)) {
        trigger({ actionId, value });
      }
      
      return newState;
    };

    return {
        update: () => { 
          updateGamePad();
          Object.keys(actionStates).forEach((actionId) =>
            actionStates[actionId] = calculateState({
              prevState: actionStates[actionId],
              actionId,
            })
          );
        }
    }
};

export const unitControllerModule = {
  id: UnitModuleId.UNIT_CONTROLLER,
  create,
  config: {},
};