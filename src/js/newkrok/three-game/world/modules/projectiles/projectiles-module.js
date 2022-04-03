import * as THREE from "three";

import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";

const create = ({ scene, modules }) => {
  const projectileGeometry = new THREE.SphereGeometry(0.02, 8, 8);
  const projectileMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff });

  let projectiles = [];
  let bulletIndex = 0;

  let worldOctreeCache;
  const getWorldOctree = () => {
    if (!worldOctreeCache)
      worldOctreeCache = modules.find(
        ({ id }) => id === WorldModuleId.OCTREE
      ).worldOctree;
    return worldOctreeCache;
  };

  const update = () => {
    const projectilesToRemove = [];

    projectiles.forEach(({ mesh, collider, direction, config }) => {
      const worldOctree = getWorldOctree();
      const collisionStep = 0.02;
      let vector = direction.clone().setLength(collisionStep);

      let maxDistance = config.speed;
      let distance = 0;
      while (distance < maxDistance && !worldOctree.sphereIntersect(collider)) {
        distance += collisionStep;
        collider.center.add(vector);
      }
      collider.center.sub(vector);

      if (distance < maxDistance) {
        projectilesToRemove.push(mesh);
        config?.on?.collision({ mesh, position: collider.center });
        /*const destroyable = destroyables.find(
          ({ body }) => intersects[0].object === body
        );
        if (destroyable) destroyable.damage(1);
*/
      }
      mesh.position.copy(collider.center);
    });

    const now = Date.now();
    projectiles = projectiles.filter(({ mesh, bornTime, config }) => {
      const old = now - bornTime > config.lifeTime;
      const isCollided = projectilesToRemove.includes(mesh);
      if (old || isCollided) {
        config?.on?.destroy({ mesh });
        scene.remove(mesh);
      }

      return !old && !isCollided;
    });
  };

  const shoot = ({ startPosition, direction, scene, config }) => {
    const mesh = new THREE.Mesh(projectileGeometry, projectileMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    mesh.position.copy(startPosition);
    scene.add(mesh);

    const collider = new THREE.Sphere(mesh.position.clone(), 0.02);

    config?.on?.shoot({ mesh });

    projectiles.push({
      id: bulletIndex++,
      bornTime: Date.now(),
      mesh,
      collider,
      direction,
      config,
    });
  };

  return { update, shoot };
};

export const projectilesModule = {
  id: WorldModuleId.PROJECTILES,
  create,
  config: {},
};
