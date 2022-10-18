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
    mass: 1,
  },
  speedReductionByCollision: 0.85,
  maxSpeed: 60,
  maxReverseSpeed: 40,
  accelerationForward: 0.3,
  accelerationBackward: 0.12,
  breakRatio: 0.95,
  damping: 0.985,
  friction: 0.99,
  minAcceleration: 1,
  steeringResetSpeed: 3,
  maxSteeringSpeed: 5,
  maxWheelAngle: Math.PI / 3,
  frontWheelSpeedMultiplier: 1,
  rearWheelSpeedMultiplier: 0.65,
};
