import * as THREE from "three";

import { CallLimits } from "@newkrok/three-utils/src/js/newkrok/three-utils/callback-utils.js";
import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";

const create = ({ world: { scene, cycleData }, config }) => {
  let collisionDetectors = config.collisionDetectors || [];
  const projectileGeometry = new THREE.SphereGeometry(0.02, 8, 8);
  const projectileMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff });

  let projectiles = [];
  let bulletIndex = 0;

  const vectorHelper = new THREE.Vector3();

  const update = ({ delta }) => {
    const projectilesToRemove = [];

    projectiles.forEach(({ mesh, collider, direction, config, userData }) => {
      const collisionStep = 2 * delta;
      vectorHelper.copy(direction);
      let vector = vectorHelper.setLength(collisionStep);

      let maxDistance = config.speed * delta;
      let distance = 0;
      while (
        distance < maxDistance &&
        !collisionDetectors.some((collisionDetector) =>
          collisionDetector({ collider, userData })
        )
      ) {
        distance += collisionStep;
        collider.center.add(vector);
      }
      collider.center.sub(vector);

      if (distance < maxDistance) {
        projectilesToRemove.push(mesh);
        config?.on?.collision({ mesh, position: collider.center, userData });
      }
      mesh.position.copy(collider.center);
    });

    projectiles = projectiles.filter(({ mesh, bornTime, config, userData }) => {
      const old = cycleData.now - bornTime > config.lifeTime;
      const isCollided = projectilesToRemove.includes(mesh);
      if (old || isCollided) {
        config?.on?.destroy({ mesh, userData });
        scene.remove(mesh);
      }

      return !old && !isCollided;
    });
  };

  const shoot = ({
    startPosition = null,
    direction,
    scene,
    mesh,
    config,
    userData = null,
  }) => {
    const selectedMesh =
      mesh || new THREE.Mesh(projectileGeometry, projectileMaterial);
    if (!mesh) {
      selectedMesh.castShadow = true;
      selectedMesh.receiveShadow = false;
    }
    if (startPosition) selectedMesh.position.copy(startPosition);
    if (scene) scene.add(selectedMesh);

    const collider = new THREE.Sphere(selectedMesh.position.clone(), 0.02);

    config?.on?.shoot({ mesh: selectedMesh });

    projectiles.push({
      id: bulletIndex++,
      bornTime: cycleData.now,
      mesh: selectedMesh,
      collider,
      direction,
      config,
      userData,
    });
  };

  const addCollisionDetector = (collisionDetector) =>
    collisionDetectors.push(collisionDetector);
  const removeCollisionDetector = (collisionDetector) =>
    (collisionDetectors = collisionDetectors.filter(
      (entry) => entry !== collisionDetector
    ));

  const dispose = () => {
    projectiles.forEach(({ mesh }) => {
      mesh.dispose();
      mesh.material.dispose();
      mesh.geometry.dispose();
      scene.remove(mesh);
    });

    collisionDetectors = null;

    projectileGeometry.dispose();
    projectileMaterial.dispose();
  };

  return {
    update,
    shoot,
    addCollisionDetector,
    removeCollisionDetector,
    dispose,
  };
};

export const projectilesModule = {
  id: WorldModuleId.PROJECTILES,
  create,
  config: {
    callLimit: CallLimits.CALL_30_PER_SECONDS,
    forceCallCount: true,
    collisionDetectors: [],
  },
};
