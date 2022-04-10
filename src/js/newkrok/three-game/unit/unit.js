import * as THREE from "three";

import {
  getFBXModel,
  getFBXSkeletonAnimation,
} from "@newkrok/three-utils/src/js/newkrok/three-utils/assets/assets.js";

import { Capsule } from "three/examples/jsm/math/capsule.js";
import { ModelSocketId } from "./unit-enums.js";
import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";
import { createModuleHandler } from "../modules/module-handler.js";
import { getUniqueId } from "@newkrok/three-utils/src/js/newkrok/three-utils/token.js";

let positionHelperGeometry;
let positionHelperMaterial;
const createPositionHelper = (target, scale) => {
  const scaleMultiplier = 1 / scale;
  positionHelperGeometry =
    positionHelperGeometry ||
    new THREE.SphereGeometry(0.02 * scaleMultiplier, 8, 8);
  positionHelperMaterial =
    positionHelperMaterial || new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const sphere = new THREE.Mesh(positionHelperGeometry, positionHelperMaterial);
  sphere.add(new THREE.AxesHelper(0.25 * scaleMultiplier));
  target.add(sphere);
};

const DefaultSockets = [
  {
    socketId: ModelSocketId.SPINE,
    modelChildIdList: ["Spine_01"],
  },
  {
    socketId: ModelSocketId.HEAD,
    modelChildIdList: ["Head"],
  },
  {
    socketId: ModelSocketId.LEFT_SHOULDER,
    modelChildIdList: ["Shoulder_L"],
  },
  {
    socketId: ModelSocketId.LEFT_ELBOW,
    modelChildIdList: ["Elbow_L"],
  },
  {
    socketId: ModelSocketId.LEFT_HAND,
    modelChildIdList: ["Hand_L"],
  },
  {
    socketId: ModelSocketId.RIGHT_SHOULDER,
    modelChildIdList: ["Shoulder_R"],
  },
  {
    socketId: ModelSocketId.RIGHT_ELBOW,
    modelChildIdList: ["Elbow_R"],
  },
  {
    socketId: ModelSocketId.RIGHT_HAND,
    modelChildIdList: ["Hand_R"],
  },
];

