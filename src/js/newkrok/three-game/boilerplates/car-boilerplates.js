import * as THREE from "three";

export const basicCar = {
  body: {
    model: {},
    width: 1.6,
    height: 1.5,
    length: 2.72,
    offset: new THREE.Vector3(),
  },
  wheel: {
    radius: 0.4,
    mass: 50,
  },
  speedReductionByCollision: 0.85,
  maxSpeed: 60,
  maxReverseSpeed: 20,
  accelerationForward: 0.07,
  accelerationBackward: 0.04,
  breakRatio: 0.99,
  damping: 0.998,
  friction: 0.999,
  minAcceleration: 1,
  steeringResetSpeed: 3,
  maxSteeringSpeed: 5,
  maxWheelAngle: Math.PI / 3,
  frontWheelSpeedMultiplier: 1,
  rearWheelSpeedMultiplier: 0.75,
};
