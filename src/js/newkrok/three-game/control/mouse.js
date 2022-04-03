export const Mouse = {
    LEFT_BUTTON: "LEFT_BUTTON",
    MIDDLE_BUTTON: "MIDDLE_BUTTON",
    RIGHT_BUTTON: "RIGHT_BUTTON",
    SCROLL: "SCROLL",
    SCROLL_UP: "SCROLL_UP",
    SCROLL_DOWN: "SCROLL_DOWN",
    MOVE: "MOVE"
  };

const mouseStates = {};

export const getMouseState = (key) => mouseStates[key];

export const initMouseManager = () => {
  /* document.addEventListener("wheel", ({ deltaY }) => {
    trigger({
      action:
        deltaY > 0 ? UnitAction.CHOOSE_NEXT_TOOL : UnitAction.CHOOSE_PREV_TOOL,
      value: deltaY,
    });
  });
  document.addEventListener("mousemove", ({ movementX, movementY }) => {
    trigger({
      action: UnitAction.RotateCamera,
      value: { x: movementX / 350, y: movementY / 350 },
    });
  }); */
  document.addEventListener("mousedown", (e) => {
    switch (e.button) {
      case 0:
        mouseStates[Mouse.LEFT_BUTTON] = true;
        break;

      case 1:
        mouseStates[Mouse.MIDDLE_BUTTON] = true;
        break;

      case 2:
        mouseStates[Mouse.RIGHT_BUTTON] = true;
        break;

      default:
    }
  });
  document.addEventListener("mouseup", (e) => {
    switch (e.button) {
      case 0:
        mouseStates[Mouse.LEFT_BUTTON] = false;
        break;

      case 1:
        mouseStates[Mouse.MIDDLE_BUTTON] = false;
        break;

      case 2:
        mouseStates[Mouse.RIGHT_BUTTON] = false;
        break;

      default:
    }
  });
};