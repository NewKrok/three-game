export const basicNapeCar = {
  filter: {
    group: 2,
    mask: 1,
  },
  body: {
    model: {},
    width: 110,
    height: 25,
    depth: 3.8,
    hitAreaHeight: 5,
  },
  wheels: {
    joinDamping: 0.2,
    joinHertz: 3.5,
    front: {
      model: {},
      offset: {
        x: 39,
        y: 32,
      },
      radius: 20,
    },
    rear: {
      model: {},
      offset: {
        x: -39,
        y: 32,
      },
      radius: 20,
    },
  },
  pixelRatio: 17,
  accelerationForward: 25,
  accelerationBackward: 15,
  leaningForward: 700,
  leaningBack: 700,
};
