import * as THREE from "three";

import { MODULE_ID } from "@newkrok/three-game/src/js/newkrok/three-game/modules/modules.js";

const create = ({ scene, modules }) => {
  const projectileGeometry = new THREE.SphereGeometry(0.02, 8, 8);
  const projectileMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });

  let projectiles = [];
  let bulletIndex = 0;

  let worldOctreeCache;
  const getWorldOctree = () => {
    if (!worldOctreeCache)
      worldOctreeCache = modules.find(
        ({ id }) => id === MODULE_ID.OCTREE
      ).worldOctree;
    return worldOctreeCache;
  };

  const onUpdate = () => {
    const projectilesToRemove = [];

    projectiles.forEach(({ mesh, collider, direction, config: { speed } }) => {
      const projectilePosition = mesh.position.clone();

      if (projectilePosition) {
        const result = getWorldOctree().sphereIntersect(collider);
        if (result) {
          projectilesToRemove.push(mesh);
          console.log(result);
          /*const destroyable = destroyables.find(
            ({ body }) => intersects[0].object === body
          );
          if (destroyable) destroyable.damage(1);
  
          const bulletExplosionEffect = createParticleSystem(
            effectsConfig[EffectId.BULLET_EXPLOSION]
          );
          bulletExplosionEffect.position.copy(mesh.position);
          scene.add(bulletExplosionEffect);
          const bulletExplosionSmokeEffect = createParticleSystem(
            effectsConfig[EffectId.BULLET_EXPLOSION_SMOKE]
          );
          bulletExplosionSmokeEffect.position.copy(mesh.position);
          scene.add(bulletExplosionSmokeEffect);
          setTimeout(() => {
            destroyParticleSystem(bulletExplosionEffect);
            destroyParticleSystem(bulletExplosionSmokeEffect);
          }, 1500);*/
        } else {
          mesh.position.set(
            projectilePosition.x + direction.x * speed,
            projectilePosition.y + direction.y * speed,
            projectilePosition.z + direction.z * speed
          );
        }
      }
    });

    const now = Date.now();
    projectiles = projectiles.filter(
      ({ mesh, bornTime, config: { lifeTime } /* , bulletEffect */ }) => {
        const old = now - bornTime > lifeTime;
        const isCollided = projectilesToRemove.includes(mesh);
        if (old || isCollided) {
          scene.remove(mesh);
          /* setTimeout(() => destroyParticleSystem(bulletEffect), 100); */
        }

        return !old && !isCollided;
      }
    );
  };

  const shoot = ({ startPosition, direction, scene }) => {
    projectiles;

    const mesh = new THREE.Mesh(projectileGeometry, projectileMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    mesh.position.copy(startPosition);
    scene.add(mesh);
    /* 
    const bulletEffect = createParticleSystem(effectsConfig[EffectId.BULLET]);
    mesh.add(bulletEffect);
 */
    projectiles.push({
      id: bulletIndex++,
      bornTime: Date.now(),
      mesh,
      collider: new THREE.Sphere(new THREE.Vector3(0, 0, 0), 0.02),
      direction,
      /* bulletEffect, */
      config: {
        lifeTime: 5000,
        speed: 0.5,
      },
    });
  };

  return { onUpdate, shoot };
};

export const projectilesModule = {
  id: MODULE_ID.PROJECTILES,
  create,
  config: {},
};
