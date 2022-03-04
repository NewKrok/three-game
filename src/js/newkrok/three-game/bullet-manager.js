import * as CANNON from "cannon-es";
import * as THREE from "three";

import { EffectId, effectsConfig } from "../effects-config";
import {
  createParticleSystem,
  destroyParticleSystem,
} from "@newkrok/three-particles/src/js/effects/three-particles";

//import { getBulletColliders, getColliders } from "../../main.js";

//import { AudioId } from "../../assets-config.js";
//import { ParticleCollection } from "../effects/particle-system/particle-collection.js";
//import { destroyParticleSystem } from "../effects/particle-system/particle-defaults.js";
//import { getCamera } from "../../game-engine/camera/camera.js";
//import { playAudio } from "../../game-engine/audio/audio.js";

const bulletShape = new CANNON.Sphere(0.02);
const bulletGeometry = new THREE.SphereGeometry(bulletShape.radius, 8, 8);
const shootVelocity = 0.95;
const material = new THREE.MeshLambertMaterial({ color: 0xffff00 });

let bullets = [];
let bulletIndex = 0;

export const shoot = ({ scene, bulletStartPosition, aimingDirection }) => {
  const bulletMesh = new THREE.Mesh(bulletGeometry, material);
  bulletMesh.castShadow = true;
  bulletMesh.receiveShadow = false;
  bulletMesh.position.copy(bulletStartPosition);
  scene.add(bulletMesh);

  const bulletEffect = createParticleSystem(effectsConfig[EffectId.BULLET]);
  bulletMesh.add(bulletEffect);

  bullets.push({
    id: bulletIndex++,
    bornTime: Date.now(),
    mesh: bulletMesh,
    direction: aimingDirection,
    bulletEffect,
  });

  /* playAudio({
    audioId: AudioId.PistolShot,
    cacheId: AudioId.PistolShot,
  }); */
};

export const updateBullets = ({ scene, colliders, destroyables }) => {
  const bulletsToRemove = [];

  bullets.forEach(({ mesh, direction }) => {
    const { x, y, z } = mesh.position;
    const targetPos = mesh.position.clone();
    const maxOffset = shootVelocity;

    if (targetPos) {
      const raycaster = new THREE.Raycaster(targetPos, direction, 0, maxOffset);
      const intersects = raycaster.intersectObjects(colliders, false);

      if (intersects.length === 0) {
        mesh.position.set(
          x + direction.x * maxOffset,
          y + direction.y * maxOffset,
          z + direction.z * maxOffset
        );
      } else {
        mesh.position.copy(intersects[0].point);

        const destroyable = destroyables.find(
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
        }, 1500);

        /*playAudio({
          audioId: AudioId.PistolHit,
          cacheId: AudioId.PistolHit,
          position: intersects[0].point,
          radius: 10,
          scene,
          camera: getCamera(),
        });*/
        bulletsToRemove.push(mesh);
      }
    }
  });

  const now = Date.now();
  bullets = bullets.filter(({ mesh, bornTime, bulletEffect }) => {
    const old = now - bornTime > 50000;
    const isCollided = bulletsToRemove.includes(mesh);
    if (old || isCollided) {
      scene.remove(mesh);
      setTimeout(() => destroyParticleSystem(bulletEffect), 100);
    }

    return !old && !isCollided;
  });
};

/*export const syncBulletPosition = ({ id, bulletId, position, scene }) => {
  const bullet = bullets.find((b) => b.id === id);
  if (bullet) {
    if (bullet.positionTween) bullet.positionTween.kill();
    bullet.positionTween = gsap.to(
      bullet.body ? bullet.body.position : bullet.mesh.position,
      {
        x: position.x,
        y: position.y + 2,
        z: position.z,
        duration: 0.2,
        ease: "linear",
      }
    );
  } else {
    var { x, y, z } = position;
    var bulletMesh = new THREE.Mesh(ballGeometry, material);
    scene.add(bulletMesh);
    bulletMesh.castShadow = true;
    bulletMesh.receiveShadow = false;
    bulletMesh.position.x = x;
    bulletMesh.position.y = y;
    bulletMesh.position.z = z;
    bullets.push({
      bulletId,
      id,
      bornTime: Date.now(),
      mesh: bulletMesh,
    });
  }
};

export const syncOwnBullet = ({ serverCall, isStarted }) => {
  const now = Date.now();
  bullets.forEach((bullet) => {
    if (
      isStarted &&
      bullet.body &&
      (bullet.lastSyncTime === null ||
        bullet.lastSyncTime === undefined ||
        now - bullet.lastSyncTime > 25)
    ) {
      const currentPosition = {
        x: bullet.body.position.x.toFixed(1),
        y: bullet.body.position.y.toFixed(1),
        z: bullet.body.position.z.toFixed(1),
      };
      if (
        bullet === null ||
        bullet.body.position.x !== currentPosition.x ||
        bullet.body.position.y !== currentPosition.y ||
        bullet.body.position.z !== currentPosition.z
      ) {
        bullet.lastSyncTime = now;

        const syncData = {
          lastSyncTime: now,
          bulletId: bullet.id,
          position: { ...currentPosition },
        };

        serverCall({
          header: "updatePosition",
          data: {
            type: "bullet",
            ...syncData,
          },
        });
      }
    }
  });
};
*/
export const getBullets = () => bullets;
