import * as THREE from "three";

import {
  getFBXModel,
  getFBXSkeletonAnimation,
} from "@newkrok/three-utils/src/js/newkrok/three-utils/assets/assets.js";

import { ModelSocketId } from "@newkrok/three-game/src/js/newkrok/three-game/world/modules/units/unit/unit-enums.js";
import { Player } from "@newkrok/three-game/src/js/newkrok/three-game/players/players-enums.js";
import { createModuleHandler } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-handler.js";
import { deepDispose } from "@newkrok/three-utils/src/js/newkrok/three-utils/dispose-utils.js";
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

export const createUnit = ({ world, id, owner = Player.PLAYER_1, position, rotation, config }) => {
  const container = new THREE.Object3D();
  const instanceId = getUniqueId();
  const moduleHandler = createModuleHandler(config.modules);

  const sockets = {};
  const animations = [];
  const registeredObjects = {};
  const box = new THREE.Box3(
    new THREE.Vector3(-config.radius, 0, -config.radius),
    new THREE.Vector3(config.radius, config.height, config.radius)
  );

  let selectedToolId;

  const fbx = getFBXModel(config.model.fbx.id);
  const model = config.model.fbx.childIndex
    ? fbx.children[config.model.fbx.childIndex]
    : fbx;
  model.scale.copy(config.model.scale);
  container.add(model);
  if (position) container.position.copy(position);

  // TODO: should be configurable?
  /*
  var boxHelper = new THREE.Box3Helper( box );
	world.scene.add( boxHelper );
  */

  const mixer = Object.keys(config.animations).length
    ? new THREE.AnimationMixer(model)
    : null;

  const addAnimation = (key) => {
    const anim = getFBXSkeletonAnimation(config.animations[key]);
    if (!anim) return;
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

  const unit = {
    id,
    instanceId,
    playerDirection: new THREE.Vector3(),
    box,
  };

  const update = (cycleData) => {
    box.min.set(
      -config.radius + container.position.x,
      0 + container.position.y,
      -config.radius + container.position.z
    );
    box.max.set(
      config.radius + container.position.x,
      config.height + container.position.y,
      config.radius + container.position.z
    );

    moduleHandler.update(cycleData);
  };

  const setRotation = (value) => {
    unit.viewRotation = value;
    container.rotation.y = Math.PI - unit.viewRotation + Math.PI;
  };

  const registerObjectIntoSocket = (props) => {
    const { id, socketId, object } = props;
    const socket = sockets[socketId];
    socket.add(object);
    object.visible = false;
    registeredObjects[id] = { object, ...props };
  };

  const hideAllRegisteredObjects = () =>
    Object.values(registeredObjects).forEach(
      ({ object }) => (object.visible = false)
    );

  if (rotation) setRotation(rotation.z);

  const dispose = () => {
    Object.values(registeredObjects).forEach(({ object }) =>
      deepDispose(object)
    );
    deepDispose(container);
    moduleHandler.dispose();
    moduleHandler = null;
  };

  Object.assign(unit, {
    getModule: moduleHandler.getModule,
    addModule: moduleHandler.addModule,
    addModules: (modules) => modules.forEach(moduleHandler.addModule),
    container,
    model,
    collider: null,
    config,
    owner,
    mixer,
    isDead: false,
    hasAnimation: true,
    activeAnimation: "",
    animations,
    getSpeed: () => config.speedModifier?.(unit, config.speed) ?? config.speed,
    shimmyVelocity: 0,
    strafingDirection: 0,
    viewRotation: 0,
    targetRotation: 0,
    getForwardVector: () => {
      container.getWorldDirection(unit.playerDirection);
      unit.playerDirection.y = 0;
      unit.playerDirection.normalize();
      return unit.playerDirection;
    },
    getSideVector: () => {
      container.getWorldDirection(unit.playerDirection);
      unit.playerDirection.y = 0;
      unit.playerDirection.normalize();
      unit.playerDirection.cross(container.up);
      return unit.playerDirection;
    },
    setRotation,
    update,
    getSocket: (socketId) => sockets[socketId],
    registerObjectIntoSocket,
    getRegisteredObject: (id) => registeredObjects[id],
    getAllRegisteredObjects: () => Object.values(registeredObjects),
    hideAllRegisteredObjects,
    registerTools: (tools) => {
      tools.forEach((props) => {
        registerObjectIntoSocket(props);
      });
    },
    chooseTool: (id) => {
      selectedToolId = id;
      hideAllRegisteredObjects();
      if (registeredObjects[selectedToolId])
        registeredObjects[selectedToolId].object.visible = true;
    },
    getSelectedTool: () => registeredObjects[selectedToolId],
    updateAimPosition: (position) => aimPosition.copy(position),
    userData: {},
    dispose,
  });
  moduleHandler.init({ world, unit, id: instanceId });

  return unit;
};
