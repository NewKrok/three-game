import * as THREE from "three";

import {
  getFBXModel,
  getFBXSkeletonAnimation,
} from "../../three-utils/assets/assets.js";

import { Capsule } from "three/examples/jsm/math/capsule";
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
    modelChildIdList: ["Bip001_Spine1"],
  },
  {
    socketId: ModelSocketId.LEFT_HAND,
    modelChildIdList: ["Bip001_L_Hand"],
  },
  {
    socketId: ModelSocketId.RIGHT_HAND,
    modelChildIdList: ["Bip001_R_Hand"],
  },
  {
    socketId: ModelSocketId.PROJECTILE_START,
    modelChildIdList: ["Bip001_R_Hand"],
  },
  {
    socketId: ModelSocketId.PROJECTILE_START,
    modelChildIdList: ["Bip001_R_Hand"],
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

  const model = getFBXModel(config.fbxModelId);
  model.scale.copy(config.scale);
  model.position.copy(position);

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
    /* console.log(child.name); */
    neededSockets.forEach((socketData) => {
      if (socketData.modelChildIdList?.includes(child.name)) {
        socketData.selectedModelChildId = child.name;
        usedModelPositions[child.name] = child;
      }
    });
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
    const character = {
      velocity: new THREE.Vector3(),
      playerDirection: new THREE.Vector3(),
      playerCollider: new Capsule(
        new THREE.Vector3(position.x, config.radius, position.z),
        new THREE.Vector3(position.x, config.height, position.z),
        config.radius
      ),
      onGround: true,
      inAirTime: 0,
      isJumpTriggered: 0,
    };

    /* character.playerCollider.position.copy(config.position);
    character.playerCollider.rotation.copy(config.rotation); */

    let inAirStartTime = 0;
    const playerCollisions = ({ now }) => {
      const result = worldOctree.capsuleIntersect(character.playerCollider);
      character.onGround = false;

      if (result) {
        character.onGround = result.normal.y > 0;
        if (!character.onGround) {
          character.velocity.addScaledVector(
            result.normal,
            -result.normal.dot(character.velocity)
          );
        }

        character.playerCollider.translate(
          result.normal.multiplyScalar(result.depth)
        );
      }

      if (character.onGround) {
        inAirStartTime = 0;
        character.inAirTime = 0;
        character.isJumpTriggered = false;
      } else if (inAirStartTime === 0) inAirStartTime = now;
      else character.inAirTime = now - inAirStartTime;
    };

    const onUpdate = ({ now, delta }) => {
      if (character.isShootTriggered && !character.wasShootTriggered) {
        character.shootStartTime = now;
        character.wasShootTriggered = true;
      }

      const GRAVITY = 40;
      let damping = Math.exp(-8 * delta) - 1;
      if (!character.onGround) {
        character.velocity.y -= GRAVITY * delta;
        damping *= 0.1;
      }

      character.velocity.addScaledVector(character.velocity, damping);
      const deltaPosition = character.velocity.clone().multiplyScalar(delta);
      character.playerCollider.translate(deltaPosition);
      playerCollisions({ now });

      character.playerCollider.getCenter(model.position);
      model.position.y -= config.height / 2 + config.radius / 2;
    };

    Object.assign(character, {
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
      addVelocity: (value) => character.velocity.add(value),
      jump: () => {
        character.velocity.y = config.jumpForce;
        character.isJumpTriggered = true;
      },
      teleportTo: (position) => character.playerCollider.translate(position),
      setRotation: (rotation) => {
        character.viewRotation = rotation;
        character.model.rotation.y = Math.PI - character.viewRotation + Math.PI;
      },
      getSocket: (socketId) => sockets[socketId],
      update: onUpdate,
      updateLookAtPosition: ({ position, rotation }) => {
        if (position && rotation) {
          sockets[ModelSocketId.SPINE].parent.rotation.z =
            rotation.y - Math.PI / 2;

          const rightHand = sockets[ModelSocketId.RIGHT_HAND].parent;
          rightHand.lookAt(position);
          rightHand.rotateZ(Math.PI / 2);
          rightHand.rotateY(-Math.PI / 2);
          rightHand.rotateX(Math.PI);
        }
      },
    });
    onComplete(character);
  }
};
