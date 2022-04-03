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
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  Shift: "Shift",
  Control: "Control",
  Alt: "Alt",
  Tab: "Tab",
  Space: " ",
  Escape: "Escape",
};
const keyStates = {};

export const getKeyState = (key) => keyStates[key];

export const initKeyboardManager = () => {
  document.body.addEventListener("keydown", (e) => {
    keyStates[e.key.toLowerCase()] = true;
    keyStates[e.key] = true;
  });
  document.body.addEventListener("keyup", (e) => {
    keyStates[e.key.toLowerCase()] = false;
    keyStates[e.key] = false;
  });
};
