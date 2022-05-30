import * as THREE from "three";

import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";

const create = ({ config: { debug } }) => {
  let regions = [];

  let collisionData = {};

  const update = () => {
    Object.entries(collisionData).forEach(([regionId, colliders]) => {
      const region = regions.find(({ id }) => id === regionId);
      Object.values(colliders).forEach(({ collider }) => {
        const prevValue = collisionData[regionId][collider].hasCollision;
        const currentValue = region.box.intersectsBox(collider);
        collisionData[regionId][collider].hasCollision = currentValue;
        if (currentValue)
          collisionData[regionId][collider].collisionListeners.forEach(
            ({ callback }) => callback({ region, collider })
          );
        if (!prevValue && currentValue)
          collisionData[regionId][collider].enterListeners.forEach(
            ({ callback }) => callback({ region, collider })
          );
        if (prevValue && !currentValue)
          collisionData[regionId][collider].leaveListeners.forEach(
            ({ callback }) => callback({ region, collider })
          );
      });
    });
  };

  const startCollisionCheck = (region, collider) => {
    if (collisionData[region.id][collider])
      collisionData[region.id][collider].referenceCount++;
    else
      collisionData[region.id][collider] = {
        collider,
        referenceCount: 1,
        hasCollision: false,
        collisionListeners: [],
        enterListeners: [],
        leaveListeners: [],
      };
  };

  const stopCollisionCheck = (region, collider) => {
    if (collisionData[region.id][collider]) {
      collisionData[region.id][collider].referenceCount--;
      if (collisionData[region.id][collider].referenceCount <= 0)
        delete collisionData[region.id][collider];
    }
  };

  const createListeners = (region) => ({
    on: {
      collision: (collider, callback) => {
        startCollisionCheck(region, collider);
        collisionData[region.id][collider].collisionListeners.push({
          region,
          collider,
          callback,
        });
      },
      enter: (collider, callback) => {
        startCollisionCheck(region, collider);
        collisionData[region.id][collider].enterListeners.push({
          region,
          collider,
          callback,
        });
      },
      leave: (collider, callback) => {
        startCollisionCheck(region, collider);
        collisionData[region.id][collider].leaveListeners.push({
          region,
          collider,
          callback,
        });
      },
    },
    off: {
      collision: (collider, callback) => {
        collisionData[region.id][collider].collisionListeners = collisionData[
          region.id
        ][collider].collisionListeners.filter(
          (element) =>
            element.region === region &&
            element.collider === collider &&
            element.callback === callback
        );
        stopCollisionCheck(region, collider);
      },
      enter: (collider, callback) => {
        collisionData[region.id][collider].collisionListeners = collisionData[
          region.id
        ][collider].collisionListeners.filter(
          (element) =>
            element.region === region &&
            element.collider === collider &&
            element.callback === callback
        );
        stopCollisionCheck(region, collider);
      },
      leave: (collider, callback) => {
        collisionData[region.id][collider].collisionListeners = collisionData[
          region.id
        ][collider].collisionListeners.filter(
          (element) =>
            element.region === region &&
            element.collider === collider &&
            element.callback === callback
        );
        stopCollisionCheck(region, collider);
      },
    },
  });

  const createRegion = ({ id, area }) => {
    if (regions.some(({ id: regionId }) => id === regionId)) {
      console.error(`Region is already exists with id: ${id}`);
      return;
    }

    const box = new THREE.Box3();
    area.geometry.computeBoundingBox();
    box.copy(area.geometry.boundingBox).applyMatrix4(area.matrixWorld);

    if (debug) {
      var boxHelper = new THREE.Box3Helper(box);
      area.parent.add(boxHelper);
    }

    const region = { id, area, box };
    regions.push(region);
    collisionData[id] = {};

    return createListeners(region);
  };

  const dispose = () => {
    regions = [];
    collisionData = {};
  };

  return {
    createRegion,
    update,
    dispose,
  };
};

export const regionModule = {
  id: WorldModuleId.REGION,
  create,
  config: { debug: false },
};
