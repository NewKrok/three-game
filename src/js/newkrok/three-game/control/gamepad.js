const controllers = {};
let haveEvents = "ongamepadconnected" in window;

const scanGamepads = () => {
  const gamepads = navigator.getGamepads
    ? navigator.getGamepads()
    : navigator.webkitGetGamepads
    ? navigator.webkitGetGamepads()
    : {};

  Object.keys(gamepads).forEach((key) => {
    const gamepad = gamepads[key];
    if (gamepad) controllers[gamepad.index] = gamepad;
  });
};

export const updateGamePad = () => {
  if (!haveEvents) {
    scanGamepads();
  }
};

const connecthandler = ({ gamepad }) => {
  controllers[gamepad.index] = gamepad;
};

function disconnecthandler({ gamepad }) {
  delete controllers[gamepad.index];
}

export const initGamepadManager = () => {
  window.addEventListener("gamepadconnected", connecthandler);
  window.addEventListener("gamepaddisconnected", disconnecthandler);
};

export const ButtonKey = {
  ActionBottom: 0,
  ActionLeft: 2,
  ActionRight: 1,
  ActionTop: 3,
  LeftTrigger: 6,
  RightTrigger: 7,
  Options: 9,
  LeftAxisButton: 10,
  RightAxisButton: 11,
  Up: 12,
  Down: 13,
  Left: 14,
  Right: 15,
  LeftAxisX: 100,
  LeftAxisY: 101,
  RightAxisX: 102,
  RightAxisY: 103,
};

export const getButtonState = (buttonKey) => {
  const state = { pressed: false, value: 0 };

  Object.keys(controllers).find((key) => {
    const controller = controllers[key];
    let pressed = false;
    let value = 0;
    if (
      [
        ButtonKey.LeftAxisX,
        ButtonKey.LeftAxisY,
        ButtonKey.RightAxisX,
        ButtonKey.RightAxisY,
      ].includes(buttonKey)
    ) {
      const axisKey = buttonKey - 100;
      const axis = controller.axes[axisKey];
      pressed = getButtonState(
        axisKey === ButtonKey.LeftAxisX || axisKey === ButtonKey.LeftAxisY
          ? ButtonKey.LeftAxisButton
          : ButtonKey.RightAxisButton
      ).pressed;
      value = (Math.floor(Math.abs(axis) * 10) / 10) * (axis < 0 ? -1 : 1);
    } else {
      const button = controller.buttons[buttonKey];
      pressed = button === 1;
      value = button;
      if (typeof value == "object") {
        pressed = value.pressed;
        value = value.value;
      }
    }

    state.pressed = pressed;
    state.value = value;
    return pressed;
  });

  return state;
};
