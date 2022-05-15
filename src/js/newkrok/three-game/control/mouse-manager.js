export const Mouse = {
  LEFT_BUTTON: "LEFT_BUTTON",
  MIDDLE_BUTTON: "MIDDLE_BUTTON",
  RIGHT_BUTTON: "RIGHT_BUTTON",
  SCROLL: "SCROLL",
  SCROLL_UP: "SCROLL_UP",
  SCROLL_DOWN: "SCROLL_DOWN",
};

export const createMouseManager = () => {
  const states = {};

  const wheelHandler = ({ deltaY }) => {
    states[Mouse.SCROLL_DOWN] = deltaY > 0;
    states[Mouse.SCROLL_UP] = deltaY < 0;
  };

  const mouseDownHandler = (e) => {
    switch (e.button) {
      case 0:
        states[Mouse.LEFT_BUTTON] = true;
        break;

      case 1:
        states[Mouse.MIDDLE_BUTTON] = true;
        break;

      case 2:
        states[Mouse.RIGHT_BUTTON] = true;
        break;

      default:
    }
  };

  const mouseUpHandler = (e) => {
    switch (e.button) {
      case 0:
        states[Mouse.LEFT_BUTTON] = false;
        break;

      case 1:
        states[Mouse.MIDDLE_BUTTON] = false;
        break;

      case 2:
        states[Mouse.RIGHT_BUTTON] = false;
        break;

      default:
    }
  };

  document.addEventListener("wheel", wheelHandler);
  document.addEventListener("mousedown", mouseDownHandler);
  document.addEventListener("mouseup", mouseUpHandler);

  const dispose = () => {
    document.removeEventListener("wheel", wheelHandler);
    document.removeEventListener("mousedown", mouseDownHandler);
    document.removeEventListener("mouseup", mouseUpHandler);
  };

  const reset = () => {
    states[Mouse.SCROLL_DOWN] = false;
    states[Mouse.SCROLL_UP] = false;
  };

  return {
    getState: (key) => states[key],
    dispose,
    reset,
  };
};
