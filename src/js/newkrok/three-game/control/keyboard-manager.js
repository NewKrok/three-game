export const Key = {
  // 0-9
  ...Array.from({ length: 10 }).reduce((prev, _, index) => {
    const key = String.fromCharCode(48 + index);
    return { ...prev, [key]: key };
  }, {}),
  // A-Z
  ...Array.from({ length: 26 }).reduce((prev, _, index) => {
    const key = String.fromCharCode(65 + index);
    return { ...prev, [key]: key.toLowerCase() };
  }, {}),
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  SHIFT: "Shift",
  CONTROL: "Control",
  ALT: "Alt",
  TAB: "Tab",
  SPACE: " ",
  ESCAPE: "Escape",
};

export const createKeyboardManager = () => {
  const states = {};

  const keyDownHandler = (e) => {
    states[e.key.toLowerCase()] = true;
    states[e.key] = true;
  };

  const keyUpHandler = (e) => {
    states[e.key.toLowerCase()] = false;
    states[e.key] = false;
  };

  document.body.addEventListener("keydown", keyDownHandler);
  document.body.addEventListener("keyup", keyUpHandler);

  const dispose = () => {
    document.body.removeEventListener("keydown", keyDownHandler);
    document.body.removeEventListener("keyup", keyUpHandler);
  };

  return {
    getState: (key) => states[key],
    dispose,
  };
};
