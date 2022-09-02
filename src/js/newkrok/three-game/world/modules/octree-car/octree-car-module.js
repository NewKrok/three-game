import * as THREE from "three";

import { CallLimits } from "@newkrok/three-utils/src/js/newkrok/three-utils/callback-utils.js";
import { Object3D } from "three";
import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";
import { deepDispose } from "@newkrok/three-utils/src/js/newkrok/three-utils/dispose-utils.js";
import { deepMerge } from "@newkrok/three-utils/src/js/newkrok/three-utils/object-utils.js";
import { getModel } from "@newkrok/three-game/src/js/newkrok/three-game/helpers/asset-helper.js";
import { getUniqueId } from "@newkrok/three-utils/src/js/newkrok/three-utils/token.js";

const create = ({ world: { scene, getModule }, config: { debug } }) => {
  let cars = [];
  const lookAtHelper = new THREE.Vector3();
  const speedVectorHelper = new THREE.Vector3();

  // TODO: handle rotation
  const createCar = ({ id, position = new THREE.Vector3(), config }) => {
    const verletIntegration = getModule(WorldModuleId.VERLET_INTEGRATION);
    const { createSphere } = getModule(WorldModuleId.OCTREE);

    const {
      body: { width, height, length },
      wheel: { radius, mass },
    } = config;

    const frontLeftWheel = createSphere({
      radius,
      position: new THREE.Vector3(
        position.x + length / 2,
        position.y + radius * 2,
        position.z + -width / 2 + radius
      ),
      mass,
    });
    const frontRightWheel = createSphere({
      radius,
      position: new THREE.Vector3(
        position.x + length / 2,
        position.y + radius * 2,
        position.z + width / 2 - radius
      ),
      mass,
    });
    const rearLeftWheel = createSphere({
      radius,
      position: new THREE.Vector3(
        position.x + -length / 2,
        position.y + radius * 2,
        position.z + -width / 2 + radius
      ),
      mass,
    });
    const rearRightWheel = createSphere({
      radius,
      position: new THREE.Vector3(
        position.x + -length / 2,
        position.y + radius * 2,
        position.z + width / 2 - radius
      ),
      mass,
    });

    if (debug) {
      [frontLeftWheel, frontRightWheel, rearLeftWheel, rearRightWheel].forEach(
        (wheel) => {
          wheel.mesh.material.transparent = true;
          wheel.mesh.material.opacity = 0.5;
          scene.add(wheel.mesh);
        }
      );
    }

    verletIntegration.createConstraintGroup({
      constraints: [
        {
          pointA: frontLeftWheel.collider.center,
          pointB: rearLeftWheel.collider.center,
        },
        {
          pointA: frontRightWheel.collider.center,
          pointB: rearRightWheel.collider.center,
        },
        {
          pointA: frontLeftWheel.collider.center,
          pointB: frontRightWheel.collider.center,
        },
        {
          pointA: rearLeftWheel.collider.center,
          pointB: rearRightWheel.collider.center,
        },
        {
          pointA: frontLeftWheel.collider.center,
          pointB: rearRightWheel.collider.center,
        },
        {
          pointA: frontRightWheel.collider.center,
          pointB: rearLeftWheel.collider.center,
        },
      ],
      config: {
        useAutoDistances: true,
      },
    });

    const model = getModel(config.body.model);
    scene.add(model);

    // TODO: handle rotation
    const box = new THREE.Box3(
      new THREE.Vector3(
        position.x + -length / 2,
        position.y + -height / 2,
        position.z + -width / 2
      ),
      new THREE.Vector3(
        position.x + length / 2,
        position.y + height / 2,
        position.z + width / 2
      )
    );

    if (debug) {
      var boxHelper = new THREE.Box3Helper(box);
      scene.add(boxHelper);
    }

    const getWheelMeshFromModel = (keywords) =>
      model.children.find((child) => {
        const name = child.name.toLowerCase();
        return !keywords.some((keyword) => !name.includes(keyword));
      });
    const frontLeftWheelMesh = getWheelMeshFromModel(["front", "left"]);
    const frontRightWheelMesh = getWheelMeshFromModel(["front", "right"]);
    const rearLeftWheelMesh = getWheelMeshFromModel(["rear", "left"]);
    const rearRightWheelMesh = getWheelMeshFromModel(["rear", "right"]);

    const frontLeftWheelContainer = new Object3D();
    frontLeftWheelMesh.parent.add(frontLeftWheelContainer);
    frontLeftWheelContainer.add(frontLeftWheelMesh);
    frontLeftWheelContainer.position.copy(frontLeftWheelMesh.position);
    frontLeftWheelMesh.position.set(0, 0, 0);

    const frontRightWheelContainer = new Object3D();
    frontRightWheelMesh.parent.add(frontRightWheelContainer);
    frontRightWheelContainer.add(frontRightWheelMesh);
    frontRightWheelContainer.position.copy(frontRightWheelMesh.position);
    frontRightWheelMesh.position.set(0, 0, 0);

    const car = {
      id: id ?? getUniqueId(),
      model,
      box,
      config,
      wheels: {
        frontLeftWheel: {
          octreeSphere: frontLeftWheel,
          mesh: frontLeftWheelContainer,
          defaultRotation: frontLeftWheelMesh.rotation.x,
        },
        frontRightWheel: {
          octreeSphere: frontRightWheel,
          mesh: frontRightWheelContainer,
          defaultRotation: frontRightWheelMesh.rotation.x,
        },
        rearLeftWheel: {
          octreeSphere: rearLeftWheel,
          mesh: rearLeftWheelMesh,
          defaultRotation: rearLeftWheelMesh.rotation.x,
        },
        rearRightWheel: {
          octreeSphere: rearRightWheel,
          mesh: rearRightWheelMesh,
          defaultRotation: rearRightWheelMesh.rotation.x,
        },
      },
      wheelDirection: 0,
      currentSpeed: 0,
      realSpeed: 0,
      isAccelerating: false,
      isReversing: false,
      isRotatingToLeft: false,
      isRotatingToRight: false,
    };

    frontLeftWheel.on.collision((result) => {
      if (
        Math.abs(result.normal.x) > 0.01 ||
        Math.abs(result.normal.z) > 0.01
      ) {
        car.currentSpeed *= config.speedReductionByCollision;
      }
    });
    frontRightWheel.on.collision((result) => {
      if (
        Math.abs(result.normal.x) > 0.01 ||
        Math.abs(result.normal.z) > 0.01
      ) {
        car.currentSpeed *= config.speedReductionByCollision;
      }
    });

    const accelerate = () => (car.isAccelerating = !car.isAccelerating);
    const reverse = () => (car.isReversing = !car.isReversing);
    const rotateLeft = () => (car.isRotatingToLeft = !car.isRotatingToLeft);
    const rotateRight = () => (car.isRotatingToRight = !car.isRotatingToRight);

    deepMerge(
      car,
      { accelerate, reverse, rotateLeft, rotateRight },
      { applyToFirstObject: true }
    );
    cars.push(car);

    return car;
  };

  const update = ({ isPaused, delta }) => {
    if (isPaused) return;

    if (cars.length) {
      cars.forEach((car) => {
        const {
          isAccelerating,
          isReversing,
          isRotatingToLeft,
          isRotatingToRight,
          model,
          box,
          config,
          wheels: {
            frontLeftWheel,
            frontRightWheel,
            rearLeftWheel,
            rearRightWheel,
          },
        } = car;

        model.position
          .set(
            frontLeftWheel.octreeSphere.mesh.position.x +
              (rearRightWheel.octreeSphere.mesh.position.x -
                frontLeftWheel.octreeSphere.mesh.position.x) /
                2,
            frontLeftWheel.octreeSphere.mesh.position.y +
              (rearRightWheel.octreeSphere.mesh.position.y -
                frontLeftWheel.octreeSphere.mesh.position.y) /
                2,
            frontLeftWheel.octreeSphere.mesh.position.z +
              (rearRightWheel.octreeSphere.mesh.position.z -
                frontLeftWheel.octreeSphere.mesh.position.z) /
                2
          )
          .add(config.body.offset);

        if (
          rearLeftWheel.octreeSphere.mesh.position.z <
          rearRightWheel.octreeSphere.mesh.position.z
        ) {
          lookAtHelper.copy(frontLeftWheel.octreeSphere.mesh.position);
          lookAtHelper.y =
            frontLeftWheel.octreeSphere.mesh.position.y >
            frontRightWheel.octreeSphere.mesh.position.y
              ? frontLeftWheel.octreeSphere.mesh.position.y
              : frontRightWheel.octreeSphere.mesh.position.y;
          rearLeftWheel.octreeSphere.mesh.lookAt(lookAtHelper);
          model.quaternion.copy(rearLeftWheel.octreeSphere.mesh.quaternion);
        } else {
          lookAtHelper.copy(frontRightWheel.octreeSphere.mesh.position);
          lookAtHelper.y =
            frontLeftWheel.octreeSphere.mesh.position.y <
            frontRightWheel.octreeSphere.mesh.position.y
              ? frontLeftWheel.octreeSphere.mesh.position.y
              : frontRightWheel.octreeSphere.mesh.position.y;
          rearRightWheel.octreeSphere.mesh.lookAt(lookAtHelper);
          model.quaternion.slerp(
            rearRightWheel.octreeSphere.mesh.quaternion,
            5 * delta
          );
          model.quaternion.copy(rearRightWheel.octreeSphere.mesh.quaternion);
        }

        const {
          maxSpeed,
          maxReverseSpeed,
          accelerationForward,
          accelerationBackward,
          breakRatio,
          damping,
          friction,
          minAcceleration,
          steeringResetSpeed,
          maxSteeringSpeed,
          maxWheelAngle,
          frontWheelSpeedMultiplier,
          rearWheelSpeedMultiplier,
        } = config;

        let currentSpeed = car.currentSpeed;
        car.realSpeed = frontLeftWheel.octreeSphere.velocity.length();

        const currentSteering =
          maxSteeringSpeed * Math.log10(1.5 + (1 - currentSpeed / maxSpeed));
        if (isRotatingToLeft) {
          car.wheelDirection -= currentSteering * delta;
        } else if (isRotatingToRight) {
          car.wheelDirection += currentSteering * delta;
        }

        if (!isRotatingToLeft && !isRotatingToRight)
          car.wheelDirection = THREE.MathUtils.lerp(
            car.wheelDirection,
            0,
            steeringResetSpeed * delta
          );

        car.wheelDirection = Math.max(
          -maxWheelAngle,
          Math.min(maxWheelAngle, car.wheelDirection)
        );

        rearLeftWheel.mesh.rotation.x += Math.min(
          0.4,
          (currentSpeed * 55 * delta * Math.PI) / 180
        );
        rearRightWheel.mesh.rotation.x = rearLeftWheel.mesh.rotation.x;

        frontLeftWheel.mesh.children[0].rotation.x =
          rearLeftWheel.mesh.rotation.x;
        frontRightWheel.mesh.children[0].rotation.x =
          rearRightWheel.mesh.rotation.x;

        frontLeftWheel.mesh.rotation.y =
          frontLeftWheel.defaultRotation - car.wheelDirection;
        frontRightWheel.mesh.rotation.y =
          frontRightWheel.defaultRotation - car.wheelDirection;

        if (isAccelerating || isReversing) {
          if (isAccelerating) {
            if (
              currentSpeed < minAcceleration &&
              currentSpeed > -minAcceleration
            )
              currentSpeed = minAcceleration;
            else if (currentSpeed < 0) currentSpeed *= breakRatio;
            else
              currentSpeed +=
                (1 - Math.log(1 + currentSpeed / maxSpeed)) *
                accelerationForward;
            car.currentSpeed = Math.min(currentSpeed, maxSpeed);
          }

          if (isReversing) {
            if (
              currentSpeed < minAcceleration &&
              currentSpeed > -minAcceleration
            )
              currentSpeed = -minAcceleration;
            else if (currentSpeed > 0) currentSpeed *= breakRatio;
            else
              currentSpeed -=
                (1 - Math.log(1 + currentSpeed / maxReverseSpeed)) *
                accelerationBackward;
            car.currentSpeed = Math.max(currentSpeed, -maxReverseSpeed);
          }
        } else {
          car.currentSpeed *= damping;
        }

        speedVectorHelper.set(0, 0, 0);
        frontLeftWheel.mesh.getWorldDirection(speedVectorHelper);
        speedVectorHelper.multiplyScalar(
          car.currentSpeed * delta * frontWheelSpeedMultiplier
        );

        frontLeftWheel.octreeSphere.velocity.multiplyScalar(friction);
        if (frontLeftWheel.octreeSphere.isColliding)
          frontLeftWheel.octreeSphere.velocity.add(speedVectorHelper);
        frontRightWheel.octreeSphere.velocity.multiplyScalar(friction);
        if (frontRightWheel.octreeSphere.isColliding)
          frontRightWheel.octreeSphere.velocity.add(speedVectorHelper);

        speedVectorHelper.set(0, 0, 0);
        model.getWorldDirection(speedVectorHelper);
        speedVectorHelper.multiplyScalar(
          car.currentSpeed * delta * rearWheelSpeedMultiplier
        );

        rearLeftWheel.octreeSphere.velocity.multiplyScalar(friction);
        if (rearLeftWheel.octreeSphere.isColliding)
          rearLeftWheel.octreeSphere.velocity.add(speedVectorHelper);
        rearRightWheel.octreeSphere.velocity.multiplyScalar(friction);
        if (rearRightWheel.octreeSphere.isColliding)
          rearRightWheel.octreeSphere.velocity.add(speedVectorHelper);

        const { width, height, length } = config.body;
        box.min.set(
          -length / 2 + model.position.x,
          0 + model.position.y,
          -width / 2 + model.position.z
        );
        box.max.set(
          length / 2 + model.position.x,
          height + model.position.y,
          width / 2 + model.position.z
        );
      });
    }
  };

  const dispose = () => {
    cars.forEach((car) => deepDispose(car.model));
    cars = [];
  };

  return {
    createCar,
    update,
    dispose,
  };
};

export const octreeCarModule = {
  id: WorldModuleId.OCTREE_CAR,
  create,
  config: {
    debug: false,
    callLimit: CallLimits.CALL_30_PER_SECONDS,
    forceCallCount: true,
  },
};
