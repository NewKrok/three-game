import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";
import { getModel } from "@newkrok/three-game/src/js/newkrok/three-game/helpers/asset-helper.js";
import { getUniqueId } from "@newkrok/three-utils/src/js/newkrok/three-utils/token.js";

const create = ({ world: { getUnits, cycleData } }) => {
  let collectibles = [];

  const activate = (collectible, now) => {
    collectible.isInited = true;
    collectible.isCollected = false;
    collectible.lastActivationTime = now;
    collectible.config.collisionObject.parent.add(collectible.model);
  };

  const addCollectible = (config) => {
    config.collisionObject.visible = false;

    const model = getModel(config.model);
    model.position.copy(config.collisionObject.position);

    const collectible = {
      id: getUniqueId(),
      isInited: false,
      initialActivationTime:
        cycleData.now + config.initialActivationDelay * 1000,
      lastActivationTime: cycleData.now,
      lastCollectionTime: 0,
      isCollected: false,
      config,
      model,
    };
    collectibles.push(collectible);

    return collectible;
  };

  const removeCollectible = (collectible) => {
    collectibles = collectibles.filter((element) => element !== collectible);
  };

  const update = ({ isPaused, now }) => {
    if (isPaused) return;

    collectibles.forEach((collectible) => {
      const {
        isInited,
        initialActivationTime,
        isCollected,
        lastCollectionTime,
        config: { reactivationTime, on },
      } = collectible;
      if (isCollected || (!isCollected && !isInited)) {
        if (
          (isInited &&
            reactivationTime !== -1 &&
            now - lastCollectionTime >= reactivationTime * 1000) ||
          (!isInited && now >= initialActivationTime)
        ) {
          activate(collectible, now);
          on.activate?.(collectible);
        }
      } else {
        getUnits().forEach((collector) => {
          const { model: unitModel, collider } = collector;
          const {
            model: collectibleModel,
            config: { interactionRadius, isUserInteractionNeeded, on },
          } = collectible;
          const radius = collider.radius + interactionRadius;
          const radius2 = radius ** 2;
          for (const point of [
            collider.start,
            collider.end,
            unitModel.position,
          ]) {
            const distance = point.distanceToSquared(collectibleModel.position);
            if (distance < radius2) {
              on.interact?.({ collector, collectible });
              if (!isUserInteractionNeeded) {
                collectible.isCollected = true;
                collectible.lastCollectionTime = now;
                collectible.model.parent?.remove(collectible.model);
                on.collect?.({ collector, collectible });
              }
              break;
            }
          }
        });
      }
    });
  };

  const dispose = () => {
    collectibles = [];
  };

  return {
    addCollectible,
    removeCollectible,
    update,
    dispose,
  };
};

export const collectiblesModule = {
  id: WorldModuleId.COLLECTIBLE,
  create,
  config: {},
};