export const createUnit = ({
  world,
  id,
  position,
  rotation,
  onComplete,
  getWorldModule,
  config,
}) => {
  const instanceId = getUniqueId();
  const moduleHandler = createModuleHandler(config.modules);
  let worldOctree = null;

  const sockets = {};
  const animations = [];
  const registeredObject = {};

  let inAirStartTime = 0;
  let selectedToolId;

  const fbx = getFBXModel(config.model.fbx.id);
  const model = config.model.fbx.childIndex
    ? fbx.children[config.model.fbx.childIndex]
    : fbx;
  model.scale.copy(config.model.scale);
  if (position) model.position.copy(position);

  const mixer = new THREE.AnimationMixer(model);

  const addAnimation = (key) => {
    const anim = getFBXSkeletonAnimation(config.animations[key]);
    const animClip = mixer.clipAction(anim);
    animations[key] = animClip;
  };
  Object.keys(config.animations).forEach((key) => addAnimation(key));

  const neededSockets = DefaultSockets.reduce(
    (prev, current) => {
      if (!prev.some(({ socketId }) => socketId === current.socketId))
        prev.push(current);
      return prev;
    },
    config.sockets.reduce((prev, current) => {
      const defaultReference = DefaultSockets.find(
        ({ socketId }) => socketId === current.socketId
      );
      if (defaultReference) prev.push({ ...defaultReference, ...current });
      else prev.push(current);

      return prev;
    }, [])
  );

  const usedModelPositions = [];
  model.traverse((child) => {
    console.log(child.name);
    neededSockets.forEach((socketData) => {
      if (
        !usedModelPositions[child.name] &&
        socketData.modelChildIdList?.includes(child.name)
      ) {
        socketData.selectedModelChildId = child.name;
        usedModelPositions[child.name] = child;
      }
    });
    config.model?.traverseCallback?.(child);
  });

  neededSockets.forEach(({ socketId, position, selectedModelChildId }) => {
    const socket = new THREE.Object3D();
    position && socket.position.copy(position);
    sockets[socketId] = socket;
    const parent = usedModelPositions[selectedModelChildId] || model;
    parent.add(socket);
    if (config.model.debug.showSockets)
      createPositionHelper(socket, config.model.scale.x);
  });

  if (onComplete) {
    const unit = {
      id,
      instanceId,
      velocity: new THREE.Vector3(),
      playerDirection: new THREE.Vector3(),
      playerCollider: new Capsule(
        position || new THREE.Vector3(0, config.radius, 0),
        position || new THREE.Vector3(0, config.height, 0),
        config.radius
      ),
      onGround: true,
      inAirTime: 0,
      isJumpTriggered: 0,
    };

    /* unit.playerCollider.position.copy(config.position);*/

    const playerCollisions = () => {
      if (!worldOctree)
        worldOctree = getWorldModule(WorldModuleId.OCTREE).worldOctree;
      const result = worldOctree.capsuleIntersect(unit.playerCollider);
      unit.onGround = false;

      if (result) {
        unit.onGround = result.normal.y > 0;
        if (!unit.onGround) {
          unit.velocity.addScaledVector(
            result.normal,
            -result.normal.dot(unit.velocity)
          );
        }

        unit.playerCollider.translate(
          result.normal.multiplyScalar(result.depth)
        );
      }
    };

    const checkGroundState = (now) => {
      if (unit.onGround) {
        inAirStartTime = 0;
        unit.inAirTime = 0;
        unit.isJumpTriggered = false;
      } else if (inAirStartTime === 0) inAirStartTime = now;
      else unit.inAirTime = now - inAirStartTime;
    };

    const update = (cycleData) => {
      const { now, delta } = cycleData;
      if (unit.isShootTriggered && !unit.wasShootTriggered) {
        unit.shootStartTime = now;
        unit.wasShootTriggered = true;
      }

      const GRAVITY = 40;
      let damping = Math.exp(-8 * delta) - 1;
      if (!unit.onGround) {
        unit.velocity.y -= GRAVITY * delta;
        damping *= 0.1;
      }

      /**
       * Solve total collision in multiple steps to avoid wall collision issues
       */
      const stepCount = 3;
      unit.velocity.addScaledVector(unit.velocity.clone(), damping);
      const deltaPosition = unit.velocity.clone().multiplyScalar(delta);
      const velocityStep = deltaPosition.clone().divideScalar(stepCount);
      for (let i = 0; i < stepCount; i++) {
        unit.playerCollider.translate(velocityStep);
        playerCollisions();
      }
      checkGroundState(now);

      unit.playerCollider.getCenter(model.position);
      model.position.y -= config.height / 2 + config.radius / 2;

      moduleHandler.update(cycleData);
    };

    const setRotation = (value) => {
      unit.viewRotation = value;
      model.rotation.y = Math.PI - unit.viewRotation + Math.PI;
    };

    const registerObjectIntoSocket = (props) => {
      const { id, socketId, object } = props;
      const socket = sockets[socketId];
      socket.add(object);
      object.visible = false;
      registeredObject[id] = { object, ...props };
    };

    const hideAllRegisteredObject = () =>
      Object.values(registeredObject).forEach(
        ({ object }) => (object.visible = false)
      );

    if (rotation) setRotation(rotation.z);

    Object.assign(unit, {
      getModule: moduleHandler.getModule,
      addModule: moduleHandler.addModule,
      addModules: (modules) => modules.forEach(moduleHandler.addModule),
      model,
      config,
      mixer,
      isDead: false,
      hasAnimation: true,
      activeAnimation: "",
      animations,
      getSpeed: () =>
        config.speedModifier?.(unit, config.speed) ?? config.speed,
      turn: 0,
      isHanging: false,
      shimmyVelocity: 0,
      strafingDirection: 0,
      viewRotation: 0,
      targetRotation: 0,
      getForwardVector: () => {
        model.getWorldDirection(playerDirection);
        playerDirection.y = 0;
        playerDirection.normalize();
        return playerDirection;
      },
      getSideVector: () => {
        model.getWorldDirection(playerDirection);
        playerDirection.y = 0;
        playerDirection.normalize();
        playerDirection.cross(model.up);
        return playerDirection;
      },
      addVelocity: (value) => unit.velocity.add(value),
      jump: () => {
        unit.velocity.y = config.jumpForce;
        unit.isJumpTriggered = true;
      },
      teleportTo: (position) => unit.playerCollider.translate(position),
      setRotation,
      update,
      getSocket: (socketId) => sockets[socketId],
      registerObjectIntoSocket,
      getRegisteredObject: (id) => registeredObject[id],
      getAllRegisteredObjects: () => Object.values(registeredObject),
      hideAllRegisteredObject,
      registerTools: (tools) => {
        tools.forEach((props) => {
          registerObjectIntoSocket(props);
        });
      },
      chooseTool: (id) => {
        selectedToolId = id;
        hideAllRegisteredObject();
        if (registeredObject[selectedToolId])
          registeredObject[selectedToolId].object.visible = true;
      },
      getSelectedTool: () => registeredObject[selectedToolId],
      updateAimPosition: (position) => aimPosition.copy(position),
      userData: {},
    });
    moduleHandler.init({ world, unit });
    onComplete(unit);
  }
};
