import * as THREE from "three";

import { CallLimits } from "@newkrok/three-utils/src/js/newkrok/three-utils/callback-utils.js";
import { Capsule } from "three/examples/jsm/math/capsule.js";
import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";
import { createNapeCarTrickCalculator } from "./nape-car-trick-calculator.js";
import { deepDispose } from "@newkrok/three-utils/src/js/newkrok/three-utils/dispose-utils.js";
import { getModel } from "@newkrok/three-game/src/js/newkrok/three-game/helpers/asset-helper.js";
import { getUniqueId } from "@newkrok/three-utils/src/js/newkrok/three-utils/token.js";

const createWheel = ({ position, space, filter, radius, offset }) => {
  const wheel = new nape.phys.Body();
  wheel
    .get_shapes()
    .add(
      new nape.shape.Circle(
        radius,
        null,
        new nape.phys.Material(0.1, 5, 5, 1.5, 20)
      )
    );
  wheel.setShapeFilters(filter);
  wheel.get_position().set_x(position.x + offset.x);
  wheel.get_position().set_y(position.y + offset.y);
  wheel.set_space(space);
  wheel.set_mass(1);

  return wheel;
};

const create = ({ world: { scene, getModule }, config: { debug } }) => {
  let cars = [];
  let filter;

  const createCar = ({ id, position = new THREE.Vector3(), config }) => {
    const { space } = getModule(WorldModuleId.NAPE);

    if (!filter) {
      filter = new nape.dynamics.InteractionFilter();
      filter.set_collisionGroup(config.filter.group);
      filter.set_collisionMask(config.filter.mask);
    }

    const wheelRightPhysics = createWheel({
      space,
      position,
      filter,
      ...config.wheels.front,
    });
    const wheelLeftPhysics = createWheel({
      space,
      position,
      filter,
      ...config.wheels.rear,
    });

    const carBodyPolygon = [
      new nape.geom.Vec2(-config.body.width / 2, -config.body.height / 2),
      new nape.geom.Vec2(-config.body.width / 4, -config.body.height),
      new nape.geom.Vec2(config.body.width / 4, -config.body.height),
      new nape.geom.Vec2(config.body.width / 2, -config.body.height / 2),
      new nape.geom.Vec2(config.body.width / 2, config.body.height / 2),
      new nape.geom.Vec2(-config.body.width / 2, config.body.height / 2),
    ];

    const carBodyPhysics = new nape.phys.Body();
    carBodyPhysics.get_shapes().add(new nape.shape.Polygon(carBodyPolygon));
    carBodyPhysics.setShapeFilters(filter);
    carBodyPhysics.get_position().set_x(position.x);
    carBodyPhysics.get_position().set_y(position.y);
    carBodyPhysics.set_space(space);
    carBodyPhysics.set_mass(1);

    var hitAreaPadding = 2;
    var hitAreaPolygon = [
      new nape.geom.Vec2(
        -config.body.width / 2 + hitAreaPadding,
        -config.body.height / 2 - hitAreaPadding
      ),
      new nape.geom.Vec2(
        -config.body.width / 4,
        -config.body.height - hitAreaPadding
      ),
      new nape.geom.Vec2(
        config.body.width / 4,
        -config.body.height - hitAreaPadding
      ),
      new nape.geom.Vec2(
        config.body.width / 2 - hitAreaPadding,
        -config.body.height / 2 - hitAreaPadding
      ),
      new nape.geom.Vec2(
        config.body.width / 2 - hitAreaPadding,
        config.body.height / 2 - hitAreaPadding
      ),
      new nape.geom.Vec2(
        -config.body.width / 2 + hitAreaPadding,
        config.body.height / 2 - hitAreaPadding
      ),
    ];

    const hitArea = new nape.phys.Body();
    hitArea.get_shapes().add(new nape.shape.Polygon(hitAreaPolygon));
    hitArea.setShapeFilters(filter);
    hitArea.set_space(space);
    hitArea.set_mass(1);

    const hitAreaAnchor = new nape.geom.Vec2(0, 0);
    const hitJoin = new nape.constraint.WeldJoint(
      carBodyPhysics,
      hitArea,
      carBodyPhysics.get_localCOM(),
      hitAreaAnchor
    );
    hitJoin.set_space(space);

    const bodyLeftAnchor = new nape.geom.Vec2(
      config.wheels.rear.offset.x,
      config.wheels.rear.offset.y
    );
    const pivotJointLeftLeftWheel = new nape.constraint.PivotJoint(
      wheelLeftPhysics,
      carBodyPhysics,
      wheelLeftPhysics.get_localCOM(),
      bodyLeftAnchor
    );
    pivotJointLeftLeftWheel.set_stiff(false);
    pivotJointLeftLeftWheel.set_damping(config.wheels.joinDamping);
    pivotJointLeftLeftWheel.set_frequency(config.wheels.joinHertz);
    pivotJointLeftLeftWheel.set_space(space);

    const bodyRightAnchor = new nape.geom.Vec2(
      config.wheels.front.offset.x,
      config.wheels.front.offset.y
    );
    const pivotJointRightRightWheel = new nape.constraint.PivotJoint(
      wheelRightPhysics,
      carBodyPhysics,
      wheelRightPhysics.get_localCOM(),
      bodyRightAnchor
    );
    pivotJointRightRightWheel.set_stiff(false);
    pivotJointRightRightWheel.set_damping(config.wheels.joinDamping);
    pivotJointRightRightWheel.set_frequency(config.wheels.joinHertz);
    pivotJointRightRightWheel.set_space(space);

    const distance =
      config.wheels.front.offset.x + Math.abs(config.wheels.rear.offset.x);
    const wheelJoin = new nape.constraint.DistanceJoint(
      wheelRightPhysics,
      wheelLeftPhysics,
      wheelRightPhysics.get_localCOM(),
      wheelLeftPhysics.get_localCOM(),
      distance,
      distance
    );
    wheelJoin.set_space(space);

    const car = {
      id: id || getUniqueId(),
      userData: {},
      config,
      isAccelerating: false,
      isReversing: false,
      isLeaningBack: false,
      isLeaningForward: false,
      collider: new Capsule(
        new THREE.Vector3(),
        new THREE.Vector3(),
        config.body.height
      ),
      body: {
        model: getModel(config.body.model),
        physics: carBodyPhysics,
        hitArea,
        onGround: false,
      },
      wheels: {
        frontA: {
          model: getModel(config.wheels.front.model),
          physics: wheelRightPhysics,
          onAir: true,
        },
        frontB: {
          model: getModel(config.wheels.front.model),
        },
        rearA: {
          model: getModel(config.wheels.rear.model),
          physics: wheelLeftPhysics,
          onAir: true,
        },
        rearB: {
          model: getModel(config.wheels.rear.model),
        },
      },
    };

    car.wheels.frontA.model.position.set(0, 0, config.body.depth / 2);
    car.wheels.frontB.model.position.set(0, 0, -config.body.depth / 2);
    car.wheels.rearA.model.position.set(0, 0, config.body.depth / 2);
    car.wheels.rearB.model.position.set(0, 0, -config.body.depth / 2);

    [
      car.body.model,
      car.wheels.frontA.model,
      car.wheels.frontB.model,
      car.wheels.rearA.model,
      car.wheels.rearB.model,
    ].forEach((model) => {
      scene.add(model);
    });

    const onTrick = (trick) => config.on.trick?.(trick);
    car.trickCalculator = createNapeCarTrickCalculator(car, onTrick);

    cars.push(car);

    return car;
  };

  const update = ({ elapsed, isPaused }) => {
    if (isPaused) return;

    cars.forEach((car) => {
      if (car.isAccelerating && !car.isReversing) {
        car.wheels.rearA.physics.set_angularVel(
          Math.max(
            car.config.accelerationForward,
            car.wheels.rearA.physics.get_angularVel()
          )
        );
        car.wheels.frontA.physics.set_angularVel(
          Math.max(
            car.config.accelerationForward,
            car.wheels.frontA.physics.get_angularVel()
          )
        );
      } else if (!car.isAccelerating && car.isReversing) {
        car.wheels.rearA.physics.set_angularVel(
          Math.min(
            -car.config.accelerationBackward,
            car.wheels.rearA.physics.get_angularVel()
          )
        );
        car.wheels.frontA.physics.set_angularVel(
          Math.min(
            -car.config.accelerationBackward,
            car.wheels.frontA.physics.get_angularVel()
          )
        );
      }

      if (car.isLeaningBack)
        car.body.physics.applyAngularImpulse(-car.config.leaningBack);
      if (car.isLeaningForward)
        car.body.physics.applyAngularImpulse(car.config.leaningForward);

      car.body.model.position.set(
        car.body.physics.get_position().get_x() / car.config.pixelRatio,
        -car.body.physics.get_position().get_y() / car.config.pixelRatio,
        0
      );
      car.body.model.rotation.z = -car.body.physics.get_rotation();

      car.wheels.frontA.model.position.set(
        car.wheels.frontA.physics.get_position().get_x() /
          car.config.pixelRatio,
        -car.wheels.frontA.physics.get_position().get_y() /
          car.config.pixelRatio,
        car.wheels.frontA.model.position.z
      );
      car.wheels.frontB.model.position.set(
        car.wheels.frontA.model.position.x,
        car.wheels.frontA.model.position.y,
        car.wheels.frontB.model.position.z
      );
      car.wheels.frontA.model.rotation.z = car.wheels.frontB.model.rotation.z =
        -car.wheels.frontA.physics.get_rotation();

      car.wheels.rearA.model.position.set(
        car.wheels.rearA.physics.get_position().get_x() / car.config.pixelRatio,
        -car.wheels.rearA.physics.get_position().get_y() /
          car.config.pixelRatio,
        car.wheels.rearA.model.position.z
      );
      car.wheels.rearB.model.position.set(
        car.wheels.rearA.model.position.x,
        car.wheels.rearA.model.position.y,
        car.wheels.rearB.model.position.z
      );
      car.wheels.rearA.model.rotation.z = car.wheels.rearB.model.rotation.z =
        -car.wheels.rearA.physics.get_rotation();

      const rearContactList = car.wheels.rearA.physics.interactingBodies();
      car.wheels.rearA.onAir = true;
      while (!rearContactList.empty()) {
        var obj = rearContactList.pop();
        if (obj != car.body.physics) {
          car.wheels.rearA.onAir = false;
          break;
        }
      }

      const frontContactList = car.wheels.frontA.physics.interactingBodies();
      car.wheels.frontA.onAir = true;
      while (!frontContactList.empty()) {
        var obj = frontContactList.pop();
        if (obj != car.body.physics) {
          car.wheels.frontA.onAir = false;
          break;
        }
      }

      const bodyContactList = car.body.hitArea.interactingBodies(
        nape.callbacks.InteractionType.COLLISION,
        1
      );
      car.body.onGround = false;
      while (!bodyContactList.empty()) {
        var obj = bodyContactList.pop();
        if (
          obj != car.body.physics &&
          obj != car.wheels.rearA.physics &&
          obj != car.wheels.frontA.physics
        ) {
          car.body.onGround = true;
          break;
        }
      }

      car.collider.set(
        car.wheels.rearA.model.position,
        car.wheels.frontA.model.position,
        car.config.body.height
      );
      car.trickCalculator.update(elapsed);
    });
  };

  const dispose = () => {
    cars.forEach((car) => deepDispose(car));
    cars = [];
  };

  return {
    createCar,
    update,
    dispose,
  };
};

export const napeCarModule = {
  id: WorldModuleId.NAPE_CAR,
  create,
  config: {
    debug: false,
    callLimit: CallLimits.CALL_60_PER_SECONDS,
    forceCallCount: true,
  },
};
