const WHEELIE_MIN_TIME = 1000;

export const TrickType = {
  WHEELIE: "WHEELIE",
  FLIP: "FLIP",
};

export const createNapeCarTrickCalculator = (car, onTrick) => {
  const props = {
    isOnWheelie: false,
    isBackWheelie: false,
    isOnAir: false,
    onWheelieStartGameTime: 0,
    onAirStartGameTime: 0,
    jumpAngle: 0,
    lastAngleOnGround: 0,
  };

  const checkWheelieState = (elapsed) => {
    const isWheelieInProgress =
      (car.wheels.frontA.onAir && !car.wheels.rearA.onAir) ||
      (!car.wheels.frontA.onAir && car.wheels.rearA.onAir);

    if (
      !isWheelieInProgress &&
      props.isOnWheelie &&
      elapsed - props.onWheelieStartGameTime > WHEELIE_MIN_TIME
    ) {
      onTrick({
        type: TrickType.WHEELIE,
        isBackWheelie: props.isBackWheelie,
        duration: elapsed - props.onWheelieStartGameTime,
      });
    }

    if (isWheelieInProgress && !props.isOnWheelie) {
      props.onWheelieStartGameTime = elapsed;
      props.isBackWheelie = !car.wheels.rearA.onAir;
    }

    props.isOnWheelie = isWheelieInProgress;
  };

  const checkFlipState = (elapsed) => {
    if (car.body.onGround) {
      props.isOnAir = false;
      props.jumpAngle = 0;
      props.lastAngleOnGround = 0;

      return;
    }

    const newIsOnAirValue = car.wheels.rearA.onAir && car.wheels.frontA.onAir;

    if (newIsOnAirValue) {
      let currentAngle = Math.atan2(
        car.wheels.rearA.model.position.y - car.wheels.frontA.model.position.y,
        car.wheels.rearA.model.position.x - car.wheels.frontA.model.position.x
      );
      currentAngle =
        car.wheels.rearA.model.position.x - car.wheels.frontA.model.position.x <
        0
          ? Math.PI * 2 + currentAngle
          : currentAngle;

      while (currentAngle > Math.PI * 2) {
        currentAngle -= Math.PI * 2;
      }

      if (!props.isOnAir) {
        props.onAirStartGameTime = elapsed;
        props.isOnAir = true;
        props.jumpAngle = 0;
        props.lastAngleOnGround = currentAngle;
      }

      let angleDiff = currentAngle - props.lastAngleOnGround;

      if (angleDiff < -Math.PI) {
        angleDiff += Math.PI * 2;
        angleDiff *= -1;
      } else if (angleDiff > Math.PI) {
        angleDiff -= Math.PI * 2;
        angleDiff *= -1;
      }

      props.lastAngleOnGround = currentAngle;
      props.jumpAngle += angleDiff;
    } else if (props.isOnAir) {
      const angleInDeg = props.jumpAngle * (180 / Math.PI);

      props.isOnAir = false;
      props.jumpAngle = 0;
      props.lastAngleOnGround = 0;

      if (angleInDeg > 200 || angleInDeg < -200) {
        onTrick({
          type: TrickType.FLIP,
          isBackFlip: angleInDeg > 0,
          count: Math.floor(Math.abs(angleInDeg / 200)),
        });
      }
    }
  };

  const update = (elapsed) => {
    checkFlipState(elapsed);
    checkWheelieState(elapsed);
  };

  const reset = () => {
    props.isOnWheelie = false;
    props.isBackWheelie = false;
    props.isOnAir = false;
    props.onWheelieStartGameTime = 0;
    props.onAirStartGameTime = 0;
    props.jumpAngle = 0;
    props.lastAngleOnGround = 0;
  };

  return {
    update,
    reset,
  };
};
