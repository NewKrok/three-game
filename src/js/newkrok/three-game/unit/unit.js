import * as THREE from "three";

import {
  getFBXModel,
  getFBXSkeletonAnimation,
} from "@newkrok/three-utils/src/js/newkrok/three-utils/assets/assets.js";

import { Capsule } from "three/examples/jsm/math/capsule.js";
import { MODULE_ID } from "../modules/modules.js";
import { ModelSocketId } from "./unit-enums.js";

let positionHelperGeometry;
let positionHelperMaterial;
const createPositionHelper = (target, scale) => {
  positionHelperGeometry =
    positionHelperGeometry ||
    new THREE.SphereGeometry(0.02 * (1 / scale), 8, 8);
  positionHelperMaterial =
    positionHelperMaterial || new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const sphere = new THREE.Mesh(positionHelperGeometry, positionHelperMaterial);
  target.add(sphere);
};

const DefaultSockets = [
  {
    socketId: ModelSocketId.SPINE,
    modelChildIdList: ["Spine_01"],
  },
  {
    socketId: ModelSocketId.LEFT_HAND,
    modelChildIdList: ["Hand_L"],
  },
  {
    socketId: ModelSocketId.RIGHT_HAND,
    modelChildIdList: ["Hand_R"],
  },
  {
    socketId: ModelSocketId.PROJECTILE_START,
    modelChildIdList: ["Hand_R"],
  },
];

export const createCharacter = ({
  gravity,
  id,
  position,
  rotation,
  onComplete,
  modules,
  config,
}) => {
  const sockets = {};
  const animations = [];
  const registeredModels = {};

  let selectedToolId;

  const model = getFBXModel(config.model.fbxId);
  model.scale.copy(config.model.scale);
  if (position) model.position.copy(position);

  const mixer = new THREE.AnimationMixer(model);

  const { worldOctree } = modules.find(({ id }) => id === MODULE_ID.OCTREE);

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
    //console.log(child.name);
    neededSockets.forEach((socketData) => {
      if (socketData.modelChildIdList?.includes(child.name)) {
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
    //createPositionHelper(socket, config.scale.x);
  });

  if (onComplete) {
    const unit = {
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

    let inAirStartTime = 0;
    const playerCollisions = ({ now }) => {
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

      if (unit.onGround) {
        inAirStartTime = 0;
        unit.inAirTime = 0;
        unit.isJumpTriggered = false;
      } else if (inAirStartTime === 0) inAirStartTime = now;
      else unit.inAirTime = now - inAirStartTime;
    };

    const onUpdate = ({ now, delta }) => {
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

      unit.velocity.addScaledVector(unit.velocity, damping);
      const deltaPosition = unit.velocity.clone().multiplyScalar(delta);
      unit.playerCollider.translate(deltaPosition);
      playerCollisions({ now });

      unit.playerCollider.getCenter(model.position);
      model.position.y -= config.height / 2 + config.radius / 2;
    };

    const setRotation = (value) => {
      unit.viewRotation = value;
      model.rotation.y = Math.PI - unit.viewRotation + Math.PI;
    };

    const registerModelIntoSocket = ({ id, model, socketId }) => {
      const socket = sockets[socketId];
      socket.add(model);
      model.visible = false;
      registeredModels[id] = model;
    };

    const hideAllRegisteredModels = () =>
      Object.values(registeredModels).forEach(
        (model) => (model.visible = false)
      );

    if (rotation) setRotation(rotation.z);

    Object.assign(unit, {
      id,
      model,
      config,
      mixer,
      isDead: false,
      hasAnimation: true,
      activeAnimation: "",
      animations,
      turn: 0,
      isHanging: false,
      shimmyVelocity: 0,
      isStrafing: false,
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
      update: onUpdate,
      getSocket: (socketId) => sockets[socketId],
      registerModelIntoSocket,
      getRegisteredModel: (id) => registeredModels[id],
      getAllRegisteredModels: () => Object.values(registeredModels),
      hideAllRegisteredModels,
      registerTools: (tools) => {
        tools.forEach(({ id, model, socketId }) => {
          registerModelIntoSocket({
            id,
            model,
            socketId,
          });
        });
      },
      chooseTool: (id) => {
        selectedToolId = id;
        hideAllRegisteredModels();
        if (registeredModels[selectedToolId])
          registeredModels[selectedToolId].visible = true;
      },
      getSelectedTool: () => registeredModels[selectedToolId],
      updateLookAtPosition: ({ position, rotation }) => {
        if (position && rotation) {
          /*sockets[ModelSocketId.SPINE].parent.rotation.z =
            rotation.y - Math.PI / 2;

           const rightHand = sockets[ModelSocketId.RIGHT_HAND].parent;
          rightHand.lookAt(position);
          rightHand.rotateZ(Math.PI / 2);
          rightHand.rotateY(-Math.PI / 2);
          rightHand.rotateX(Math.PI); */
        }
      },
    });
    onComplete(unit);
  }
};
